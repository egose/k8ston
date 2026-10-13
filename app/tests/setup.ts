import { afterEach, beforeEach, vi } from 'vitest';
import { resetTestEnvironment } from './helpers/environment';

const request = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    store: {
      get: vi.fn((name: string) => (values.has(name) ? { name, value: values.get(name)! } : undefined)),
      getAll: vi.fn(() => [...values].map(([name, value]) => ({ name, value }))),
      set: vi.fn((name: string, value: string) => {
        values.set(name, value);
      }),
      delete: vi.fn((name: string) => {
        values.delete(name);
      }),
    },
  };
});

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => request.store) }));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: vi.fn(async () => {}),
}));

vi.mock('@kubernetes/client-node', async (importOriginal) => {
  const sdk = await importOriginal<typeof import('@kubernetes/client-node')>();
  const fail = () => {
    throw new Error('Unit tests must supply synthetic Kubernetes configuration');
  };
  return {
    ...sdk,
    KubeConfig: class extends sdk.KubeConfig {
      loadFromDefault = fail;
      loadFromCluster = fail;
      loadFromFile = fail;
    },
  };
});

// Also runs before any test module's static app imports.
resetTestEnvironment();

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  resetTestEnvironment();
  request.values.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('Unit tests must provide a synthetic fetch response');
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
