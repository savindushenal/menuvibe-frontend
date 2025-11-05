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
        router.replace('/auth/login?error=google_auth_failed');
        return;
      }

      if (token) {
        try {
          console.log('Google OAuth token received, setting up session...');
          
          // Set token in localStorage and API client
          localStorage.setItem('auth_token', token);
          apiClient.setToken(token);
          
          // Fetch and verify user profile
          console.log('Fetching user profile...');
          const profileResponse = await apiClient.getProfile();
          
          if (!profileResponse.success || !profileResponse.data?.user) {
            throw new Error('Failed to fetch user profile');
          }
          
          console.log('User profile verified:', profileResponse.data.user.email);
          
          // Refresh auth context (this will set user state and check onboarding)
          console.log('Refreshing auth context...');
          await refreshAuth();
          
          // Give React time to update state
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Get fresh onboarding status
          console.log('Checking onboarding status...');
          const needsOnboarding = await checkOnboardingStatus();
          console.log('Needs onboarding:', needsOnboarding || isNewUser);
          
          toast({
            title: 'Login Successful',
            description: `Welcome to MenuVibe${isNewUser ? '! Let\'s set up your account.' : '!'}`,
          });
          
          // Use router.replace to avoid back button issues
          if (isNewUser || needsOnboarding) {
            console.log('Redirecting to onboarding...');
            router.replace('/onboarding');
          } else {
            console.log('Redirecting to dashboard...');
            router.replace('/dashboard');
          }
        } catch (err) {
          console.error('Failed to complete Google authentication:', err);
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
        console.error('No token received from Google OAuth');
        router.replace('/auth/login?error=missing_token');
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
