import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSessionUser, type SessionUser } from './auth';
import { toK8sError } from './k8s';
import { errorStatus, HttpError } from './errors';

export { HttpError } from './errors';

// Includes JSON escaping/punctuation and create's overlapping data/stringData
// maps. The separate native data-size validator still applies after parsing.
export const JSON_BODY_LIMIT = 16 * 1024 * 1024;

/** Count actual UTF-8 bytes before parsing, including chunked/misreported bodies. */
export async function readJson(req: Request): Promise<unknown> {
  const length = req.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > JSON_BODY_LIMIT)) {
    void req.body?.cancel().catch(() => {});
    throw new HttpError(
      /^\d+$/.test(length) ? 413 : 400,
      /^\d+$/.test(length) ? 'JSON body exceeds the 16 MiB request limit' : 'Invalid Content-Length',
    );
  }
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, 'A valid JSON body is required');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  let complete = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        complete = true;
        break;
      }
      bytes += value.byteLength;
      if (bytes > JSON_BODY_LIMIT) throw new HttpError(413, 'JSON body exceeds the 16 MiB request limit');
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // SyntaxError and stream failures can include submitted values/headers.
    throw new HttpError(400, 'A valid UTF-8 JSON body is required');
  } finally {
    if (!complete) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Explicit browser/proxy policy for authenticated JSON and auth redirects. */
export function noStore<T extends Response>(response: T): T {
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function jsonResponse(body: unknown, init?: ResponseInit): NextResponse {
  return noStore(NextResponse.json(body, init));
}

/** 401 when unauthenticated (SSO required unless AUTH_DISABLED=true). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, 'Authentication required');
  return user;
}

export function jsonError(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return jsonResponse({ error: err.message }, { status: errorStatus(err) ?? 500 });
  }
  if (err instanceof ZodError) {
    // Zod issues can contain input, enum values, arbitrary keys, and custom
    // messages. Publish only known top-level fields and fixed classifications.
    const fields = new Set([
      'name',
      'type',
      'data',
      'stringData',
      'binaryData',
      'description',
      'allowedGroups',
      'allowedUsers',
      'team',
      'resourceVersion',
      'version',
      'keepHistory',
    ]);
    const messages: Record<string, string> = {
      invalid_type: 'Unexpected value type',
      too_small: 'Required value is missing or below the minimum',
      too_big: 'Value exceeds the documented limit',
      invalid_format: 'Invalid value format',
      unrecognized_keys: 'Unsupported fields',
      custom: 'Value does not meet the documented constraints',
    };
    const readOnlyFields: Record<string, string> = {
      binaryData:
        'binaryData is a read-only response field; use Kubernetes tooling with base64 data to write binary values',
      stringData: 'stringData is only supported on create; use plaintext data for text updates',
    };
    const issues = err.issues.slice(0, 20).map((issue) => ({
      path: typeof issue.path[0] === 'string' && fields.has(issue.path[0]) ? [issue.path[0]] : [],
      code: Object.hasOwn(messages, issue.code) ? issue.code : 'invalid_value',
      message:
        issue.code === 'invalid_type' &&
        issue.expected === 'never' &&
        typeof issue.path[0] === 'string' &&
        Object.hasOwn(readOnlyFields, issue.path[0])
          ? readOnlyFields[issue.path[0]]
          : Object.hasOwn(messages, issue.code)
            ? messages[issue.code]
            : 'Invalid value',
    }));
    return jsonResponse({ error: 'Validation failed', issues }, { status: 400 });
  }
  const k8s = toK8sError(err);
  return jsonResponse({ error: k8s.message }, { status: k8s.status });
}

/** Translate K8s 409 (resourceVersion conflict) into a friendly message. */
export function isConflict(err: unknown): boolean {
  return toK8sError(err).status === 409;
}
