'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export interface DesignTokensColors {
  primary: string;
  secondary: string;
  background: string;
  dark: string;
  neutral: string;
  accent?: string;
}

export interface DesignTokensFonts {
  heading?: string;
  body?: string;
}

export interface DesignTokens {
  colors: DesignTokensColors;
  fonts?: DesignTokensFonts;
  logoUrl?: string;
  heroImage?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface FranchiseBranding {
  name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  custom_css: string | null;
  support_email: string | null;
  support_phone: string | null;
  website_url: string | null;
  settings: Record<string, unknown> | null;
  design_tokens: DesignTokens | null;
  template_type: 'premium' | 'classic' | 'minimal' | null;
}

export interface Franchise {
  id: number;
  name: string;
  slug: string;
  custom_domain: string | null;
  description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  is_active: boolean;
  locations_count?: number;
  users_count?: number;
  my_role?: string;
  created_at: string;
}

export interface FranchiseUser {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'viewer';
  role_display: string;
  permissions: Record<string, string[]>;
  location_ids: number[] | null;
  is_active: boolean;
  is_pending: boolean;
  invited_at: string | null;
  accepted_at: string | null;
}

interface FranchiseContextType {
  // Current franchise branding (from subdomain/domain)
  branding: FranchiseBranding | null;
  isWhiteLabeled: boolean;
  
  // User's franchises
  franchises: Franchise[];
  currentFranchise: Franchise | null;
  
  // Loading states
  isBrandingLoading: boolean;
  isFranchisesLoading: boolean;
  
  // Actions
  setCurrentFranchise: (franchise: Franchise | null) => void;
  fetchFranchises: () => Promise<void>;
  createFranchise: (data: CreateFranchiseData) => Promise<Franchise>;
  updateFranchise: (id: number, data: Partial<CreateFranchiseData>) => Promise<Franchise>;
  deleteFranchise: (id: number) => Promise<void>;
  
  // Team management
  fetchFranchiseUsers: (franchiseId: number) => Promise<FranchiseUser[]>;
  inviteUser: (franchiseId: number, email: string, role: string, locationIds?: number[]) => Promise<void>;
  updateUserRole: (franchiseId: number, userId: number, role: string) => Promise<void>;
  removeUser: (franchiseId: number, userId: number) => Promise<void>;
  
  // Permissions
  hasPermission: (resource: string, action: string) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  myRole: string | null;
}

interface CreateFranchiseData {
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  support_email?: string;
  support_phone?: string;
  website_url?: string;
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

export function FranchiseProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<FranchiseBranding | null>(null);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [currentFranchise, setCurrentFranchise] = useState<Franchise | null>(null);
  const [isBrandingLoading, setIsBrandingLoading] = useState(true);
  const [isFranchisesLoading, setIsFranchisesLoading] = useState(false);

  // Detect and load branding on mount
  useEffect(() => {
    detectAndLoadBranding();
  }, []);

  // Detect franchise from subdomain or custom domain
  const detectAndLoadBranding = async () => {
    setIsBrandingLoading(true);
    try {
      const identifier = detectFranchiseIdentifier();
      
      if (identifier) {
        // Use base URL without /api suffix for this endpoint
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
        const response = await fetch(`${baseUrl}/api/branding/${identifier}`);
        const data = await response.json();
        
        if (data.success && data.data?.branding) {
          setBranding(data.data.branding);
          applyBrandingStyles(data.data.branding);
        }
      }
    } catch (error) {
      console.error('Failed to load branding:', error);
    } finally {
      setIsBrandingLoading(false);
    }
  };

  // Detect franchise identifier from URL
  const detectFranchiseIdentifier = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const host = window.location.hostname;
    
    // Skip main domains and staging/app subdomains
    const mainDomains = ['menuvibe.com', 'www.menuvibe.com', 'localhost', '127.0.0.1', 'app.menuvibe.com', 'app.menuvire.com'];
    if (mainDomains.includes(host)) return null;
    
    // Skip staging and preview domains
    if (host.includes('staging.') || host.includes('preview.') || host.includes('vercel.app')) {
      return null;
    }
    
    // Check for subdomain (e.g., subway.menuvibe.com)
    const baseDomains = ['menuvibe.com', 'menuvire.com', 'menuvibe.local'];
    for (const baseDomain of baseDomains) {
      if (host.endsWith(`.${baseDomain}`)) {
        const subdomain = host.replace(`.${baseDomain}`, '');
        // Skip system subdomains
        if (['www', 'api', 'app', 'admin', 'staging', 'preview', 'dev'].includes(subdomain)) {
          return null;
        }
        // Skip multi-level subdomains like staging.app
        if (subdomain.includes('.')) {
          return null;
        }
        return subdomain;
      }
    }
    
    // If not a subdomain, it might be a custom domain
    // Return the full host as identifier (only for actual custom domains)
    if (!host.includes('menuvibe') && !host.includes('menuvire') && !host.includes('localhost') && !host.includes('vercel')) {
      return host;
    }
    
    return null;
  };

  // Apply branding styles to document
  const applyBrandingStyles = (brandingData: FranchiseBranding) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Set CSS variables
    root.style.setProperty('--franchise-primary', brandingData.primary_color);
    root.style.setProperty('--franchise-secondary', brandingData.secondary_color);
    
    if (brandingData.accent_color) {
      root.style.setProperty('--franchise-accent', brandingData.accent_color);
    }
    
    // Apply custom CSS if provided
    if (brandingData.custom_css) {
      let styleElement = document.getElementById('franchise-custom-css');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'franchise-custom-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = brandingData.custom_css;
    }
    
    // Update favicon if provided
    if (brandingData.favicon_url) {
      let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = brandingData.favicon_url;
    }
    
    // Update title if franchise name is available
    if (brandingData.name) {
      document.title = `${brandingData.name} | Menu`;
    }
  };

  // Fetch user's franchises
  const fetchFranchises = useCallback(async () => {
    setIsFranchisesLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/franchises`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFranchises(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch franchises:', error);
    } finally {
      setIsFranchisesLoading(false);
    }
  }, []);

  // Create a new franchise
  const createFranchise = async (franchiseData: CreateFranchiseData): Promise<Franchise> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/franchises`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(franchiseData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create franchise');
    }
    
    // Refresh franchises list
    await fetchFranchises();
    
    return data.data;
  };

  // Update a franchise
  const updateFranchise = async (id: number, franchiseData: Partial<CreateFranchiseData>): Promise<Franchise> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/franchises/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(franchiseData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update franchise');
    }
    
    // Refresh franchises list
    await fetchFranchises();
    
    return data.data;
  };

  // Delete a franchise
  const deleteFranchise = async (id: number): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/franchises/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete franchise');
    }
    
    // Refresh franchises list
    await fetchFranchises();
    
    // Clear current franchise if it was deleted
    if (currentFranchise?.id === id) {
      setCurrentFranchise(null);
    }
  };

  // Fetch franchise users
  const fetchFranchiseUsers = async (franchiseId: number): Promise<FranchiseUser[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/franchises/${franchiseId}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch users');
    }
    
    return data.data || [];
  };

  // Invite user to franchise
  const inviteUser = async (franchiseId: number, email: string, role: string, locationIds?: number[]): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/franchises/${franchiseId}/users/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role, location_ids: locationIds }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to invite user');
    }
  };

  // Update user role
  const updateUserRole = async (franchiseId: number, userId: number, role: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/franchises/${franchiseId}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update user role');
    }
  };

  // Remove user from franchise
  const removeUser = async (franchiseId: number, userId: number): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/franchises/${franchiseId}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to remove user');
    }
  };

  // Permission check based on current franchise role
  const hasPermission = (resource: string, action: string): boolean => {
    if (!currentFranchise?.my_role) return false;
    
    const role = currentFranchise.my_role;
    
    // Owners have all permissions
    if (role === 'owner') return true;
    
    // Define permissions by role
    const rolePermissions: Record<string, Record<string, string[]>> = {
      admin: {
        locations: ['view', 'create', 'edit', 'delete'],
        menus: ['view', 'create', 'edit', 'delete'],
        staff: ['view', 'invite', 'remove'],
        analytics: ['view', 'export'],
        billing: ['view'],
        branding: ['view', 'edit'],
        settings: ['view', 'edit'],
      },
      manager: {
        locations: ['view', 'edit'],
        menus: ['view', 'create', 'edit'],
        staff: ['view'],
        analytics: ['view'],
        branding: ['view'],
        settings: ['view'],
      },
      viewer: {
        locations: ['view'],
        menus: ['view'],
        analytics: ['view'],
        branding: ['view'],
        settings: ['view'],
      },
    };
    
    const permissions = rolePermissions[role];
    return permissions?.[resource]?.includes(action) ?? false;
  };

  const myRole = currentFranchise?.my_role || null;
  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const isWhiteLabeled = branding !== null;

  const value: FranchiseContextType = {
    branding,
    isWhiteLabeled,
    franchises,
    currentFranchise,
    isBrandingLoading,
    isFranchisesLoading,
    setCurrentFranchise,
    fetchFranchises,
    createFranchise,
    updateFranchise,
    deleteFranchise,
    fetchFranchiseUsers,
    inviteUser,
    updateUserRole,
    removeUser,
    hasPermission,
    isOwner,
    isAdmin,
    myRole,
  };

  return (
    <FranchiseContext.Provider value={value}>
      {children}
    </FranchiseContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useFranchise() {
  const context = useContext(FranchiseContext);
  if (context === undefined) {
    throw new Error('useFranchise must be used within a FranchiseProvider');
  }
  return context;
}

// ============================================
// UTILITY HOOK FOR BRANDING ONLY
// ============================================

export function useBranding() {
  const { branding, isWhiteLabeled, isBrandingLoading } = useFranchise();
  return { branding, isWhiteLabeled, isLoading: isBrandingLoading };
}
