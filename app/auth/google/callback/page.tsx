'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userStr = searchParams.get('user');
      const error = searchParams.get('error');
      const isNewUser = searchParams.get('new_user') === 'true';

      if (error) {
        console.error('Google auth error:', error);
        router.push('/auth/login?error=google_auth_failed');
        return;
      }

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          if (isNewUser) {
            // New user from Google - redirect to onboarding
            router.push('/onboarding');
          } else {
            // Existing user - go to dashboard
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Failed to parse user data:', err);
          router.push('/auth/login?error=invalid_data');
        }
      } else {
        router.push('/auth/login?error=missing_data');
      }
      
      setIsProcessing(false);
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">
          {isProcessing ? 'Completing Google sign in...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
