export interface Location {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  phone?: string;
  email?: string;
  website?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  cuisine_type?: string;
  seating_capacity?: number;
  operating_hours?: any;
  services?: string[];
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  social_media?: any;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  menus?: Menu[];
}

export interface MenuItem {
  id: number;
  menu_id: number;
  category_id?: number;
  name: string;
  description?: string;
  price: number | string;  // Backend returns string from DECIMAL field
  currency?: string;
  card_color?: string;
  text_color?: string;
  heading_color?: string;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  allergens?: string[];
  dietary_info?: string[];
  preparation_time?: number;
  is_spicy: boolean;
  spice_level?: number;
  variations?: any;
  created_at: string;
  updated_at: string;
  category?: MenuCategory;
}

export interface MenuCategory {
  id: number;
  menu_id: number;
  name: string;
  description?: string;
  background_color: string;
  text_color: string;
  heading_color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: number;
  location_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  availability_hours?: any;
  is_featured: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  menu_items?: MenuItem[];
  categories?: MenuCategory[];
}

export interface Restaurant {
  id: string;
  name: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: string;
  name: string;
  restaurant_id: string;
  url: string;
  scans: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  date: string;
  views: number;
  scans: number;
  engagement: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  setup_fee?: number;
  billing_period: 'monthly' | 'yearly' | 'custom';
  contract_months?: number;
  features: string[];
  limits: {
    max_locations: number;
    max_menus_per_location: number;
    max_menu_items_per_menu: number;
    [key: string]: any;
  };
  custom_features?: string;
  custom_limits?: any;
  is_active: boolean;
  is_custom: boolean;
  sort_order: number;
  formatted_price: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  trial_ends_at?: string;
  ends_at?: string;
  is_active: boolean;
  external_subscription_id?: string;
  plan: SubscriptionPlan;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'staff';
  created_at: string;
  subscription?: Subscription;
}
