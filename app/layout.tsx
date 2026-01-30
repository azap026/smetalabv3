import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { ToastProvider } from '@/components/ui/use-toast';

export const metadata: Metadata = {
  title: 'Smetalab - Smart Engineering & Management',
  description: 'Advanced engineering and management platform for professional projects.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

import { Suspense } from 'react';
import { SWRWrapper } from '@/components/swr-wrapper';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const userPromise = getUser();
  const teamPromise = getTeamForUser();

  return (
    <html
      lang="en"
      className={manrope.className}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 text-black dark:text-white">
        <Suspense>
          <SWRWrapper userPromise={userPromise} teamPromise={teamPromise}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SWRWrapper>
        </Suspense>
      </body>
    </html>
  );
}
