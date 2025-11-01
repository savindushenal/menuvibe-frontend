import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { LocationProvider } from '@/contexts/location-context';
import { Toaster } from '@/components/ui/toaster';
import { ConsoleCleanup } from '@/components/console-cleanup';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MenuVibe - Restaurant Menu Management Platform',
  description: 'Manage your restaurant menu with QR codes, analytics, and more',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ConsoleCleanup />
        <AuthProvider>
          <LocationProvider>
            {children}
            <Toaster />
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
