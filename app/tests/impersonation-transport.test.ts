import * as sdk from '@kubernetes/client-node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { headerValues, loopbackKubernetes, SERVICE_TOKEN } from './helpers/kubernetes-transport';

const alice = { sub: 'alice-id', email: 'alice@example.test', name: 'Alice', groups: ['developers', 'operators'] };
const secretRequest = { namespace: 'unit-test', name: 'credentials' };
const patch = { spec: { template: { metadata: { annotations: { 'k8ston.io/restarted-at': 'synthetic-time' } } } } };

beforeEach(() => {
  process.env.K8STON_IMPERSONATION = 'true';
  vi.stubEnv('NODE_TLS_REJECT_UNAUTHORIZED', '1');
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('generated SDK transport at the outbound wire boundary', () => {
  it.each([0, 1, 33, 256])('sends all %i groups as distinct headers, including literal commas', async (count) => {
    const { requestOptions } = await import('@/lib/k8s');
    const server = await loopbackKubernetes(() => ({ body: { metadata: { name: 'credentials' } } }));
    const groups = Array.from({ length: count }, (_, i) => (i === 1 ? 'team,with,commas' : `team-${i}`));
    const secret = await server.core.readNamespacedSecret(
      { ...secretRequest, pretty: 'true' },
      requestOptions({ ...alice, groups }),
    );
    expect(secret.metadata?.name).toBe('credentials');
    expect(server.requests).toHaveLength(1);
    const [request] = server.requests;
    expect(request.url).toBe('/api/v1/namespaces/unit-test/secrets/credentials?pretty=true');
    expect(headerValues(request, 'Impersonate-Group')).toEqual(groups);
    expect(headerValues(request, 'Impersonate-User')).toEqual([alice.email]);
    expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
    expect(headerValues(request, 'User-Agent')).toEqual(['kubernetes-client-javascript/2.0.0']);
  });

  it('isolates overlapping users and snapshots options without mutating the shared client', async () => {
    const { patchOptions } = await import('@/lib/k8s');
    let releaseAlice!: () => void;
    const bobArrived = new Promise<void>((resolve) => {
      releaseAlice = resolve;
    });
    const server = await loopbackKubernetes(async (request) => {
      if (request.url.endsWith('/alice')) await bobArrived;
      if (request.url.endsWith('/bob')) releaseAlice();
      return { body: {} };
    });
    const mutableAlice = { ...alice, groups: [...alice.groups] };
    const aliceOptions = patchOptions(mutableAlice);
    const bob = { ...alice, sub: 'bob-id', email: 'bob@example.test', groups: ['readers', 'team,with,commas'] };
    const bobOptions = patchOptions(bob);
    mutableAlice.email = 'must-not-be-forwarded@example.test';
    mutableAlice.groups.push('must-not-be-forwarded');

    await Promise.all([
      server.apps.patchNamespacedDeployment({ namespace: 'unit-test', name: 'alice', body: patch }, aliceOptions),
      server.apps.patchNamespacedDeployment({ namespace: 'unit-test', name: 'bob', body: patch }, bobOptions),
    ]);
    await server.core.readNamespacedConfigMap({ namespace: 'unit-test', name: 'k8ston-access' });
    expect(server.requests).toHaveLength(3);
    for (const user of [alice, bob]) {
      const request = server.requests.find((req) => req.url.endsWith(`/${user === alice ? 'alice' : 'bob'}`))!;
      expect(request.method).toBe('PATCH');
      expect(headerValues(request, 'Impersonate-User')).toEqual([user.email]);
      expect(headerValues(request, 'Impersonate-Group')).toEqual(user.groups);
      expect(headerValues(request, 'Content-Type')).toEqual(['application/strategic-merge-patch+json']);
      expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
      expect(JSON.parse(request.body)).toEqual(patch);
    }
    expect(headerValues(server.requests[2], 'Impersonate-User')).toEqual([]);
    expect(headerValues(server.requests[2], 'Impersonate-Group')).toEqual([]);
    expect(headerValues(server.requests[2], 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
    expect(server.kubeConfig.getCurrentUser()?.impersonateUser).toBeUndefined();
  });

  it('also supports generated clients without an SDK-supplied dispatcher', async () => {
    const { requestOptions } = await import('@/lib/k8s');
    const server = await loopbackKubernetes();
    const core = new sdk.CoreV1Api(
      sdk.createConfiguration({
        baseServer: new sdk.ServerConfiguration(server.origin, {}),
        authMethods: {
          default: {
            getName: () => 'synthetic-service-account',
            applySecurityAuthentication: async (request) => {
              request.setHeaderParam('Authorization', `Bearer ${SERVICE_TOKEN}`);
            },
          },
        },
      }),
    );
    await core.readNamespacedSecret(secretRequest, requestOptions(alice));
    expect(headerValues(server.requests[0], 'Impersonate-Group')).toEqual(alice.groups);
    expect(headerValues(server.requests[0], 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
  });

  it('preserves SDK CA verification, TLS server name, and freshly applied ServiceAccount auth', async () => {
    const { patchOptions, requestOptions } = await import('@/lib/k8s');
    const server = await loopbackKubernetes(() => ({ body: {} }), true);
    await server.apps.patchNamespacedDeployment(
      { namespace: 'unit-test', name: 'consumer', body: patch },
      patchOptions(alice),
    );
    server.kubeConfig.loadFromClusterAndUser(server.kubeConfig.getCurrentCluster()!, {
      ...server.kubeConfig.getCurrentUser()!,
      token: 'synthetic-rotated-service-account-token',
    });
    await server.core.readNamespacedSecret(secretRequest, requestOptions(alice));
    expect(server.requests).toHaveLength(2);
    expect(headerValues(server.requests[0], 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
    expect(headerValues(server.requests[0], 'Content-Type')).toEqual(['application/strategic-merge-patch+json']);
    expect(headerValues(server.requests[1], 'Authorization')).toEqual([
      'Bearer synthetic-rotated-service-account-token',
    ]);
    for (const request of server.requests) expect(headerValues(request, 'Impersonate-Group')).toEqual(alice.groups);
    expect(server.kubeConfig.getCurrentCluster()?.skipTLSVerify).toBe(false);
  });

  it.each(['untrusted CA', 'wrong server name'])('rejects TLS with %s before sending HTTP', async (failure) => {
    const { requestOptions } = await import('@/lib/k8s');
    const server = await loopbackKubernetes(() => ({ body: {} }), true);
    server.kubeConfig.loadFromClusterAndUser(
      {
        ...server.kubeConfig.getCurrentCluster()!,
        ...(failure === 'untrusted CA' ? { caData: undefined } : { tlsServerName: 'wrong.example.test' }),
      },
      server.kubeConfig.getCurrentUser()!,
    );
    await expect(server.core.readNamespacedSecret(secretRequest, requestOptions(alice))).rejects.toMatchObject({
      code: failure === 'untrusted CA' ? 'DEPTH_ZERO_SELF_SIGNED_CERT' : 'ERR_TLS_CERT_ALTNAME_INVALID',
    });
    expect(server.requests).toHaveLength(0);
  });

  it('retains Kubernetes status with safe effective-identity guidance', async () => {
    const { requestOptions, toK8sError } = await import('@/lib/k8s');
    const body = { kind: 'Status', message: 'Synthetic human RBAC denial', reason: 'Forbidden', code: 403 };
    const server = await loopbackKubernetes(() => ({ status: 403, body }));
    const error = await server.core.readNamespacedSecret(secretRequest, requestOptions(alice)).catch((err) => err);
    expect(error).toBeInstanceOf(sdk.ApiException);
    expect(toK8sError(error)).toMatchObject({ status: 403, message: expect.stringContaining('effective identity') });
    expect(toK8sError(error).message).not.toContain(body.message);
    expect(headerValues(server.requests[0], 'Impersonate-Group')).toEqual(alice.groups);
  });
});

describe('explicit service-identity modes', () => {
  it.each([
    { mode: 'hybrid', impersonation: false, authDisabled: false, user: alice },
    { mode: 'auth-disabled', impersonation: true, authDisabled: true, user: alice },
    { mode: 'service policy', impersonation: true, authDisabled: false, user: null },
  ])(
    '$mode retains ServiceAccount auth and patch content type without impersonation',
    async ({ impersonation, authDisabled, user }) => {
      process.env.K8STON_IMPERSONATION = String(impersonation);
      process.env.AUTH_DISABLED = String(authDisabled);
      const { requestOptions, patchOptions } = await import('@/lib/k8s');
      const server = await loopbackKubernetes();
      await server.core.readNamespacedSecret(secretRequest, requestOptions(user));
      await server.apps.patchNamespacedDeployment(
        { namespace: 'unit-test', name: 'consumer', body: patch },
        patchOptions(user),
      );
      expect(server.requests).toHaveLength(2);
      for (const request of server.requests) {
        expect(headerValues(request, 'Impersonate-User')).toEqual([]);
        expect(headerValues(request, 'Impersonate-Group')).toEqual([]);
        expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
      }
      expect(headerValues(server.requests[1], 'Content-Type')).toEqual(['application/strategic-merge-patch+json']);
    },
  );
});

describe('lossless HTTP identity values', () => {
  it.each(['', ' padded', 'padded ', 'bad\r\nInjected: value', 'non-ascii-\u00e9', 'tab\tgroup'])(
    'rejects an unsupported group %j instead of changing it',
    async (group) => {
      const { requestOptions } = await import('@/lib/k8s');
      const server = await loopbackKubernetes();
      expect(() =>
        server.core.readNamespacedSecret(secretRequest, requestOptions({ ...alice, groups: ['valid', group] })),
      ).toThrow(expect.objectContaining({ status: 400, message: expect.stringContaining('printable ASCII') }));
      expect(server.requests).toHaveLength(0);
    },
  );

  it('applies the same lossless validation to the user', async () => {
    const { requestOptions } = await import('@/lib/k8s');
    expect(() => requestOptions({ ...alice, email: ' alice@example.test' })).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });
});
