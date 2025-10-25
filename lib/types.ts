export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category_id: string;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
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

export interface User {
  id: string;
  email: string;
  name: string;
  restaurant_id?: string;
  role: 'owner' | 'admin' | 'staff';
  created_at: string;
}
