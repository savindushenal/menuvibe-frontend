'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { MagicOnboardingForm } from '@/components/onboarding';
import { ProtectedRoute } from '@/components/protected-route';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setNeedsOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOnboardingComplete = async () => {
    setIsSubmitting(true);
    try {
      // Directly set needsOnboarding to false since we just completed it
      // This avoids the race condition with checkOnboardingStatus
      setNeedsOnboarding(false);
      
      // Small delay to ensure state is updated before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requireOnboarding={false}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to MenuVibe! 🎉
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Let's set up your restaurant profile to get you started. This will only take a few minutes.
              </p>
              {user && (
                <p className="text-sm text-gray-500 mt-2">
                  Welcome, {user.name}!
                </p>
              )}
            </div>

            {/* Magic Form */}
            <MagicOnboardingForm 
              onComplete={handleOnboardingComplete}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}