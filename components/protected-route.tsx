'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      // If onboarding is required but user hasn't completed it
      if (requireOnboarding && needsOnboarding) {
        router.push('/onboarding');
        return;
      }

      // If user completed onboarding but is trying to access onboarding page
      if (!requireOnboarding && !needsOnboarding && window.location.pathname === '/onboarding') {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, needsOnboarding, requireOnboarding, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (requireOnboarding && needsOnboarding) {
    return null; // Will redirect to onboarding
  }

  if (!requireOnboarding && !needsOnboarding && window.location.pathname === '/onboarding') {
    return null; // Will redirect to dashboard
  }

  return <>{children}</>;
}