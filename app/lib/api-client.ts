'use client';

import type { SecretDetail, SecretSummary, SecretVersion, DeleteSecretResult } from './secrets';
import type { RestartResult } from './consumers';
import type { SessionUser } from './auth';
import type { DeleteSecretInput, RestoreSecretInput } from './validation';

export interface PublicConfig {
  scope: 'namespace' | 'cluster';
  etcdEncrypted: boolean;
  authDisabled: boolean;
  oidcConfigured: boolean;
  historyLimit: number;
  managedOnly: boolean;
  restartEnabled: boolean;
  appNamespace: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  readFailureResult?: (status: number, body: unknown) => T | undefined,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    // An operation can finish with a typed failure report. Keep the one shared
    // error-body reader, while allowing that endpoint to retain its result.
    const result = readFailureResult?.(res.status, body);
    if (result !== undefined) return result;
    // Bounce to SSO only for *app-session* 401s — a 401 from the Kubernetes
    // API itself (bad SA/kubeconfig) must surface as an error, not a login loop.
    const sessionExpired = res.status === 401 && (body.error === 'Authentication required' || path === '/api/auth/me');
    if (sessionExpired && typeof window !== 'undefined') {
      // Hard navigation is intentional: this runs outside React (no router),
      // and expiry must reset all client-side cached secrets/state.
      if (!window.location.pathname.startsWith('/login')) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login';
      }
    }
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export const api = {
  config: () => request<PublicConfig>('/api/config'),
  me: () => request<{ user: SessionUser }>('/api/auth/me'),
  namespaces: () => request<{ scope: string; namespaces: string[] }>('/api/namespaces'),

  listSecrets: (ns: string) =>
    request<{
      namespace: string;
      secrets: SecretSummary[];
      canCreate: boolean;
      teams: string[];
      creatableTeams: string[];
    }>(`/api/namespaces/${encodeURIComponent(ns)}/secrets`),
  getSecret: (ns: string, name: string, signal?: AbortSignal) =>
    request<{ secret: SecretDetail }>(`/api/namespaces/${encodeURIComponent(ns)}/secrets/${encodeURIComponent(name)}`, {
      signal,
      cache: 'no-store',
    }),
  createSecret: (
    ns: string,
    input: {
      name: string;
      type?: string;
      data: Record<string, string>;
      description?: string;
      allowedGroups?: string[];
      allowedUsers?: string[];
      team?: string;
    },
  ) =>
    request<{ secret: SecretSummary }>(`/api/namespaces/${encodeURIComponent(ns)}/secrets`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateSecret: (
    ns: string,
    name: string,
    input: {
      data?: Record<string, string>;
      description?: string;
      allowedGroups?: string[];
      allowedUsers?: string[];
      team?: string;
      resourceVersion: string;
    },
  ) =>
    request<{ secret: SecretDetail }>(`/api/namespaces/${encodeURIComponent(ns)}/secrets/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  deleteSecret: (ns: string, name: string, input: DeleteSecretInput) => {
    const query = new URLSearchParams({ resourceVersion: input.resourceVersion });
    if (input.keepHistory) query.set('keepHistory', 'true');
    return request<DeleteSecretResult>(
      `/api/namespaces/${encodeURIComponent(ns)}/secrets/${encodeURIComponent(name)}?${query}`,
      {
        method: 'DELETE',
      },
    );
  },
  listVersions: (ns: string, name: string, signal?: AbortSignal) =>
    request<{ namespace: string; name: string; versions: SecretVersion[] }>(
      `/api/namespaces/${encodeURIComponent(ns)}/secrets/${encodeURIComponent(name)}/versions`,
      { signal, cache: 'no-store' },
    ),
  restoreVersion: (ns: string, name: string, input: RestoreSecretInput) =>
    request<{ secret: SecretDetail }>(
      `/api/namespaces/${encodeURIComponent(ns)}/secrets/${encodeURIComponent(name)}/restore`,
      { method: 'POST', body: JSON.stringify(input) },
    ),
  restartConsumers: (ns: string, name: string) =>
    request<RestartResult>(
      `/api/namespaces/${encodeURIComponent(ns)}/secrets/${encodeURIComponent(name)}/restart-consumers`,
      { method: 'POST' },
      (status, body) => {
        // Only completed failed attempts use this envelope. Session, feature-flag,
        // authorization, and preparation errors still throw the normal ApiError.
        if (status === 503 && body && typeof body === 'object' && 'status' in body && body.status === 'failed') {
          return body as RestartResult;
        }
      },
    ),
};
