import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'Smetalab - Smart Engineering & Management',
  description: 'Advanced engineering and management platform for professional projects.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const team = user ? await getTeamForUser(user.id) : null;

  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              '/api/user': user,
              '/api/team': team
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
