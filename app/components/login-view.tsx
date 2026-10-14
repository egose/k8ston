'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { IconKey } from '@tabler/icons-react';
import { buttonVariants } from '@egose/shadcn-theme/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@egose/shadcn-theme/components/ui/card';
import { K8stonMark } from '@/components/k8ston-mark';

export function LoginView() {
  const searchParams = useSearchParams();
  const authError = searchParams.get('auth') === 'error';
  const idpError = searchParams.get('idp_error');

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 pt-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <K8stonMark size={48} />
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to K8ston</h1>
        <p className="text-sm text-muted-foreground">Securely store and share secrets with your team.</p>
      </div>
      {authError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          SSO sign-in failed{idpError ? ` (${idpError})` : ''}. Please try again or contact your administrator.
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Single sign-on</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <a href="/api/auth/login" className={buttonVariants({ variant: 'primary' })}>
            <IconKey size={16} /> Continue with SSO
          </a>
          <p className="text-xs text-muted-foreground">
            Use your company account to continue. If you can&apos;t access a secret, contact your team admin.
          </p>
          <Link href="/" className="text-center text-xs text-muted-foreground underline-offset-4 hover:underline">
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
