'use client';

import { Button } from '@egose/shadcn-theme/components/ui/button';
import { Textarea } from '@egose/shadcn-theme/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@egose/shadcn-theme/components/ui/dialog';
import { useClipboard } from '@egose/shadcn-theme/hooks/use-clipboard';

export function BinaryValueDialog({
  value,
  keyName,
  onClose,
}: {
  value: string;
  keyName: string;
  onClose: () => void;
}) {
  const { copy } = useClipboard();
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{keyName} — binary (base64)</DialogTitle>
          <DialogDescription>
            This value cannot be safely edited as text. Base64 preserves its original bytes. Use it in a Kubernetes
            Secret&apos;s data field, not K8ston&apos;s plaintext data fields.
          </DialogDescription>
        </DialogHeader>
        <Textarea aria-label="Base64 value" value={value} readOnly rows={8} className="font-mono text-xs" />
        <DialogFooter>
          <Button type="button" variant="secondary" appearance="outline" onClick={() => copy(value)}>
            Copy base64
          </Button>
          <Button type="button" variant="secondary" appearance="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
