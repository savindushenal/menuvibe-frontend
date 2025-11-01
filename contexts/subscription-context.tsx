'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from './auth-context';

interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  features: string[];
  limits: {
    max_menu_items: number;
    max_menu_items_per_menu: number;
    max_locations: number;
    max_menus: number;
    photo_uploads: boolean;
    custom_qr_codes: boolean;
    analytics: boolean;
    priority_support: boolean;
  };
  formatted_price: string;
}

interface SubscriptionUsage {
  menus_count: number;
  menu_items_count: number;
  locations_count: number;
}

interface SubscriptionInfo {
  plan: SubscriptionPlan | null;
  usage: SubscriptionUsage;
  limits: any;
  can_upgrade: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  canPerformAction: (action: string, currentCount?: number) => boolean;
  getRemainingQuota: (action: string, currentCount?: number) => number;
  showUpgradePrompt: (feature: string) => void;
  currentPlan: string;
  canAccessFeature: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    // During SSR/build, return default values instead of throwing
    if (typeof window === 'undefined') {
      return {
        subscription: null,
        loading: true,
        error: null,
        refreshSubscription: async () => {},
        canPerformAction: () => false,
        getRemainingQuota: () => 0,
        showUpgradePrompt: () => {},
        currentPlan: 'free',
        canAccessFeature: () => false,
      };
    }
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = async () => {
    // Don't attempt to load subscription if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getCurrentSubscription();
      
      if (response.success) {
        setSubscription(response.data);
      } else {
        setError(response.message || 'Failed to fetch subscription');
      }
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message || 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const canPerformAction = (action: string, currentCount: number = 0): boolean => {
    if (!subscription?.plan) return false;
    
    const limit = subscription.plan.limits[action as keyof typeof subscription.plan.limits];
    
    if (typeof limit === 'number') {
      // -1 means unlimited
      if (limit === -1) return true;
      return currentCount < limit;
    }
    
    if (typeof limit === 'boolean') {
      return limit;
    }
    
    return false;
  };

  const getRemainingQuota = (action: string, currentCount: number = 0): number => {
    if (!subscription?.plan) return 0;
    
    const limit = subscription.plan.limits[action as keyof typeof subscription.plan.limits];
    
    if (typeof limit === 'number') {
      // -1 means unlimited
      if (limit === -1) return -1;
      return Math.max(0, limit - currentCount);
    }
    
    return 0;
  };

  const showUpgradePrompt = (feature: string) => {
    // This could trigger a modal or redirect to upgrade page
    console.log(`Upgrade required for feature: ${feature}`);
    // TODO: Implement upgrade prompt UI
  };

  const getCurrentPlan = (): string => {
    return subscription?.plan?.name || 'Free';
  };

  const canAccessFeature = (feature: string): boolean => {
    if (!subscription?.plan) return false;
    
    const planSlug = subscription.plan.slug;
    
    // Feature access matrix
    const featureAccess: Record<string, string[]> = {
      'Multiple Locations': ['pro', 'enterprise', 'custom-enterprise'],
      'Advanced Analytics': ['enterprise', 'custom-enterprise'],
      'API Access': ['enterprise', 'custom-enterprise'],
      'Custom Branding': ['custom-enterprise'],
      'White Label': ['custom-enterprise'],
      'Priority Support': ['pro', 'enterprise', 'custom-enterprise'],
      'Dedicated Support': ['enterprise', 'custom-enterprise'],
      'Custom Integrations': ['custom-enterprise'],
      'SLA Guarantee': ['custom-enterprise'],
      'Volume Pricing': ['custom-enterprise'],
    };
    
    const requiredPlans = featureAccess[feature];
    return requiredPlans ? requiredPlans.includes(planSlug) : false;
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        refreshSubscription();
      } else {
        // Clear subscription when not authenticated
        setSubscription(null);
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  const contextValue: SubscriptionContextType = {
    subscription,
    loading,
    error,
    refreshSubscription,
    canPerformAction,
    getRemainingQuota,
    showUpgradePrompt,
    currentPlan: getCurrentPlan(),
    canAccessFeature,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}