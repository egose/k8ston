import { expect, it } from 'vitest';
import {
  consumerSecret,
  consumerTemplate,
  consumerUser,
  consumerWorkload,
  mockConsumers,
  privateConsumerMarker,
  statefulConsumer,
} from './helpers/consumers';
import { headerValues, loopbackKubernetes, SERVICE_TOKEN } from './helpers/kubernetes-transport';

it('preserves full per-user transport identity on overlapping successful and failed workload lists/patches', async () => {
  process.env.K8STON_IMPERSONATION = 'true';
  const mock = await mockConsumers();
  const alice = {
    ...consumerUser,
    email: 'dev@k8ston.local',
    groups: [...Array.from({ length: 35 }, (_, i) => `alice-${i}`), 'literal,comma'],
  };
  const bob = { ...consumerUser, sub: 'bob', email: 'bob@example.test', groups: ['bob-team', 'second-team'] };
  const server = await loopbackKubernetes(async (request) => {
    const path = new URL(request.url, 'http://loopback.test').pathname;
    const failure = (status: number) => ({
      status,
      body: { kind: 'Status', message: privateConsumerMarker, data: { credential: privateConsumerMarker } },
      headers: { 'x-private-upstream': privateConsumerMarker },
    });
    // Real SDK requests overlap so shared-client identity leakage would be visible.
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
    if (path.endsWith('/deployments'))
      return {
        body: {
          items: [
            consumerWorkload(
              'env-consumer',
              consumerTemplate({
                ephemeralContainers: [{ name: 'debug', envFrom: [{ secretRef: { name: consumerSecret } }] }],
              }),
            ),
            consumerWorkload(
              'unrelated',
              consumerTemplate({
                containers: [
                  {
                    name: 'app',
                    args: [consumerSecret],
                    env: [{ name: 'OTHER', valueFrom: { secretKeyRef: { key: 'value', name: 'different' } } }],
                  },
                ],
              }),
            ),
          ],
        },
      };
    if (path.endsWith('/statefulsets'))
      return path.includes('/alice/')
        ? failure(403)
        : {
            body: {
              items: [
                statefulConsumer(
                  'projected-consumer',
                  consumerTemplate({
                    volumes: [{ name: 'projected', projected: { sources: [{ secret: { name: consumerSecret } }] } }],
                  }),
                ),
              ],
            },
          };
    if (path.endsWith('/daemonsets'))
      return {
        body: {
          items: [
            consumerWorkload('pull-consumer', consumerTemplate({ imagePullSecrets: [{ name: consumerSecret }] })),
          ],
        },
      };
    if (request.method === 'PATCH')
      return path.includes('/bob/') && path.endsWith('/pull-consumer') ? failure(409) : { body: {} };
    return failure(500);
  });
  mock.getAppsApi.mockReturnValue(server.apps);
  const { restartConsumers } = await import('@/lib/consumers');
  const [aliceResult, bobResult] = await Promise.all([
    restartConsumers('alice', consumerSecret, alice),
    restartConsumers('bob', consumerSecret, bob),
  ]);
  expect(aliceResult).toMatchObject({
    status: 'partial',
    matched: 2,
    failures: [],
    discoveryFailures: [{ kind: 'StatefulSet', code: 'forbidden', httpStatus: 403 }],
  });
  expect(aliceResult.requested).toEqual([
    { kind: 'Deployment', name: 'env-consumer' },
    { kind: 'DaemonSet', name: 'pull-consumer' },
  ]);
  expect(bobResult).toMatchObject({
    status: 'partial',
    matched: 3,
    discoveryFailures: [],
    failures: [{ kind: 'DaemonSet', name: 'pull-consumer', code: 'conflict', httpStatus: 409 }],
  });
  expect(bobResult.requested).toEqual([
    { kind: 'Deployment', name: 'env-consumer' },
    { kind: 'StatefulSet', name: 'projected-consumer' },
  ]);
  expect(JSON.stringify([aliceResult, bobResult])).not.toContain(privateConsumerMarker);
  expect(server.requests).toHaveLength(11); // six lists, five patches (including one rejected patch)
  for (const request of server.requests) {
    const user = request.url.includes('/alice/') ? alice : bob;
    expect(headerValues(request, 'Impersonate-User')).toEqual([user.email]);
    expect(headerValues(request, 'Impersonate-Group')).toEqual(user.groups);
    expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
    expect(request.url).not.toContain('/unrelated');
    if (request.method === 'PATCH') {
      expect(headerValues(request, 'Content-Type')).toEqual(['application/json-patch+json']);
      const name = request.url.split('/').pop()!;
      expect(JSON.parse(request.body)).toEqual([
        { op: 'test', path: '/metadata/uid', value: `synthetic-uid-${name}` },
        { op: 'test', path: '/metadata/resourceVersion', value: '1001' },
        {
          op: 'add',
          path: '/spec/template/metadata',
          value: {
            annotations: {
              'k8ston.io/restarted-at': expect.any(String),
            },
          },
        },
      ]);
    }
  }
});
