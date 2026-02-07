'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect from old menu page to templates page
export default function MenuRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/templates');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-neutral-600">Redirecting to Menus...</p>
      </div>
    </div>
  );
}
