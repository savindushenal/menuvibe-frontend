/**
 * Franchise-specific theme configurations
 * Used to apply custom designs for specific franchises
 */

export interface FranchiseTheme {
  slug: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    dark: string;
    neutral: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  useCustomTemplate?: boolean; // Use franchise-specific menu template
}

export const franchiseThemes: Record<string, FranchiseTheme> = {
  barista: {
    slug: 'barista',
    name: 'Barista',
    colors: {
      primary: '#F26522',    // Barista Orange
      secondary: '#E53935',  // Barista Red
      accent: '#F26522',
      background: '#FFF8F0', // Cream
      dark: '#1A1A1A',
      neutral: '#F5F5F5',
    },
    useCustomTemplate: true, // Use Barista-specific menu design
  },
  // Add more franchises here as needed
  // 'pizzahut': { ... },
  // 'hilton-colombo': { ... },
};

export function getFranchiseTheme(franchiseSlug: string): FranchiseTheme | null {
  return franchiseThemes[franchiseSlug] || null;
}

export function shouldUseCustomTemplate(franchiseSlug: string): boolean {
  const theme = getFranchiseTheme(franchiseSlug);
  return theme?.useCustomTemplate ?? false;
}
