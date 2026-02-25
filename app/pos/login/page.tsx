'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect legacy /pos/login to main /auth/login with POS return path.
 * This fixes iOS PWA sessionStorage wipe issue.
 */
export default function PosLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/login?redirect=/pos');
  }, [router]);
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#F26522] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
