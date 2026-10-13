'use client';

import { useState } from 'react';
import { IconArrowsMaximize, IconCopy, IconEye, IconEyeOff } from '@tabler/icons-react';
import { Button } from '@egose/shadcn-theme/components/ui/button';
import { useClipboard } from '@egose/shadcn-theme/hooks/use-clipboard';
import { ValueDialog } from './value-dialog';
import { BinaryValueDialog } from './binary-value-dialog';

/** Values are masked by default — mirroring kubectl's redaction behavior. */
export function RevealValue({ value, keyName, binary = false }: { value: string; keyName: string; binary?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { copy } = useClipboard();

  return (
    <div className="flex items-center gap-1.5">
      {binary && <span className="text-xs text-muted-foreground">Binary · base64</span>}
      <code className="max-w-[420px] flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
        {revealed ? value || <span className="opacity-50">(empty)</span> : '••••••••••••'}
      </code>
      <Button
        variant="secondary"
        appearance="ghost"
        size="icon-xs"
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? (binary ? 'Hide base64' : 'Hide value') : binary ? 'Reveal base64' : 'Reveal value'}
      >
        {revealed ? <IconEyeOff size={14} /> : <IconEye size={14} />}
      </Button>
      <Button
        variant="secondary"
        appearance="ghost"
        size="icon-xs"
        onClick={() => setExpanded(true)}
        aria-label={binary ? 'Expand base64' : 'Expand value'}
      >
        <IconArrowsMaximize size={14} />
      </Button>
      <Button
        variant="secondary"
        appearance="ghost"
        size="icon-xs"
        onClick={() => copy(value)}
        aria-label={binary ? 'Copy base64' : 'Copy value'}
      >
        <IconCopy size={14} />
      </Button>
      {expanded &&
        (binary ? (
          <BinaryValueDialog value={value} keyName={keyName} onClose={() => setExpanded(false)} />
        ) : (
          <ValueDialog
            open
            onOpenChange={(o) => !o && setExpanded(false)}
            entryKey={keyName}
            value={value}
            mode="view"
          />
        ))}
    </div>
  );
}
