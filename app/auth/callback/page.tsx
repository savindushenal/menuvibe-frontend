'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshAuth } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const processedRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Prevent multiple executions
      if (processedRef.current) {
        return;
      }
      processedRef.current = true;

      const token = searchParams.get('token');
      const error = searchParams.get('error');

      console.log('Callback processing:', { token: token ? 'present' : 'missing', error });

      if (error) {
        console.error('OAuth error received:', error);
        toast({
          title: 'Authentication Failed',
          description: 'Google authentication failed. Please try again.',
          variant: 'destructive',
        });
        router.push('/auth/login');
        return;
      }

      if (token) {
        try {
          console.log('Setting token and loading user profile...');
          
          // Set the token in API client and localStorage
          apiClient.setToken(token);
          localStorage.setItem('auth_token', token);
          
          // Fetch user profile to verify token and populate auth context
          const profileResponse = await apiClient.getProfile();
          
          if (!profileResponse.success || !profileResponse.data?.user) {
            throw new Error('Failed to fetch user profile');
          }
          
          const user = profileResponse.data.user;
          console.log('User profile loaded:', user.email);
          
          // Check if user has contexts (franchise membership or personal business)
          let contexts: any[] = [];
          try {
            const contextsResponse = await apiClient.getContexts();
            if (contextsResponse.success && contextsResponse.data?.contexts) {
              contexts = contextsResponse.data.contexts;
              console.log('User contexts:', contexts.length);
              
              // If user has contexts, redirect based on them
              if (contexts.length > 0) {
                // Store contexts for the select-context page
                sessionStorage.setItem('user_contexts', JSON.stringify(contexts));
                
                if (contextsResponse.data.default_redirect) {
                  await refreshAuth();
                  toast({
                    title: 'Login Successful',
                    description: 'Welcome to MenuVibe!',
                  });
                  router.replace(contextsResponse.data.default_redirect);
                  return;
                } else if (contexts.length === 1) {
                  await refreshAuth();
                  toast({
                    title: 'Login Successful',
                    description: 'Welcome to MenuVibe!',
                  });
                  router.replace(contexts[0].redirect);
                  return;
                } else {
                  await refreshAuth();
                  toast({
                    title: 'Login Successful',
                    description: 'Welcome to MenuVibe!',
                  });
                  router.replace('/auth/select-context');
                  return;
                }
              }
            }
          } catch (err) {
            console.log('Error fetching contexts, continuing with onboarding check');
          }
          
          // No contexts - check business profile to determine onboarding status
          let needsOnboarding = true;
          try {
            const businessProfile = await apiClient.getBusinessProfile();
            console.log('Business profile response:', businessProfile);
            
            // Handle Laravel API response format:
            // { success: true, data: { business_profile: {...}, needs_onboarding: bool } }
            if (businessProfile.success && businessProfile.data) {
              // Check for needs_onboarding field (Laravel direct response)
              if (businessProfile.data.needs_onboarding !== undefined) {
                needsOnboarding = businessProfile.data.needs_onboarding;
              }
              // Check for nested business_profile.onboarding_completed
              else if (businessProfile.data.business_profile?.onboarding_completed !== undefined) {
                needsOnboarding = !businessProfile.data.business_profile.onboarding_completed;
              }
              // Check for direct onboarding_completed field
              else if (businessProfile.data.onboarding_completed !== undefined) {
                needsOnboarding = !businessProfile.data.onboarding_completed;
              }
            }
            
            console.log('Business profile check:', { 
              success: businessProfile.success, 
              hasData: !!businessProfile.data,
              needsOnboarding 
            });
          } catch (err) {
            console.log('No business profile found, needs onboarding');
            needsOnboarding = true;
          }
          
          // Refresh auth context to sync state
          await refreshAuth();
          
          toast({
            title: 'Login Successful',
            description: 'Welcome to MenuVibe!',
          });
          
          // Redirect based on onboarding status
          if (needsOnboarding) {
            console.log('Redirecting to onboarding...');
            router.replace('/onboarding');
          } else {
            console.log('Redirecting to dashboard...');
            router.replace('/dashboard');
          }
        } catch (error) {
          console.error('Error processing auth callback:', error);
          toast({
            title: 'Authentication Error',
            description: 'Failed to complete authentication. Please try again.',
            variant: 'destructive',
          });
          apiClient.setToken(null);
          localStorage.removeItem('auth_token');
          router.push('/auth/login');
        }
      } else {
        console.log('No token found, redirecting to login');
        router.push('/auth/login');
      }
      
      setIsProcessing(false);
    };

    processCallback();
  }, [searchParams]); // Only depend on searchParams

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}