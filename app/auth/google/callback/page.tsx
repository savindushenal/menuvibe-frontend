'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth, checkOnboardingStatus } = useAuth();
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
        router.push('/auth/login?error=google_auth_failed');
        return;
      }

      if (token) {
        try {
          console.log('Google OAuth token received, setting up session...');
          
          // Set token in API client and localStorage
          apiClient.setToken(token);
          localStorage.setItem('auth_token', token);
          
          // Fetch user profile to verify and populate auth context
          const profileResponse = await apiClient.getProfile();
          
          if (!profileResponse.success || !profileResponse.data?.user) {
            throw new Error('Failed to fetch user profile');
          }
          
          console.log('User profile loaded:', profileResponse.data.user.email);
          
          // Refresh auth context to sync state
          await refreshAuth();
          
          // Check onboarding status
          const needsOnboarding = await checkOnboardingStatus();
          
          toast({
            title: 'Login Successful',
            description: `Welcome to MenuVibe${isNewUser ? '! Let\'s set up your account.' : '!'}`,
          });
          
          // Redirect based on onboarding status or new user flag
          if (isNewUser || needsOnboarding) {
            console.log('Redirecting to onboarding...');
            router.push('/onboarding');
          } else {
            console.log('Redirecting to dashboard...');
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Failed to complete Google authentication:', err);
          toast({
            title: 'Authentication Error',
            description: 'Failed to complete authentication. Please try again.',
            variant: 'destructive',
          });
          apiClient.setToken(null);
          localStorage.removeItem('auth_token');
          router.push('/auth/login?error=auth_failed');
        }
      } else {
        console.error('No token received from Google OAuth');
        router.push('/auth/login?error=missing_token');
      }
      
      setIsProcessing(false);
    };

    handleCallback();
  }, [searchParams, router, refreshAuth, checkOnboardingStatus, toast]);

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
