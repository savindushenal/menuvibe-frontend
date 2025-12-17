// Pizza Hut Demo Types

export interface SizeOption {
  id: string;
  name: string;
  size: string;
  price: number;
}

export interface CrustOption {
  id: string;
  name: string;
  price: number;
}

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  sizes?: SizeOption[];
  crusts?: CrustOption[];
  toppings?: ToppingOption[];
  originalPrice?: number;
  badge?: string;
  isPopular?: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  selectedSize?: SizeOption;
  selectedCrust?: CrustOption;
  selectedToppings: string[];
  totalPrice: number;
}

export interface Deal {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  discount: string;
  bgColor: string;
}

export interface TableInfo {
  table: string;
  floor?: string;
}
