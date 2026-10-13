import type { V1Secret } from '@kubernetes/client-node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { mockKubernetes } from './helpers/kubernetes';
import { headerValues, loopbackKubernetes, SERVICE_TOKEN } from './helpers/kubernetes-transport';
import { boundSnapshot, historyName, persistedSnapshot } from './helpers/history';

const namespace = 'unit-test';
// A signed, auth-enabled session must not bypass impersonation because its
// email happens to match the local development user's email.
const human = {
  sub: 'real-oidc-subject',
  email: 'dev@krypton.local',
  name: 'SSO user',
  groups: [...Array.from({ length: 35 }, (_, i) => `team-${i}`), 'developers'],
};
const live: V1Secret = {
  metadata: {
    namespace,
    name: 'credentials',
    uid: 'synthetic-live-uid',
    resourceVersion: '17',
    annotations: { 'krypton.io/managed-by': 'krypton', 'krypton.io/version': '3' },
  },
  data: { credential: Buffer.from('synthetic-live-value').toString('base64') },
};
const snapshots = [2, 1].map((version) =>
  boundSnapshot(
    {
      ...live,
      metadata: { ...live.metadata, resourceVersion: `historical-${version}` },
    },
    version,
    { credential: Buffer.from('synthetic-history-value').toString('base64') },
  ),
);
const corePath = `/api/v1/namespaces/${namespace}`;
const secretPath = `${corePath}/secrets`;
const appsPath = `/apis/apps/v1/namespaces/${namespace}`;
const policyPath = `${corePath}/configmaps/krypton-access`;
const kinds = ['deployments', 'statefulsets', 'daemonsets'];

async function setupClients() {
  const mock = await mockKubernetes();
  const storedSnapshots = [...snapshots];
  const deleted = new Set<string>();
  const server = await loopbackKubernetes((request) => {
    const url = new URL(request.url, 'http://loopback.test');
    if (url.pathname === '/api/v1/namespaces') return { body: { items: [{ metadata: { name: namespace } }] } };
    if (url.pathname === policyPath)
      return {
        body: {
          data: {
            'access.json': JSON.stringify({ [namespace]: { groups: ['developers'] } }),
          },
        },
      };
    if (url.pathname.startsWith(secretPath)) {
      if (request.method === 'POST') {
        const body = persistedSnapshot(JSON.parse(request.body));
        if (body.metadata?.labels?.['krypton.io/kind'] === 'history') storedSnapshots.push(body);
        return { status: 201, body };
      }
      if (request.method === 'PUT') return { body: JSON.parse(request.body) };
      if (request.method === 'DELETE') {
        deleted.add(url.pathname);
        return { body: { status: 'Success' } };
      }
      if (deleted.has(url.pathname)) return { status: 404, body: { status: 'Failure' } };
      if (url.pathname === secretPath)
        return {
          body: {
            items: url.searchParams.has('labelSelector')
              ? storedSnapshots.filter((s) => !deleted.has(`${secretPath}/${s.metadata!.name}`))
              : [live],
          },
        };
      return { body: live };
    }
    for (const kind of kinds) {
      if (url.pathname === `${appsPath}/${kind}`)
        return {
          body: {
            items: [
              {
                metadata: { name: `${kind}-consumer`, uid: `synthetic-uid-${kind}-consumer`, resourceVersion: '1001' },
                spec: {
                  selector: {},
                  template: {
                    spec: {
                      containers: [
                        {
                          name: 'consumer',
                          envFrom: [{ secretRef: { name: 'credentials' } }],
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        };
      if (url.pathname === `${appsPath}/${kind}/${kind}-consumer` && request.method === 'PATCH') return { body: {} };
    }
    return { status: 500, body: { message: 'Unexpected synthetic Kubernetes call' } };
  });
  mock.getCoreApi.mockReturnValue(server.core);
  mock.getAppsApi.mockReturnValue(server.apps);
  return server;
}

type Handler = (request: Request, ctx: { params: Promise<{ namespace: string; name: string }> }) => Promise<Response>;
type Action = {
  label: string;
  method: string;
  path: string;
  body?: Record<string, unknown>;
  status: number;
  expected: string[];
  load: () => Promise<Handler>;
};
const nsList = 'GET /api/v1/namespaces';
const liveRead = `GET ${secretPath}/credentials`;
const historyList = `GET ${secretPath}`;
const snapshotCreate = `POST ${secretPath}`;
const cleanup = [2, 1].flatMap((version) => {
  const path = `${secretPath}/${historyName(live.metadata!.uid!, version)}`;
  return [`DELETE ${path}`, `GET ${path}`];
});
const replace = `PUT ${secretPath}/credentials`;
const routePath = `/api/namespaces/${namespace}/secrets`;
const restartAction: Action = {
  label: 'restart consumers',
  method: 'POST',
  path: `${routePath}/credentials/restart-consumers`,
  status: 200,
  expected: [
    nsList,
    liveRead,
    ...kinds.flatMap((kind) => [`GET ${appsPath}/${kind}`, `PATCH ${appsPath}/${kind}/${kind}-consumer`]),
  ],
  load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/restart-consumers/route')).POST,
};
const actions: Action[] = [
  {
    label: 'list namespaces',
    method: 'GET',
    path: '/api/namespaces',
    status: 200,
    expected: [nsList],
    load: async () => (await import('@/app/api/namespaces/route')).GET,
  },
  {
    label: 'list secrets',
    method: 'GET',
    path: routePath,
    status: 200,
    expected: [nsList, `GET ${secretPath}`],
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/route')).GET,
  },
  {
    label: 'create secret',
    method: 'POST',
    path: routePath,
    status: 201,
    body: { name: 'new-secret', data: { credential: 'synthetic-new-value' } },
    expected: [nsList, `POST ${secretPath}`],
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/route')).POST,
  },
  {
    label: 'read live secret',
    method: 'GET',
    path: `${routePath}/credentials`,
    status: 200,
    expected: [nsList, liveRead],
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/route')).GET,
  },
  {
    label: 'update and prune history',
    method: 'PUT',
    path: `${routePath}/credentials`,
    status: 200,
    body: { resourceVersion: '17', data: { credential: 'synthetic-updated-value' } },
    expected: [nsList, liveRead, snapshotCreate, historyList, ...cleanup, replace],
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/route')).PUT,
  },
  {
    label: 'delete live and historical secrets',
    method: 'DELETE',
    path: `${routePath}/credentials?resourceVersion=17`,
    status: 200,
    expected: [
      nsList,
      ...Array<string>(6).fill(liveRead),
      `DELETE ${secretPath}/credentials`,
      historyList,
      historyList,
      ...cleanup,
    ],
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/route')).DELETE,
  },
  {
    label: 'list history',
    method: 'GET',
    path: `${routePath}/credentials/versions`,
    status: 200,
    expected: [nsList, liveRead, historyList],
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/versions/route')).GET,
  },
  {
    label: 'restore and prune history',
    method: 'POST',
    path: `${routePath}/credentials/restore`,
    status: 200,
    body: { version: 1, resourceVersion: '17' },
    expected: [nsList, liveRead, historyList, liveRead, snapshotCreate, historyList, ...cleanup, replace],
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route')).POST,
  },
  restartAction,
];

async function signIn() {
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(human));
  expect(await auth.getSessionUser()).toEqual(human);
}

async function invoke(action: Action) {
  const handler = await action.load();
  return handler(
    new Request(`${TEST_APP_URL}${action.path}`, {
      method: action.method,
      ...(action.body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action.body) } : {}),
    }),
    { params: Promise.resolve({ namespace, name: 'credentials' }) },
  );
}

beforeEach(() => {
  process.env.KRYPTON_IMPERSONATION = 'true';
  process.env.KRYPTON_RESTART_ENABLED = 'true';
  process.env.KRYPTON_HISTORY_LIMIT = '1';
  process.env.KRYPTON_SCOPE = 'cluster';
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('human-authorized callsites with a real signed development-email session', () => {
  it.each(actions)('$label forwards the complete human identity on every authorized call', async (action) => {
    const server = await setupClients();
    await signIn();
    const response = await invoke(action);
    expect(response.status, await response.text()).toBe(action.status);
    const humanRequests = server.requests.filter((request) => request.url !== policyPath);
    expect(humanRequests.map((request) => `${request.method} ${request.url.split('?')[0]}`).sort()).toEqual(
      [...action.expected].sort(),
    );
    for (const request of humanRequests) {
      expect(headerValues(request, 'Impersonate-User')).toEqual([human.email]);
      expect(headerValues(request, 'Impersonate-Group')).toEqual(human.groups);
      expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
      if (request.method === 'PATCH') {
        expect(headerValues(request, 'Content-Type')).toEqual(['application/json-patch+json']);
      }
    }
    const policyRequests = server.requests.filter((request) => request.url === policyPath);
    expect(policyRequests).toHaveLength(action.label === 'list namespaces' ? 0 : 1);
    for (const request of policyRequests) {
      expect(headerValues(request, 'Impersonate-User')).toEqual([]);
      expect(headerValues(request, 'Impersonate-Group')).toEqual([]);
      expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
    }
  });
});

it.each(['hybrid', 'auth-disabled'])('keeps all workload list/patch operations usable in %s mode', async (mode) => {
  process.env.AUTH_DISABLED = String(mode === 'auth-disabled');
  process.env.KRYPTON_IMPERSONATION = String(mode !== 'hybrid');
  const server = await setupClients();
  if (mode === 'hybrid') await signIn();
  const response = await invoke(restartAction);
  expect(response.status, await response.text()).toBe(200);
  const authorized = server.requests.filter((request) => request.url !== policyPath);
  expect(authorized.map((request) => `${request.method} ${request.url.split('?')[0]}`).sort()).toEqual(
    [...restartAction.expected].sort(),
  );
  for (const request of authorized.filter((request) => request.url.includes('?'))) {
    expect(new URL(request.url, TEST_APP_URL).searchParams.get('limit')).toBe('100');
  }
  for (const request of server.requests) {
    expect(headerValues(request, 'Impersonate-User')).toEqual([]);
    expect(headerValues(request, 'Impersonate-Group')).toEqual([]);
    expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
    if (request.method === 'PATCH')
      expect(headerValues(request, 'Content-Type')).toEqual(['application/json-patch+json']);
  }
});

it('coalesces service-policy reads across humans and applies the shared policy to each identity', async () => {
  const server = await setupClients();
  const { canCreateInNamespace } = await import('@/lib/authz');
  const bob = { sub: 'bob-id', email: 'bob@example.test', name: 'Bob', groups: ['other-team'] };
  expect(await Promise.all([canCreateInNamespace(human, namespace), canCreateInNamespace(bob, namespace)])).toEqual([
    true,
    false,
  ]);
  expect(await canCreateInNamespace(bob, namespace)).toBe(false);
  expect(await canCreateInNamespace(human, namespace)).toBe(true);
  expect(server.requests).toHaveLength(1);
  expect(server.requests[0].url).toBe(policyPath);
  expect(headerValues(server.requests[0], 'Impersonate-User')).toEqual([]);
  expect(headerValues(server.requests[0], 'Impersonate-Group')).toEqual([]);
  expect(headerValues(server.requests[0], 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
});
