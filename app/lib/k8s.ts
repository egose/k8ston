import * as k8s from '@kubernetes/client-node';
import * as fs from 'node:fs';
import { config } from './config';
import type { SessionUser } from './auth';

const SA_TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const SA_NAMESPACE_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';

let kubeConfig: k8s.KubeConfig | null = null;

function isInCluster(): boolean {
  return fs.existsSync(SA_TOKEN_PATH);
}

/** Load in-cluster ServiceAccount config, falling back to local kubeconfig for dev. */
export function getKubeConfig(): k8s.KubeConfig {
  if (kubeConfig) return kubeConfig;
  const kc = new k8s.KubeConfig();
  if (isInCluster()) {
    // Uses KUBERNETES_SERVICE_HOST/PORT + mounted SA token + CA automatically.
    kc.loadFromCluster();
  } else {
    kc.loadFromDefault();
  }
  kubeConfig = kc;
  return kc;
}

export function getCoreApi(): k8s.CoreV1Api {
  return getKubeConfig().makeApiClient(k8s.CoreV1Api);
}

export function getAppsApi(): k8s.AppsV1Api {
  return getKubeConfig().makeApiClient(k8s.AppsV1Api);
}

/** Namespace the pod is running in (downward API / SA mount / env fallback). */
export function getPodNamespace(): string {
  if (fs.existsSync(SA_NAMESPACE_PATH)) {
    try {
      return fs.readFileSync(SA_NAMESPACE_PATH, 'utf8').trim() || config.appNamespace;
    } catch {
      return config.appNamespace;
    }
  }
  return config.appNamespace;
}

export function isInClusterRuntime(): boolean {
  return isInCluster();
}

/**
 * Optional K8s-native impersonation. When enabled (and the API server trusts
 * the same OIDC issuer), requests are evaluated against the HUMAN's RBAC
 * instead of the app ServiceAccount. Otherwise the app SA executes all calls
 * and Krypton enforces authz itself via annotations/ConfigMap (hybrid mode).
 */
export function impersonationHeaders(user: SessionUser | null): Record<string, string> {
  if (!config.impersonation || !user || user.email === 'dev@krypton.local') return {};
  const headers: Record<string, string> = { 'Impersonate-User': user.email };
  // Groups need repeated Impersonate-Group headers; the middleware helper sets
  // one value per call, so chain one per group (capped for sanity).
  return headers;
}

/** Per-request options type for the generated API clients (version-proof). */
export type K8sRequestOptions = Parameters<k8s.CoreV1Api['readNamespacedSecret']>[1];

/** Request options carrying impersonation headers (via middleware) when enabled. */
export function requestOptions(user: SessionUser | null): K8sRequestOptions {
  const headers = impersonationHeaders(user);
  if (Object.keys(headers).length === 0) return undefined;
  let opts = k8s.setHeaderOptions('Impersonate-User', headers['Impersonate-User']);
  for (const group of (user?.groups ?? []).slice(0, 32)) {
    opts = k8s.setHeaderOptions('Impersonate-Group', group, opts);
  }
  return opts as K8sRequestOptions;
}

/** Request options for strategic-merge patches (+ impersonation when enabled). */
export function patchOptions(user: SessionUser | null): K8sRequestOptions {
  const base = (requestOptions(user) as Parameters<typeof k8s.setHeaderOptions>[2]) ?? undefined;
  const opts = k8s.setHeaderOptions('Content-Type', 'application/strategic-merge-patch+json', base);
  return opts as K8sRequestOptions;
}

/**
 * Extract the human-readable message from a K8s Status body, whether the
 * client handed us a parsed object, a JSON string, or a Buffer.
 * client-node v2's `getBodyAsAny()` returns raw text, so `ApiException.body`
 * is usually a string like '{"kind":"Status","message":"secrets is
 * forbidden: ...","reason":"Forbidden",...}' — not an object.
 */
function extractBodyMessage(body: unknown): string | undefined {
  if (body === null || body === undefined) return undefined;
  if (typeof body === 'object' && !(body instanceof Uint8Array) && !Buffer.isBuffer(body)) {
    const b = body as { message?: unknown; reason?: unknown };
    if (typeof b.message === 'string' && b.message) return b.message;
    if (typeof b.reason === 'string' && b.reason) return b.reason;
    return undefined;
  }
  let text: string | undefined;
  if (typeof body === 'string') text = body;
  else if (Buffer.isBuffer(body)) text = body.toString('utf8');
  else if (body instanceof Uint8Array) text = Buffer.from(body).toString('utf8');
  if (!text) return undefined;
  text = text.trim();
  if (!text) return undefined;
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text) as { message?: unknown; reason?: unknown };
      if (typeof parsed.message === 'string' && parsed.message) return parsed.message;
      if (typeof parsed.reason === 'string' && parsed.reason) return parsed.reason;
    } catch {
      // not JSON — fall through to raw text
    }
  }
  return text;
}

/**
 * Normalize K8s client errors into { status, message }.
 * ApiException messages embed raw headers — extract the API Status message
 * (or the "Message:" line) so responses stay clean.
 * All K8s failures are prefixed so the UI can tell them apart from
 * app-session 401s (which trigger a login bounce).
 *
 * client-node v2 throws `ApiException(code, "Unknown API Status Code!", ...)`
 * for every non-200/non-401 response, so the Message line is useless — the
 * real reason (e.g. the RBAC "forbidden" detail) lives in `body` or in the
 * embedded "Body:" JSON of `err.message`.
 */
export function toK8sError(err: unknown): { status: number; message: string } {
  if (err instanceof k8s.ApiException) {
    const fromBody = extractBodyMessage(err.body);
    // Fallback: parse the "Body:" JSON embedded in err.message
    // ("HTTP-Code: X\nMessage: ...\nBody: {...}\nHeaders: {...}").
    // Body is JSON.stringify(rawBody); rawBody is usually a JSON string
    // already, so unquote once before extracting the Status message.
    let fromText: string | undefined;
    const msg = err.message ?? '';
    const bodyLine = /Body:\s*([\s\S]+?)\s*\nHeaders:/.exec(msg)?.[1] ?? /Body:\s*(.+)\s*$/.exec(msg)?.[1];
    if (bodyLine) {
      const trimmed = bodyLine.trim();
      let unwrapped: unknown = trimmed;
      try {
        unwrapped = JSON.parse(trimmed);
      } catch {
        // keep raw
      }
      fromText = extractBodyMessage(unwrapped) ?? extractBodyMessage(trimmed);
    }
    if (!fromText) {
      const messageLine = /Message:\s*(.+)/.exec(msg)?.[1]?.trim();
      if (messageLine && messageLine !== 'Unknown API Status Code!') fromText = messageLine;
    }
    const detail = fromBody ?? fromText ?? `request failed (HTTP ${err.code ?? 'error'})`;
    const status = err.code ?? 500;
    let message = `Kubernetes API (${err.code ?? 'error'}): ${detail.slice(0, 300)}`;
    if (status === 403) {
      message += ' — Access denied. Contact your administrator (the app is missing Kubernetes RBAC permission).';
    }
    return { status, message };
  }
  if (err instanceof Error) return { status: 500, message: err.message.slice(0, 300) };
  return { status: 500, message: 'Unknown Kubernetes error' };
}
