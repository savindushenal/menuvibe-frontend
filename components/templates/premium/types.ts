// Premium Template Types
// These types are used across all premium template components

export interface DesignTokens {
  colors: {
    primary: string;      // Main brand color (e.g., #F26522)
    secondary: string;    // Secondary accent (e.g., #E53935)
    background: string;   // Light background (e.g., #FFF8F0)
    dark: string;         // Dark text/headers (e.g., #1A1A1A)
    neutral: string;      // Neutral backgrounds (e.g., #F5F5F5)
    accent?: string;      // Optional accent color
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  logoUrl?: string;
  heroImage?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ItemVariation {
  id?: string;
  name: string;
  price: number;
  compare_at_price?: number;
  is_default?: boolean;
  is_available?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  rating?: number;
  reviews?: number;
  category: string;
  customizations?: MenuCustomization[];
  variations?: ItemVariation[];
  isAvailable?: boolean;
  tags?: string[];
}

export interface MenuCustomization {
  name: string;
  price: number;
}

export interface TableInfo {
  table: string;
  floor?: string;
  location?: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  customizations: string[];
  selectedVariation?: ItemVariation;
}

export interface LocationInfo {
  id: number;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
}

export interface FranchiseInfo {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  designTokens: DesignTokens;
  templateType: 'premium' | 'classic' | 'minimal' | 'custom';
}

// Default design tokens for fallback
export const defaultDesignTokens: DesignTokens = {
  colors: {
    primary: '#F26522',
    secondary: '#E53935',
    background: '#FFF8F0',
    dark: '#1A1A1A',
    neutral: '#F5F5F5',
    accent: '#F26522',
  },
  fonts: {
    heading: 'Playfair Display',
    body: 'Inter',
  },
  borderRadius: 'lg',
};
