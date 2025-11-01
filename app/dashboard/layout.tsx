import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { SubscriptionProvider } from '@/contexts/subscription-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SubscriptionProvider>
        <div className="flex h-screen overflow-hidden bg-neutral-100">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </SubscriptionProvider>
    </ProtectedRoute>
  );
}
