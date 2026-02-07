'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const isNewUser = searchParams.get('new_user') === 'true';

      if (error) {
        console.error('Google auth error:', error);
        toast({
          title: 'Authentication Failed',
          description: 'Google authentication failed. Please try again.',
          variant: 'destructive',
        });
        router.replace('/auth/login?error=google_auth_failed');
        return;
      }

      if (token) {
        try {
          console.log('Google OAuth: Setting token and verifying...');
          
          // Set token
          localStorage.setItem('auth_token', token);
          apiClient.setToken(token);
          
          // Verify token works
          const profileResponse = await apiClient.getProfile();
          
          if (!profileResponse.success || !profileResponse.data?.user) {
            throw new Error('Failed to fetch user profile');
          }
          
          console.log('Google OAuth: User verified:', profileResponse.data.user.email);
          
          toast({
            title: 'Login Successful',
            description: `Welcome to MenuVire!`,
          });
          
          // Force reload to trigger auth context refresh
          // This ensures the auth state is properly initialized
          if (isNewUser) {
            console.log('Google OAuth: New user, redirecting to onboarding...');
            window.location.href = '/onboarding';
          } else {
            console.log('Google OAuth: Existing user, redirecting to dashboard...');
            window.location.href = '/dashboard';
          }
        } catch (err) {
          console.error('Google OAuth: Auth failed:', err);
          toast({
            title: 'Authentication Error',
            description: 'Failed to complete authentication. Please try again.',
            variant: 'destructive',
          });
          // Clean up
          apiClient.setToken(null);
          localStorage.removeItem('auth_token');
          router.replace('/auth/login?error=auth_failed');
        }
      } else {
        console.error('Google OAuth: No token received');
        router.replace('/auth/login?error=missing_token');
      }
      
      setIsProcessing(false);
    };

    handleCallback();
  }, [searchParams, router, toast]);

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
