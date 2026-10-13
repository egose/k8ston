'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@egose/shadcn-theme/components/ui/sonner';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
      },
    });
    // The default structural-sharing clone assigns map keys onto {}, losing
    // __proto__ when a value changes. Secret/history DTOs must retain own keys.
    queryClient.setQueryDefaults(['secret'], { structuralSharing: false });
    queryClient.setQueryDefaults(['versions'], { structuralSharing: false });
    return queryClient;
  });
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
