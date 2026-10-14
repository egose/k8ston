'use client';

import { useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { IconArrowsMaximize, IconEye, IconEyeOff, IconPlus, IconTrash } from '@tabler/icons-react';
import { Button } from '@egose/shadcn-theme/components/ui/button';
import { Input } from '@egose/shadcn-theme/components/ui/input';
import { Label } from '@egose/shadcn-theme/components/ui/label';
import { Textarea } from '@egose/shadcn-theme/components/ui/textarea';
import { Alert } from '@egose/shadcn-theme/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@egose/shadcn-theme/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@egose/shadcn-theme/components/ui/select';
import { api, ApiError } from '@/lib/api-client';
import type { SecretDetail } from '@/lib/secrets';
import { secretTypeSchema, slugifyK8sName } from '@/lib/validation';
import {
  BINARY_EDIT_GUIDANCE,
  IMMUTABLE_EDIT_GUIDANCE,
  SECRET_TYPE_PRESETS,
  secretTypeDataError,
  unsupportedSecretTypeReason,
} from '@/lib/secret-rules';
import { parseBulkEntries, secretEntriesToData } from '@/lib/secret-form-data';
import { reloadSecret, secretQueryOptions } from '@/lib/secret-queries';
import { ValueDialog } from './value-dialog';
import { RevealValue } from './reveal-value';

const NO_TEAM_VALUE = '__none__';

const formSchema = z.object({
  // Slugify BEFORE validating so submit-without-blur (e.g. pressing Enter
  // with "test secret" typed) still passes — the blur handler only fixes
  // the visible input, while this fixes the validated/submitted value.
  name: z
    .string()
    .transform((s) => slugifyK8sName(s))
    .pipe(
      z
        .string()
        .min(1, 'Name is required')
        .max(253)
        .regex(
          /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
          'Use lowercase letters, numbers, "-" or "." (e.g. database-credentials)',
        ),
    ),
  type: secretTypeSchema,
  description: z.string().max(1024),
  allowedGroups: z.string(),
  allowedUsers: z.string(),
  team: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const CUSTOM_TYPE = '__custom__';

function suggestedKeysForType(type: string | undefined): readonly string[] {
  return SECRET_TYPE_PRESETS.find((p) => p.value === type)?.keys ?? [];
}

interface Entry {
  id: number;
  key: string;
  value: string;
  revealed: boolean;
}

let nextId = 1;
const toEntries = (data: Record<string, string>): Entry[] =>
  Object.entries(data).map(([key, value]) => ({ id: nextId++, key, value, revealed: false }));

function parseCsv(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

interface Props {
  mode: 'create' | 'edit';
  namespace: string;
  initial?: SecretDetail;
  canCreate?: boolean;
  /** All teams in the namespace (empty = teams hidden). */
  teams?: string[];
  /** Teams the user may create/move secrets in; namespace members see all. */
  creatableTeams?: string[];
}

const defaultValues = (secret?: SecretDetail): FormValues => ({
  name: secret?.name ?? '',
  type: secret?.type ?? 'Opaque',
  description: secret?.description ?? '',
  allowedGroups: (secret?.allowedGroups ?? []).join(', '),
  allowedUsers: (secret?.allowedUsers ?? []).join(', '),
  team: secret?.team ?? '',
});
const isCustomType = (secret?: SecretDetail) =>
  secret != null && !SECRET_TYPE_PRESETS.some((preset) => preset.value === secret.type);

export function SecretForm({ mode, namespace, initial, canCreate, teams = [], creatableTeams }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formId = useId();
  // Creation targets: creatable teams (+ unassigned iff canCreate). Edit also
  // keeps the current team so unrelated edits never force a move.
  const currentTeam = initial?.team ?? '';
  const creatable = creatableTeams ?? teams;
  const showTeamField = teams.length > 0 || currentTeam !== '';
  // Unassigned is pickable on create only when creation allows it (team-only
  // creators must pick a team); on edit it is always shown and the server
  // enforces move permission (preserving an existing unassigned needs none).
  const showUnassignedOption = mode === 'edit' ? true : canCreate !== false;
  const teamOptions = Array.from(new Set([currentTeam, ...creatable].filter((t) => t !== '')));
  // Team-only creators default to their first creatable team instead of unassigned.
  const initialTeam =
    mode === 'create' && !initial && canCreate === false && creatable.length > 0 ? creatable[0] : (initial?.team ?? '');
  // The draft and its revision are one baseline. Query props may change during
  // reconnects or while Activity hides this form; those changes cannot rebase it.
  const [baseline, setBaseline] = useState(initial);
  const [entries, setEntries] = useState<Entry[]>(() =>
    baseline ? toEntries(baseline.data) : [{ id: nextId++, key: '', value: '', revealed: false }],
  );
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [reloadError, setReloadError] = useState<string | null>(null);
  const [bulkDraft, setBulkDraft] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [openEntryId, setOpenEntryId] = useState<number | null>(null);
  const openEntry = entries.find((e) => e.id === openEntryId) ?? null;
  const readOnlyReason = baseline ? unsupportedSecretTypeReason(baseline.type) : null;
  const dataReadOnly = !!baseline && (baseline.immutable || baseline.binaryKeys.length > 0 || readOnlyReason !== null);
  const newerRevision = baseline && initial && baseline.resourceVersion !== initial.resourceVersion;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultValues(baseline), team: baseline?.team ?? initialTeam },
  });

  const nameField = form.register('name');

  // Start in custom mode when editing/creating from a non-preset type.
  // Local mirror of the type field (avoids form.watch, which trips
  // react-hooks/incompatible-library) — kept in sync via the pickers below.
  const [customType, setCustomType] = useState(() => isCustomType(baseline));
  const [selectedType, setSelectedType] = useState(baseline?.type ?? 'Opaque');
  const [selectedTeam, setSelectedTeam] = useState(baseline?.team ?? initialTeam);
  const pickTeam = (v: string) => {
    const team = v === NO_TEAM_VALUE ? '' : v;
    setSelectedTeam(team);
    form.setValue('team', team, { shouldDirty: true, shouldValidate: true });
  };
  const typeHint = customType
    ? 'Custom type — preserved exactly. Service-account token creation and editing are unsupported.'
    : (SECRET_TYPE_PRESETS.find((p) => p.value === selectedType)?.hint ?? 'Arbitrary key-value pairs.');

  function resetDraft(secret?: SecretDetail) {
    setBaseline(secret);
    const defaults = defaultValues(secret);
    // Preserve the team-only create default when resetting to a blank form.
    if (!secret && mode === 'create') defaults.team = initialTeam;
    form.reset(defaults);
    setEntries(secret ? toEntries(secret.data) : [{ id: nextId++, key: '', value: '', revealed: false }]);
    setCustomType(isCustomType(secret));
    setSelectedType(secret?.type ?? 'Opaque');
    setSelectedTeam(secret?.team ?? (!secret && mode === 'create' ? initialTeam : ''));
    setOpenEntryId(null);
    setBulkDraft('');
    setBulkError(null);
    setDataError(null);
    setConflict(false);
    setReloadError(null);
  }

  async function reloadLatest() {
    if (!baseline || saving || reloading) return;
    setReloading(true);
    setReloadError(null);
    try {
      const latest = await reloadSecret(queryClient, namespace, baseline.name);
      resetDraft(latest.secret);
      toast.success('Latest secret loaded. Review it and re-apply your changes.');
    } catch (error) {
      setReloadError(error instanceof Error ? error.message : 'Latest secret unavailable');
    } finally {
      setReloading(false);
    }
  }

  // Add suggested rows from the shared type rules. Never removes user rows —
  // only fully-untouched placeholder rows are dropped to keep things tidy.
  const scaffoldRequiredKeys = (typeValue: string) => {
    const missing = suggestedKeysForType(typeValue).filter((k) => !entries.some((e) => e.key === k));
    if (missing.length === 0) return;
    const kept = entries.filter((e) => e.key.trim() !== '' || e.value !== '');
    setEntries([...kept, ...missing.map((key) => ({ id: nextId++, key, value: '', revealed: false }))]);
    toast.success(`Added suggested key(s) for "${typeValue}": ${missing.join(', ')}`);
  };

  const pickType = (v: string) => {
    if (v === CUSTOM_TYPE) {
      setCustomType(true);
      form.setValue('type', '', { shouldDirty: true });
    } else {
      setCustomType(false);
      setSelectedType(v);
      form.setValue('type', v, { shouldDirty: true, shouldValidate: true });
      scaffoldRequiredKeys(v);
    }
  };
  const backToPresets = () => {
    setCustomType(false);
    setSelectedType('Opaque');
    form.setValue('type', 'Opaque', { shouldDirty: true, shouldValidate: true });
  };

  const payloadBytes = useMemo(() => {
    let size = 0;
    for (const e of entries) {
      size += new TextEncoder().encode(e.key).length + new TextEncoder().encode(e.value).length;
    }
    return Math.ceil(size * 1.4);
  }, [entries]);
  const overLimit = payloadBytes > 1024 * 1024;

  const setEntry = (id: number, patch: Partial<Entry>) => {
    setDataError(null);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };
  const removeEntry = (id: number) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const addEntry = () => setEntries((prev) => [...prev, { id: nextId++, key: '', value: '', revealed: false }]);

  const importEntries = () => {
    const parsed = parseBulkEntries(bulkDraft, entries);
    if (!parsed.ok) {
      setBulkError(parsed.error);
      return;
    }
    const kept = entries.filter((entry) => entry.key !== '' || entry.value !== '');
    setEntries([...kept, ...parsed.value.map((entry) => ({ ...entry, id: nextId++, revealed: false }))]);
    setBulkDraft('');
    setBulkError(null);
    setDataError(null);
    toast.success(`Imported ${parsed.value.length} ${parsed.value.length === 1 ? 'entry' : 'entries'}`);
  };

  const onSubmit = async (values: FormValues) => {
    if (saving || reloading || (mode === 'create' && !canCreate)) return;
    if (readOnlyReason) {
      toast.error(readOnlyReason);
      return;
    }
    let data: Record<string, string> = Object.create(null);
    setDataError(null);
    if (!dataReadOnly) {
      if (bulkDraft.trim()) {
        setBulkError('Import or clear the bulk draft before saving.');
        return;
      }
      const parsed = secretEntriesToData(entries);
      if (!parsed.ok) {
        setDataError(parsed.error);
        return;
      }
      data = parsed.value;
      // Updates preserve the live type. Both boundaries use the same native rules.
      const effectiveType = mode === 'create' ? values.type : (baseline?.type ?? 'Opaque');
      const typeError = secretTypeDataError(effectiveType, data);
      if (typeError) {
        toast.error(typeError);
        return;
      }
    }
    setSaving(true);
    setConflict(false);
    try {
      if (mode === 'create') {
        // Defensive: slugify again in case the user submits without blurring.
        const name = slugifyK8sName(values.name);
        await api.createSecret(namespace, {
          name,
          type: values.type || 'Opaque',
          data,
          description: values.description,
          allowedGroups: parseCsv(values.allowedGroups),
          allowedUsers: parseCsv(values.allowedUsers),
          ...(showTeamField && values.team ? { team: values.team } : {}),
        });
        toast.success(`Secret "${name}" created`);
        // Activity retains this page on navigation; a completed create starts fresh.
        resetDraft();
        // The dashboard list is cached (staleTime 15s) — force a refetch so the
        // new secret appears when navigating back. (The detail page uses a fresh
        // query key, so it always fetches.)
        await queryClient.invalidateQueries({ queryKey: ['secrets', namespace] });
        router.push(`/secrets/${namespace}/${name}`);
      } else {
        if (!baseline) return;
        const result = await api.updateSecret(namespace, baseline.name, {
          ...(dataReadOnly ? {} : { data }),
          description: values.description,
          allowedGroups: parseCsv(values.allowedGroups),
          allowedUsers: parseCsv(values.allowedUsers),
          // Omit when unchanged to preserve; "" explicitly clears to unassigned.
          ...(showTeamField && values.team !== (baseline.team ?? '') ? { team: values.team } : {}),
          resourceVersion: baseline.resourceVersion,
        });
        const queryKey = secretQueryOptions(namespace, baseline.name).queryKey;
        await queryClient.cancelQueries({ queryKey, exact: true });
        queryClient.setQueryData(queryKey, result);
        resetDraft(result.secret);
        toast.success(`Secret "${baseline.name}" updated — previous version saved to history`);
        // Edit and detail views share the ['secret', ns, name] cache entry: without
        // invalidation the detail page would render pre-edit data until the 15s
        // staleTime lapses (router.refresh() only re-fetches RSC payloads).
        await queryClient.invalidateQueries({ queryKey });
        await queryClient.invalidateQueries({ queryKey: ['versions', namespace, baseline.name] });
        await queryClient.invalidateQueries({ queryKey: ['secrets', namespace] });
        router.push(`/secrets/${namespace}/${baseline.name}`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(true);
        toast.error(mode === 'create' ? 'A secret with this name already exists' : 'Write conflict — reload and retry');
      } else {
        toast.error(err instanceof Error ? err.message : 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      aria-labelledby={`${formId}-title`}
      aria-busy={saving || reloading}
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      {readOnlyReason && (
        <Alert variant="info">
          <div>{readOnlyReason}</div>
        </Alert>
      )}
      {baseline?.immutable && (
        <Alert variant="info">
          <div>{IMMUTABLE_EDIT_GUIDANCE}</div>
        </Alert>
      )}
      {!!baseline?.binaryKeys.length && (
        <Alert variant="info">
          <div>{BINARY_EDIT_GUIDANCE} Saving this form preserves all data byte-for-byte.</div>
        </Alert>
      )}
      {mode === 'edit' && (
        <Alert variant={conflict || newerRevision ? 'warning' : 'info'}>
          <div className="flex flex-col gap-2 text-sm">
            {conflict && <p role="alert">This secret changed since you loaded it. Reload and re-apply your changes.</p>}
            {!conflict && newerRevision && (
              <p role="status">A newer revision is available. Your draft still uses its original revision.</p>
            )}
            <p>
              Reload latest replaces all draft fields with the latest secret only after a successful fetch. Review it
              before saving.
            </p>
            {reloadError && (
              <p role="alert">Reload failed: {reloadError}. Your draft and its original revision are unchanged.</p>
            )}
            <div>
              <Button
                type="button"
                variant="secondary"
                appearance="outline"
                size="sm"
                loading={reloading}
                disabled={saving || reloading}
                onClick={() => void reloadLatest()}
              >
                Reload latest
              </Button>
            </div>
          </div>
        </Alert>
      )}

      <fieldset disabled={saving || reloading} className="flex min-w-0 flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle id={`${formId}-title`}>{mode === 'create' ? 'New secret' : `Edit ${baseline?.name}`}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-name`}>Name</Label>
                <Input
                  id={`${formId}-name`}
                  {...nameField}
                  disabled={mode === 'edit'}
                  placeholder="database-credentials"
                  onBlur={(e) => {
                    if (mode === 'create') {
                      const slugified = slugifyK8sName(e.target.value);
                      if (slugified !== e.target.value) {
                        form.setValue('name', slugified, { shouldValidate: true, shouldDirty: true });
                      }
                    }
                    void nameField.onBlur(e);
                  }}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
                {mode === 'create' && !form.formState.errors.name && (
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, &ldquo;-&rdquo; or &ldquo;.&rdquo; — spaces become dashes (e.g.
                    &ldquo;test secret&rdquo; &rarr; &ldquo;test-secret&rdquo;).
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-type`}>Type</Label>
                {mode === 'edit' ? (
                  // Updates preserve live.type server-side — editing here would be silently ignored.
                  <Input id={`${formId}-type`} value={baseline?.type ?? 'Opaque'} disabled />
                ) : customType ? (
                  <>
                    <Input
                      id={`${formId}-type`}
                      {...form.register('type')}
                      placeholder="example.com/my-type"
                      autoFocus
                    />
                    <button type="button" className="self-start text-xs font-medium underline" onClick={backToPresets}>
                      ← back to presets
                    </button>
                  </>
                ) : (
                  <Select value={selectedType} onValueChange={pickType}>
                    <SelectTrigger id={`${formId}-type`} className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECRET_TYPE_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.value}
                        </SelectItem>
                      ))}
                      <SelectItem value={CUSTOM_TYPE}>Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {mode === 'create' && form.formState.errors.type && (
                  <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
                )}
                {mode === 'create' && !form.formState.errors.type && (
                  <p className="text-xs text-muted-foreground">{typeHint}</p>
                )}
                {mode === 'edit' && (
                  <p className="text-xs text-muted-foreground">Kept from the existing secret — not editable here.</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-description`}>Description</Label>
              <Input
                id={`${formId}-description`}
                {...form.register('description')}
                disabled={!!readOnlyReason}
                placeholder="What is this used for?"
              />
            </div>
            {showTeamField && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-team`}>Team</Label>
                <Select
                  value={selectedTeam === '' ? NO_TEAM_VALUE : selectedTeam}
                  onValueChange={pickTeam}
                  disabled={!!readOnlyReason}
                >
                  <SelectTrigger id={`${formId}-team`} className="w-full">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {showUnassignedOption && <SelectItem value={NO_TEAM_VALUE}>No team (namespace default)</SelectItem>}
                    {teamOptions.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Team members see only their team&apos;s secrets; namespace members see all teams. Unassigned secrets
                  use namespace rules only.
                </p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-allowedGroups`}>Allowed SSO groups (comma-separated)</Label>
                <Input
                  id={`${formId}-allowedGroups`}
                  {...form.register('allowedGroups')}
                  disabled={!!readOnlyReason}
                  placeholder="dev-team, database-admins"
                />
                <p className="text-xs text-muted-foreground">
                  SSO groups that can access this secret. Leave empty to use this namespace&apos;s default.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-allowedUsers`}>Allowed users (comma-separated emails)</Label>
                <Input
                  id={`${formId}-allowedUsers`}
                  {...form.register('allowedUsers')}
                  disabled={!!readOnlyReason}
                  placeholder="alice@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Individual users (by email) that can access this secret.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key–value data</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {dataError && (
              <p role="alert" className="text-sm text-destructive">
                {dataError}
              </p>
            )}
            {entries.map((e, index) => {
              const lineCount = e.value === '' ? 0 : e.value.split('\n').length;
              const multiline = lineCount > 1 || e.value.includes('\r');
              // Read-only when multiline: single-line inputs strip "\n" on edit
              // and would clobber newlines saved via the expand dialog.
              const displayValue = !multiline
                ? e.value
                : e.revealed
                  ? `${e.value.split('\n')[0]}  ⏎ ${lineCount} lines — expand to edit`
                  : `••••••••  ⏎ ${lineCount} lines — expand to view`;
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <Label className="sr-only" htmlFor={`${formId}-key-${e.id}`}>
                    Data key {index + 1}
                  </Label>
                  <Input
                    id={`${formId}-key-${e.id}`}
                    placeholder="KEY"
                    value={e.key}
                    readOnly={dataReadOnly}
                    onChange={(ev) => setEntry(e.id, { key: ev.target.value })}
                    className="w-48 font-mono"
                  />
                  <div className="relative flex-1">
                    <Label className="sr-only" htmlFor={`${formId}-value-${e.id}`}>
                      Value for {e.key || `entry ${index + 1}`}
                    </Label>
                    <Input
                      id={`${formId}-value-${e.id}`}
                      type={e.revealed || multiline ? 'text' : 'password'}
                      placeholder="value"
                      value={displayValue}
                      onChange={(ev) => setEntry(e.id, { value: ev.target.value })}
                      readOnly={multiline || dataReadOnly}
                      className="pr-9 font-mono"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setEntry(e.id, { revealed: !e.revealed })}
                      aria-label={e.revealed ? 'Hide' : 'Show'}
                    >
                      {e.revealed ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    appearance="ghost"
                    size="icon-sm"
                    onClick={() => setOpenEntryId(e.id)}
                    aria-label="Expand value"
                  >
                    <IconArrowsMaximize size={15} />
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    appearance="ghost"
                    size="icon-sm"
                    onClick={() => removeEntry(e.id)}
                    disabled={dataReadOnly}
                    aria-label="Remove entry"
                  >
                    <IconTrash size={15} />
                  </Button>
                </div>
              );
            })}
            {baseline?.binaryKeys.map((key, index) => (
              <div key={key} className="flex items-center gap-2">
                <Label className="sr-only" htmlFor={`${formId}-binary-key-${index}`}>
                  Data key {entries.length + index + 1} (binary)
                </Label>
                <Input id={`${formId}-binary-key-${index}`} value={key} readOnly className="w-48 font-mono" />
                <RevealValue value={baseline.binaryData[key]} keyName={key} binary />
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="secondary"
                appearance="outline"
                size="sm"
                onClick={addEntry}
                disabled={dataReadOnly}
              >
                <IconPlus size={15} /> Add entry
              </Button>
            </div>
            {!dataReadOnly && (
              <p className={`text-xs ${overLimit ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
                Size: ~{(payloadBytes / 1024).toFixed(1)} KB of 1 MB maximum.
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-bulk`}>Bulk entries (KEY=value per line)</Label>
              <Textarea
                id={`${formId}-bulk`}
                placeholder={'DB_HOST=db.internal\nDB_PASSWORD=s3cret'}
                rows={3}
                disabled={dataReadOnly}
                className="font-mono text-xs"
                value={bulkDraft}
                aria-invalid={!!bulkError}
                aria-describedby={`${formId}-bulk-help${bulkError ? ` ${formId}-bulk-error` : ''}`}
                onChange={(ev) => {
                  setBulkDraft(ev.target.value);
                  setBulkError(null);
                }}
              />
              <p id={`${formId}-bulk-help`} className="text-xs text-muted-foreground">
                Type or paste, then choose Import entries. Blank lines are ignored; keys are trimmed, values keep spaces
                and &ldquo;=&rdquo;. Existing keys are never overwritten.
              </p>
              {bulkError && (
                <p id={`${formId}-bulk-error`} role="alert" className="text-sm text-destructive">
                  {bulkError}
                </p>
              )}
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  appearance="outline"
                  size="sm"
                  disabled={dataReadOnly || !bulkDraft.trim()}
                  onClick={importEntries}
                >
                  Import entries
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </fieldset>

      {openEntry && (
        <ValueDialog
          open
          onOpenChange={(o) => !o && setOpenEntryId(null)}
          entryKey={openEntry.key}
          value={openEntry.value}
          mode={dataReadOnly ? 'view' : 'edit'}
          onSave={dataReadOnly ? undefined : (next) => setEntry(openEntry.id, { value: next })}
        />
      )}

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={
            saving || reloading || (mode === 'create' && !canCreate) || !!readOnlyReason || (!dataReadOnly && overLimit)
          }
        >
          {mode === 'create' ? 'Create secret' : 'Save changes'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          appearance="outline"
          disabled={saving || reloading}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
