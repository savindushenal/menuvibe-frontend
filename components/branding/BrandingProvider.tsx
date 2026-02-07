'use client';

import React, { useEffect } from 'react';
import { useFranchise, FranchiseBranding } from '@/contexts/franchise-context';
import type { DesignTokens } from '@/components/templates/premium/types';

interface BrandingProviderProps {
  children: React.ReactNode;
}

/**
 * BrandingProvider wraps the app and applies franchise branding styles.
 * It should be placed inside FranchiseProvider in the component tree.
 */
export function BrandingProvider({ children }: BrandingProviderProps) {
  const { branding, isWhiteLabeled, isBrandingLoading } = useFranchise();

  useEffect(() => {
    if (branding) {
      applyBrandingToDocument(branding);
    } else {
      resetBrandingToDefaults();
    }
  }, [branding]);

  return <>{children}</>;
}

/**
 * Apply branding styles to the document
 */
function applyBrandingToDocument(branding: FranchiseBranding) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Primary brand colors as CSS variables
  root.style.setProperty('--brand-primary', branding.primary_color);
  root.style.setProperty('--brand-secondary', branding.secondary_color);
  
  if (branding.accent_color) {
    root.style.setProperty('--brand-accent', branding.accent_color);
  }

  // Also set Tailwind-compatible color variables
  root.style.setProperty('--color-primary', branding.primary_color);
  root.style.setProperty('--color-secondary', branding.secondary_color);

  // Apply design tokens if present (for premium template support)
  if (branding.design_tokens) {
    applyDesignTokens(branding.design_tokens);
  } else {
    // Fallback: generate design tokens from basic colors
    root.style.setProperty('--franchise-primary', branding.primary_color);
    root.style.setProperty('--franchise-secondary', branding.secondary_color || '#E53935');
    root.style.setProperty('--franchise-background', '#FFF8F0');
    root.style.setProperty('--franchise-dark', '#1A1A1A');
    root.style.setProperty('--franchise-neutral', '#F5F5F5');
    root.style.setProperty('--franchise-accent', branding.accent_color || branding.primary_color);
  }

  // Update document title
  if (branding.name) {
    const currentTitle = document.title;
    if (!currentTitle.includes(branding.name)) {
      document.title = `${branding.name}`;
    }
  }

  // Update favicon
  if (branding.favicon_url) {
    updateFavicon(branding.favicon_url);
  }

  // Apply custom CSS
  if (branding.custom_css) {
    applyCustomCSS(branding.custom_css);
  }

  // Add a class to body for CSS targeting
  document.body.classList.add('white-labeled');
  document.body.setAttribute('data-franchise', branding.slug);
}

/**
 * Apply design tokens as CSS variables
 */
function applyDesignTokens(tokens: DesignTokens) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Apply color tokens
  if (tokens.colors) {
    root.style.setProperty('--franchise-primary', tokens.colors.primary);
    root.style.setProperty('--franchise-secondary', tokens.colors.secondary);
    root.style.setProperty('--franchise-background', tokens.colors.background);
    root.style.setProperty('--franchise-dark', tokens.colors.dark);
    root.style.setProperty('--franchise-neutral', tokens.colors.neutral);
    root.style.setProperty('--franchise-accent', tokens.colors.accent || tokens.colors.primary);
  }

  // Apply font tokens if present
  if (tokens.fonts) {
    if (tokens.fonts.heading) {
      root.style.setProperty('--font-heading', tokens.fonts.heading);
    }
    if (tokens.fonts.body) {
      root.style.setProperty('--font-body', tokens.fonts.body);
    }
  }
}

/**
 * Reset branding to default MenuVire styles
 */
function resetBrandingToDefaults() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Reset to default colors
  root.style.removeProperty('--brand-primary');
  root.style.removeProperty('--brand-secondary');
  root.style.removeProperty('--brand-accent');
  root.style.removeProperty('--color-primary');
  root.style.removeProperty('--color-secondary');

  // Remove custom CSS
  const customStyle = document.getElementById('franchise-custom-css');
  if (customStyle) {
    customStyle.remove();
  }

  // Remove body classes
  document.body.classList.remove('white-labeled');
  document.body.removeAttribute('data-franchise');
}

/**
 * Update the favicon
 */
function updateFavicon(url: string) {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  
  link.href = url;
}

/**
 * Apply custom CSS from franchise settings
 */
function applyCustomCSS(css: string) {
  let styleElement = document.getElementById('franchise-custom-css') as HTMLStyleElement | null;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'franchise-custom-css';
    document.head.appendChild(styleElement);
  }
  
  styleElement.textContent = css;
}

/**
 * Logo component that uses franchise branding
 */
export function BrandedLogo({ 
  className = '', 
  fallback = 'MenuVire' 
}: { 
  className?: string;
  fallback?: string;
}) {
  const { branding, isWhiteLabeled } = useFranchise();

  if (isWhiteLabeled && branding?.logo_url) {
    return (
      <img 
        src={branding.logo_url} 
        alt={branding.name || fallback}
        className={className}
      />
    );
  }

  // Default MenuVire logo/text
  return (
    <span className={`font-bold text-xl ${className}`}>
      {branding?.name || fallback}
    </span>
  );
}

/**
 * Brand name text component
 */
export function BrandName({ fallback = 'MenuVire' }: { fallback?: string }) {
  const { branding, isWhiteLabeled } = useFranchise();
  return <>{isWhiteLabeled && branding?.name ? branding.name : fallback}</>;
}

/**
 * Hook to get brand colors for inline styles
 */
export function useBrandColors() {
  const { branding } = useFranchise();

  return {
    primary: branding?.primary_color || '#000000',
    secondary: branding?.secondary_color || '#FFFFFF',
    accent: branding?.accent_color || branding?.primary_color || '#000000',
  };
}

/**
 * Component that only renders when white-labeled
 */
export function WhiteLabelOnly({ children }: { children: React.ReactNode }) {
  const { isWhiteLabeled } = useFranchise();
  
  if (!isWhiteLabeled) return null;
  
  return <>{children}</>;
}

/**
 * Component that only renders when NOT white-labeled (default MenuVire branding)
 */
export function DefaultBrandingOnly({ children }: { children: React.ReactNode }) {
  const { isWhiteLabeled } = useFranchise();
  
  if (isWhiteLabeled) return null;
  
  return <>{children}</>;
}
