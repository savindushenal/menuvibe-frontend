'use client';

import { useParams } from 'next/navigation';
import { FranchiseSidebar } from '@/components/franchise/franchise-sidebar';
import { FranchiseHeader } from '@/components/franchise/franchise-header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { FranchiseProvider } from '@/contexts/franchise-context';

export default function FranchiseDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;

  return (
    <ProtectedRoute>
      <FranchiseProvider>
        <div className="flex h-screen overflow-hidden bg-neutral-100">
          <FranchiseSidebar franchiseSlug={franchiseSlug} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <FranchiseHeader franchiseSlug={franchiseSlug} />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </FranchiseProvider>
    </ProtectedRoute>
  );
}
