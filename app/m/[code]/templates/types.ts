// Types for public menu templates

export interface PublicMenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  icon: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_spicy: boolean;
  spice_level: number | null;
  allergens: string[] | null;
  dietary_info: string[] | null;
  preparation_time: number | null;
  variations?: { name: string; price: number; is_available?: boolean }[] | null;
}

export interface PublicCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  items: PublicMenuItem[];
}

export interface PublicOffer {
  id: number;
  name: string;
  description: string | null;
  type: string;
  discount_type: string;
  discount_value: number;
  image_url: string | null;
}

export interface BusinessInfo {
  name: string;
  branch_name: string | null;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string[];
  cuisine_type: string | null;
  operating_hours: Record<string, { open: string; close: string }> | null;
  services: string[] | null;
  social_media: Record<string, string> | null;
  primary_color: string | null;
  secondary_color: string | null;
}

export interface PublicMenuData {
  endpoint: {
    id: number;
    name: string;
    type: string;
    identifier: string;
  };
  template: {
    id: number;
    name: string;
    currency: string;
    image_url?: string | null;
    settings: {
      layout?: string;
      colorTheme?: string;
      design?: string;
    } | null;
  };
  business?: BusinessInfo | null;
  categories: PublicCategory[];
  offers: PublicOffer[];
  overrides: Record<number, { price_override?: number; is_available?: boolean }>;
}

export interface ColorTheme {
  bg: string;
  text: string;
  accent: string;
  card: string;
}

export interface CartItem {
  item: PublicMenuItem;
  quantity: number;
  selectedVariation?: { name: string; price: number } | null;
}

// Color themes
export const colorThemes: Record<string, ColorTheme> = {
  modern: { bg: '#F8FAFC', text: '#1E293B', accent: '#3B82F6', card: '#FFFFFF' },
  classic: { bg: '#FEF3C7', text: '#78350F', accent: '#D97706', card: '#FFFBEB' },
  minimal: { bg: '#FFFFFF', text: '#18181B', accent: '#71717A', card: '#F9FAFB' },
  elegant: { bg: '#FAF5FF', text: '#581C87', accent: '#9333EA', card: '#FFFFFF' },
  rustic: { bg: '#FEF2F2', text: '#7F1D1D', accent: '#B91C1C', card: '#FFFBEB' },
  coffee: { bg: '#FFF8F0', text: '#4A2C2A', accent: '#C87941', card: '#FFFFFF' },
  ocean: { bg: '#F0F9FF', text: '#0C4A6E', accent: '#0EA5E9', card: '#FFFFFF' },
  forest: { bg: '#F0FDF4', text: '#14532D', accent: '#22C55E', card: '#FFFFFF' },
  midnight: { bg: '#1E1E2E', text: '#E2E8F0', accent: '#F59E0B', card: '#2D2D3F' },
  rose: { bg: '#FFF1F2', text: '#881337', accent: '#E11D48', card: '#FFFFFF' },
};

// Currency symbols
export const currencySymbols: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹',
  AUD: 'A$', CAD: 'C$', AED: 'د.إ', LKR: 'Rs.',
};

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || '$';
}

export function getColorTheme(settings: PublicMenuData['template']['settings']): ColorTheme {
  const themeName = settings?.colorTheme || settings?.design || 'modern';
  return colorThemes[themeName] || colorThemes.modern;
}

export function getLayout(settings: PublicMenuData['template']['settings']): string {
  return settings?.layout || 'standard';
}

export function getItemPrice(item: PublicMenuItem, overrides?: Record<number, { price_override?: number }>): number {
  const override = overrides?.[item.id];
  if (override?.price_override !== undefined) {
    return Number(override.price_override) || 0;
  }
  return Number(item.price) || 0;
}

export function isItemAvailable(item: PublicMenuItem, overrides?: Record<number, { is_available?: boolean }>): boolean {
  const override = overrides?.[item.id];
  if (override?.is_available !== undefined) {
    return override.is_available;
  }
  return item.is_available;
}

// Safe toFixed helper
export function formatPrice(price: number | string | null | undefined): string {
  const num = Number(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}
