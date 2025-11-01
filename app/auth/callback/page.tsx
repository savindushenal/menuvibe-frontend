'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshAuth } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
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
          console.log('Setting token and refreshing auth...');
          
          // Set the token in API client and localStorage
          apiClient.setToken(token);
          localStorage.setItem('auth_token', token);
          
          // Refresh auth context to load user data
          await refreshAuth();
          
          toast({
            title: 'Login Successful',
            description: 'Welcome to MenuVibe!',
          });
          console.log('Redirecting to dashboard...');
          router.push('/dashboard');
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
  }, [searchParams, router, toast]);

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