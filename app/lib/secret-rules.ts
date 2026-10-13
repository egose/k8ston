/** Browser/server rules matching Kubernetes Secret validation. No runtime config. */
export function secretKeyError(key: string): string | null {
  if (!key || key.length > 253 || /[^a-zA-Z0-9._-]/.test(key)) {
    return 'Keys must be 1–253 characters using letters, numbers, ".", "_" or "-"';
  }
  if (key === '.' || key.startsWith('..')) return 'Keys must not be "." or start with ".."';
  return null;
}

/** These controls are binary even if their byte sequences happen to be UTF-8. */
export function isSecretText(value: string): boolean {
  return value.isWellFormed() && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
}

export const BINARY_EDIT_GUIDANCE =
  'This secret contains binary data. Omit data for metadata-only updates; use Kubernetes tooling with base64 data to change its values.';
export const IMMUTABLE_EDIT_GUIDANCE =
  'This secret is immutable. Only metadata can be updated; create a new Secret and update its consumers to change data.';

export function unsupportedSecretTypeReason(type: string): string | null {
  return type === 'kubernetes.io/service-account-token'
    ? 'Service-account token Secrets are controller-owned. Krypton cannot create, update, or restore them. Use the Kubernetes TokenRequest API or the service-account controller to manage tokens.'
    : null;
}

/** Keys here are suggested form rows; validation below defines which are required. */
export const SECRET_TYPE_PRESETS = [
  { value: 'Opaque', hint: 'Arbitrary key-value pairs.', keys: [] },
  {
    value: 'kubernetes.io/basic-auth',
    hint: 'Requires username or password (or both); empty values are allowed.',
    keys: ['username', 'password'],
  },
  { value: 'kubernetes.io/ssh-auth', hint: 'Requires a nonempty ssh-privatekey.', keys: ['ssh-privatekey'] },
  {
    value: 'kubernetes.io/tls',
    hint: 'Requires tls.crt and tls.key; certificate contents are not validated.',
    keys: ['tls.crt', 'tls.key'],
  },
  {
    value: 'kubernetes.io/dockerconfigjson',
    hint: 'Requires .dockerconfigjson containing a JSON object (or null).',
    keys: ['.dockerconfigjson'],
  },
  {
    value: 'kubernetes.io/dockercfg',
    hint: 'Requires .dockercfg containing a JSON object (or null).',
    keys: ['.dockercfg'],
  },
] as const;

/** Accept text or actual bytes, never an ambiguously encoded string. */
export function secretTypeDataError(type: string, data: Record<string, string | Uint8Array>): string | null {
  const unsupported = unsupportedSecretTypeReason(type);
  if (unsupported) return unsupported;
  const has = (key: string) => Object.hasOwn(data, key);
  switch (type) {
    case 'kubernetes.io/basic-auth':
      return has('username') || has('password') ? null : 'Basic-auth Secrets require username or password (or both)';
    case 'kubernetes.io/ssh-auth':
      return has('ssh-privatekey') && data['ssh-privatekey'].length > 0
        ? null
        : 'SSH-auth Secrets require a nonempty ssh-privatekey';
    case 'kubernetes.io/tls':
      return has('tls.crt') && has('tls.key') ? null : 'TLS Secrets require tls.crt and tls.key';
    case 'kubernetes.io/dockerconfigjson':
    case 'kubernetes.io/dockercfg': {
      const key = type === 'kubernetes.io/dockerconfigjson' ? '.dockerconfigjson' : '.dockercfg';
      if (!has(key)) return `This Secret type requires ${key}`;
      const value = data[key];
      // Decode for validation only. Raw restore never re-encodes this result.
      const text = typeof value === 'string' ? value : new TextDecoder('utf-8', { ignoreBOM: true }).decode(value);
      try {
        const parsed: unknown = JSON.parse(text, (_key, v: unknown) => {
          if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('Invalid JSON number');
          return v;
        });
        // Kubernetes unmarshals into a map: objects and null are valid, arrays/scalars aren't.
        if (parsed === null || (typeof parsed === 'object' && !Array.isArray(parsed))) return null;
      } catch {
        /* Do not return parser errors: they can contain credential values. */
      }
      return `${key} must contain a valid JSON object (or null)`;
    }
    default:
      // Native Kubernetes adds no data constraints for Opaque, empty, bootstrap
      // tokens, or custom types. Do not invent a type allowlist or length cap.
      return null;
  }
}
