'use client';

import { Suspense } from 'react';
import { PremiumTemplate } from '@/components/templates/premium';
import { ClassicTemplate } from '@/components/templates/classic';
import { MinimalTemplate } from '@/components/templates/minimal';
import { CustomTemplate } from '@/components/templates/custom';
import { BaristaTemplate } from '@/components/templates/barista';
import type { FranchiseInfo, LocationInfo, MenuItem, DesignTokens } from '@/components/templates/premium/types';

interface FranchiseMenuClientProps {
  franchise: FranchiseInfo;
  location: LocationInfo;
  menuItems: MenuItem[];
}

// Component to inject CSS variables from design tokens
function DesignTokensProvider({ 
  tokens, 
  children 
}: { 
  tokens: DesignTokens; 
  children: React.ReactNode;
}) {
  const cssVars = {
    '--franchise-primary': tokens.colors.primary,
    '--franchise-secondary': tokens.colors.secondary,
    '--franchise-background': tokens.colors.background,
    '--franchise-dark': tokens.colors.dark,
    '--franchise-neutral': tokens.colors.neutral,
    '--franchise-accent': tokens.colors.accent || tokens.colors.primary,
  } as React.CSSProperties;

  return (
    <div style={cssVars} className="min-h-screen">
      {children}
    </div>
  );
}

function MenuContent({ franchise, location, menuItems }: FranchiseMenuClientProps) {
  // Select template based on franchise settings
  const templateType = franchise.templateType || 'premium';

  // Switch between templates based on templateType
  switch (templateType) {
    case 'barista':
      return (
        <BaristaTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
        />
      );
    
    case 'premium':
      return (
        <PremiumTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
        />
      );
    
    case 'classic':
      return (
        <ClassicTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
        />
      );
    
    case 'minimal':
      return (
        <MinimalTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
        />
      );
    
    case 'custom':
      return (
        <CustomTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
        />
      );
    
    default:
      // Fallback to premium template
      return (
        <PremiumTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
        />
      );
  }
}

export default function FranchiseMenuClient({ 
  franchise, 
  location, 
  menuItems 
}: FranchiseMenuClientProps) {
  return (
    <DesignTokensProvider tokens={franchise.designTokens}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-franchise-primary"></div>
        </div>
      }>
        <MenuContent 
          franchise={franchise} 
          location={location} 
          menuItems={menuItems} 
        />
      </Suspense>
    </DesignTokensProvider>
  );
}
