import { secretKeyError } from './secret-rules';
import { secretDataSchema } from './validation';

export interface SecretEntry {
  key: string;
  value: string;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Only completely empty placeholder rows may be omitted. Never mutate the draft. */
export function secretEntriesToData(entries: readonly SecretEntry[]): Result<Record<string, string>> {
  const data: Record<string, string> = Object.create(null);
  for (const [index, entry] of entries.entries()) {
    if (entry.key === '' && entry.value === '') continue;
    if (!entry.key.trim() && entry.value !== '') {
      return { ok: false, error: `Entry ${index + 1} has a value but no key. Add a key or remove the entry.` };
    }
    if (Object.hasOwn(data, entry.key)) return { ok: false, error: `Duplicate key "${entry.key}"` };
    data[entry.key] = entry.value;
  }
  const parsed = secretDataSchema.safeParse(data);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, error: parsed.error.issues[0].message };
}

/** An explicit, atomic import: validate existing rows and every line before adding any rows. */
export function parseBulkEntries(source: string, existing: readonly SecretEntry[]): Result<SecretEntry[]> {
  const current = secretEntriesToData(existing);
  if (!current.ok) return { ok: false, error: `Existing entries: ${current.error}` };
  const keys = new Set(Object.keys(current.value));
  const entries: SecretEntry[] = [];
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const separator = line.indexOf('=');
    if (separator < 0) return { ok: false, error: `Line ${index + 1} must use KEY=value.` };
    const key = line.slice(0, separator).trim();
    if (!key) return { ok: false, error: `Line ${index + 1} needs a key before "=".` };
    const keyError = secretKeyError(key);
    if (keyError) return { ok: false, error: `Line ${index + 1}: ${keyError}` };
    if (keys.has(key))
      return { ok: false, error: `Line ${index + 1}: duplicate key "${key}" (already in the form or import).` };
    keys.add(key);
    // Split only at the first '='. Preserve value whitespace and any further '='.
    entries.push({ key, value: line.slice(separator + 1) });
  }
  if (entries.length === 0) return { ok: false, error: 'Enter at least one KEY=value line.' };
  const combined = secretEntriesToData([...existing, ...entries]);
  return combined.ok ? { ok: true, value: entries } : combined;
}
