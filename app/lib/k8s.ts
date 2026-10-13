import * as k8s from '@kubernetes/client-node';
import * as fs from 'node:fs';
import { Readable } from 'node:stream';
import { URLSearchParams } from 'node:url';
import { request as sendRequest } from 'undici';
import { config } from './config';
import type { SessionUser } from './auth';
import { SecretMapCoreV1Api } from './k8s-secret-codec';
import { HttpError, kubernetesFailure } from './errors';

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
  return getKubeConfig().makeApiClient(SecretMapCoreV1Api);
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

/** Per-request options type for the generated API clients (version-proof). */
export type K8sRequestOptions = Parameters<k8s.CoreV1Api['readNamespacedSecret']>[1];

/**
 * Carry the full human identity through the SDK's supported httpApi extension.
 * RequestContext's string-valued headers overwrite repeated groups, and Fetch
 * Headers coalesces them. Undici's raw header pairs preserve separate values.
 * Capture identity per options object; never modify a shared client/KubeConfig.
 */
export function requestOptions(user: SessionUser | null): K8sRequestOptions {
  if (!config.impersonation || config.authDisabled || !user) return undefined;
  const email = user.email;
  const groups = [...user.groups];
  // Reject identities that HTTP would trim or cannot represent losslessly.
  if ([email, ...groups].some((value) => !value || value.trim() !== value || /[^\x20-\x7e]/.test(value))) {
    throw new HttpError(
      400,
      'Kubernetes impersonation requires nonempty printable ASCII user/group values without surrounding whitespace',
    );
  }
  return {
    httpApi: k8s.wrapHttpLibrary({
      async send(request) {
        // Authentication and middleware (including patch Content-Type) have
        // already run. Replace only impersonation fields, retaining SA auth.
        const headers = Object.entries(request.getHeaders())
          .filter(([name]) => !name.toLowerCase().startsWith('impersonate-'))
          .flat();
        headers.push('Impersonate-User', email);
        for (const group of groups) headers.push('Impersonate-Group', group);

        const body = request.getBody();
        const response = await sendRequest(request.getUrl(), {
          method: request.getHttpMethod(),
          headers,
          body: body instanceof URLSearchParams ? body.toString() : body,
          signal: request.getSignal(),
          // Preserve the SDK's CA/client certificate/proxy/TLS configuration.
          dispatcher: request.getDispatcher(),
        });
        const responseHeaders: Record<string, string> = {};
        for (const [name, value] of Object.entries(response.headers)) {
          if (value !== undefined) responseHeaders[name] = Array.isArray(value) ? value.join(', ') : value;
        }
        return new k8s.ResponseContext(response.statusCode, responseHeaders, {
          text: () => response.body.text(),
          binary: async () => Buffer.from(await response.body.arrayBuffer()),
          stream: () => Readable.toWeb(response.body) as ReadableStream<Uint8Array>,
        });
      },
    }),
  };
}

/** Request options for strategic-merge patches (+ impersonation when enabled). */
export function patchOptions(user: SessionUser | null): K8sRequestOptions {
  return k8s.setHeaderOptions('Content-Type', 'application/strategic-merge-patch+json', requestOptions(user));
}

/**
 * Request options for RFC 6902 JSON Patch (+ impersonation when enabled).
 * Restarts use this so UID/resourceVersion `test` preconditions are enforced
 * atomically by the API server; strategic-merge bodies have no test semantics.
 */
export function jsonPatchOptions(user: SessionUser | null): K8sRequestOptions {
  return k8s.setHeaderOptions('Content-Type', 'application/json-patch+json', requestOptions(user));
}

/** Retain numeric status semantics, never upstream messages, values, or headers. */
export function toK8sError(err: unknown): { status: number; message: string } {
  const failure = kubernetesFailure(err);
  return {
    status: failure.httpStatus ?? 500,
    message:
      failure.httpStatus === undefined
        ? 'Request failed unexpectedly. Check service health and retry.'
        : `Kubernetes API (${failure.httpStatus}): ${failure.message}`,
  };
}
