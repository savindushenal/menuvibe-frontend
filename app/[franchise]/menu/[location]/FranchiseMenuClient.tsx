'use client';

import { Suspense } from 'react';
import { PremiumTemplate } from '@/components/templates/premium';
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

  // For now, only premium template is available
  // Future: switch between templates based on templateType
  if (templateType === 'premium') {
    return (
      <PremiumTemplate
        franchise={franchise}
        location={location}
        menuItems={menuItems}
      />
    );
  }

  // Fallback to premium template
  return (
    <PremiumTemplate
      franchise={franchise}
      location={location}
      menuItems={menuItems}
    />
  );
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
