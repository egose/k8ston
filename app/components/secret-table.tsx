'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { IconChevronRight, IconSearch } from '@tabler/icons-react';
import { Badge } from '@egose/shadcn-theme/components/ui/badge';
import { Input } from '@egose/shadcn-theme/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@egose/shadcn-theme/components/ui/table';
import type { SecretSummary } from '@/lib/secrets';
import { ALL_TEAMS, NO_TEAM, TeamSelector } from './team-selector';

interface Props {
  namespace: string;
  secrets: SecretSummary[];
  teams: string[];
  selectedTeam: string;
  onTeamChange: (team: string) => void;
}

export function SecretTable({ namespace, secrets, teams, selectedTeam, onTeamChange }: Props) {
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = secrets.filter((s) => {
      if (selectedTeam === NO_TEAM && (s.team ?? '') !== '') return false;
      if (selectedTeam !== ALL_TEAMS && selectedTeam !== NO_TEAM && (s.team ?? '') !== selectedTeam) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.keys.some((k) => k.toLowerCase().includes(q))
      );
    });
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [secrets, filter, selectedTeam]);

  const showTeamColumn = teams.length > 0 || secrets.some((s) => (s.team ?? '') !== '');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <IconSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter secrets…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <TeamSelector value={selectedTeam} onChange={onTeamChange} teams={teams} disabled={false} />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {showTeamColumn && <TableHead>Team</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Keys</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Description</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showTeamColumn ? 7 : 6} className="py-8 text-center text-muted-foreground">
                  No secrets found{filter ? ` matching "${filter}"` : ''}
                  {selectedTeam !== ALL_TEAMS
                    ? ` for ${selectedTeam === NO_TEAM ? 'unassigned secrets' : `team "${selectedTeam}"`}`
                    : ''}{' '}
                  in this namespace.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.name}>
                  <TableCell>
                    <Link
                      href={`/secrets/${namespace}/${s.name}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {s.name}
                    </Link>
                  </TableCell>
                  {showTeamColumn && (
                    <TableCell>
                      {s.team ? (
                        <Badge variant="secondary" size="sm">
                          {s.team}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="secondary" size="sm">
                      {s.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.keyCount}</TableCell>
                  <TableCell>{s.version > 0 ? `v${s.version}` : '—'}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{s.description || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/secrets/${namespace}/${s.name}`}
                      className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      Open <IconChevronRight size={14} />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {secrets.length} secret{secrets.length === 1 ? '' : 's'}
      </p>
    </div>
  );
}
