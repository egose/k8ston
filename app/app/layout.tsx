import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Banners } from '@/components/banners';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'K8ston — Secret Manager',
  description:
    'Securely store and share secrets with your team. SSO login, team-based access control, and version history.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <Banners />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
          <footer className="border-t py-4 text-center text-xs text-muted-foreground">
            K8ston · if you need access to a secret, contact your administrator ·{' '}
            <a
              href="https://k8ston.pages.dev/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Docs
            </a>{' '}
            ·{' '}
            <a
              href="https://github.com/egose/k8ston"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              GitHub
            </a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
