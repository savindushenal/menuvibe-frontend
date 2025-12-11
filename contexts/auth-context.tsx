'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  setNeedsOnboarding: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  googleAuth: (accessToken: string) => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      apiClient.setToken(token);
      const response = await apiClient.getProfile();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        
        // Check onboarding status - will be handled separately
        await checkOnboardingStatus();
      } else {
        // Invalid response, clear auth
        localStorage.removeItem('auth_token');
        apiClient.setToken(null);
      }
    } catch (error: any) {
      // Only log non-401 errors (401 is expected for expired/invalid tokens)
      if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
        console.error('Auth check failed:', error);
      }
      // Clear invalid token
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOnboardingStatus = async (): Promise<boolean> => {
    try {
      const response = await apiClient.getBusinessProfile();
      
      // Handle the response structure from Laravel API
      // Laravel returns: { data: { business_profile: {...}, needs_onboarding: bool } }
      // or for Next.js API: { data: { onboarding_completed: bool } }
      
      if (!response.success || !response.data) {
        setNeedsOnboarding(true);
        return true;
      }
      
      // Check for Laravel API response format
      if (response.data.needs_onboarding !== undefined) {
        const needsIt = response.data.needs_onboarding;
        setNeedsOnboarding(needsIt);
        return needsIt;
      }
      
      // Check for business_profile object (Laravel nested format)
      if (response.data.business_profile) {
        const isComplete = response.data.business_profile.onboarding_completed;
        setNeedsOnboarding(!isComplete);
        return !isComplete;
      }
      
      // Check for direct onboarding_completed field (Next.js API format)
      if (response.data.onboarding_completed !== undefined) {
        const isComplete = response.data.onboarding_completed;
        setNeedsOnboarding(!isComplete);
        return !isComplete;
      }
      
      // Default: assume onboarding is needed
      setNeedsOnboarding(true);
      return true;
    } catch (error: any) {
      // Only log unexpected errors (not 404s which are expected for new users)
      if (!error.message?.includes('404') && !error.message?.includes('Business profile not found')) {
        console.error('Error checking onboarding status:', error);
      }
      // On error, assume onboarding is needed for safety
      setNeedsOnboarding(true);
      return true;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Set token first
        apiClient.setToken(token);
        setUser(user);
        
        // Redirect based on user role
        if (user.role === 'super_admin' || user.role === 'admin') {
          router.push('/admin');
        } else {
          // Check if user needs onboarding
          const needsOnboarding = await checkOnboardingStatus();
          if (needsOnboarding) {
            router.push('/onboarding');
          } else {
            router.push('/dashboard');
          }
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    try {
      const response = await apiClient.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        apiClient.setToken(token);
        setUser(user);
        
        // New users always need onboarding
        setNeedsOnboarding(true);
        router.push('/onboarding');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.setToken(null);
      setUser(null);
      router.push('/auth/login');
    }
  };

  const googleAuth = async (accessToken: string) => {
    try {
      const response = await apiClient.googleAuth(accessToken);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        apiClient.setToken(token);
        setUser(user);
        
        // Check if user needs onboarding
        const needsOnboarding = await checkOnboardingStatus();
        if (needsOnboarding) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(response.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    needsOnboarding,
    setNeedsOnboarding,
    login,
    register,
    logout,
    googleAuth,
    checkOnboardingStatus,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}