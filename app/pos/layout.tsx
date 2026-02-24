import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MenuVibe POS',
  description: 'Staff order management',
  manifest: '/pos-manifest.json',
  appleWebApp: {
    capable: true,
    title: 'MenuVibe POS',
    statusBarStyle: 'black-translucent',
  },
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
