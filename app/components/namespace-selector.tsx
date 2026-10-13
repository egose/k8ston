'use client';

import { useId } from 'react';
import { IconBox } from '@tabler/icons-react';
import { Label } from '@egose/shadcn-theme/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@egose/shadcn-theme/components/ui/select';

interface Props {
  value: string;
  onChange: (ns: string) => void;
  namespaces: string[];
  disabled: boolean;
  placeholder: string;
}

export function NamespaceSelector({ value, onChange, namespaces, disabled, placeholder }: Props) {
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <IconBox size={16} className="text-muted-foreground" />
      <Label htmlFor={id} className="sr-only">
        Namespace
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-[220px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {namespaces.map((ns) => (
            <SelectItem key={ns} value={ns}>
              {ns}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
