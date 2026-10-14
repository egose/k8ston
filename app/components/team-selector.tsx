'use client';

import { useId } from 'react';
import { IconUsers } from '@tabler/icons-react';
import { Label } from '@egose/shadcn-theme/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@egose/shadcn-theme/components/ui/select';

export const ALL_TEAMS = '__all__';
export const NO_TEAM = '__none__';

interface Props {
  value: string;
  onChange: (team: string) => void;
  teams: string[];
  disabled: boolean;
}

/**
 * Team filter dropdown. Value is a team name, ALL_TEAMS, or NO_TEAM
 * (unassigned / namespace default). Hidden when the namespace has no teams.
 */
export function TeamSelector({ value, onChange, teams, disabled }: Props) {
  const id = useId();
  if (teams.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <IconUsers size={16} className="text-muted-foreground" />
      <Label htmlFor={id} className="sr-only">
        Team
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-[200px]">
          <SelectValue placeholder="All teams" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TEAMS}>All teams</SelectItem>
          <SelectItem value={NO_TEAM}>No team (default)</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team} value={team}>
              {team}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
