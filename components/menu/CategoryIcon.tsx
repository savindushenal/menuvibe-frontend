'use client';

import type { FC } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  UtensilsCrossed,
  Utensils,
  ChefHat,
  Pizza,
  Sandwich,
  Beef,
  Fish,
  Salad,
  Soup,
  Drumstick,
  Coffee,
  Wine,
  Beer,
  GlassWater,
  IceCream,
  CakeSlice,
  Cookie,
  Croissant,
  Egg,
  Milk,
  Apple,
  Cherry,
  Grape,
  Carrot,
  Wheat,
  Sprout,
  Candy,
  Popcorn,
  Flame,
  Leaf,
  Star,
  Heart,
  Sparkles,
  Tag,
  Percent,
  Clock,
  Sunrise,
  Sunset,
  Package,
  Gift,
} from 'lucide-react';

// Map of stored icon name → Lucide component.
// All SVG-based — render identically on every device/OS.
const ICON_MAP: Record<string, FC<LucideProps>> = {
  UtensilsCrossed,
  Utensils,
  ChefHat,
  Pizza,
  Sandwich,
  Beef,
  Fish,
  Salad,
  Soup,
  Drumstick,
  Coffee,
  Wine,
  Beer,
  GlassWater,
  IceCream,
  CakeSlice,
  Cookie,
  Croissant,
  Egg,
  Milk,
  Apple,
  Cherry,
  Grape,
  Carrot,
  Wheat,
  Sprout,
  Candy,
  Popcorn,
  Flame,
  Leaf,
  Star,
  Heart,
  Sparkles,
  Tag,
  Percent,
  Clock,
  Sunrise,
  Sunset,
  Package,
  Gift,
};

export interface CategoryIconEntry {
  name: string;
  label: string;
}

/** Curated list shown in the category icon picker */
export const CATEGORY_ICONS: CategoryIconEntry[] = [
  // Mains
  { name: 'UtensilsCrossed', label: 'All Items' },
  { name: 'Utensils',        label: 'Mains' },
  { name: 'ChefHat',         label: 'Chef Special' },
  { name: 'Beef',            label: 'Beef / Steak' },
  { name: 'Drumstick',       label: 'Chicken' },
  { name: 'Fish',            label: 'Seafood / Fish' },
  { name: 'Sandwich',        label: 'Sandwich / Burger' },
  { name: 'Pizza',           label: 'Pizza' },
  { name: 'Soup',            label: 'Soup' },
  { name: 'Salad',           label: 'Salad' },
  // Sides & snacks
  { name: 'Popcorn',         label: 'Snacks' },
  { name: 'Cookie',          label: 'Cookies' },
  { name: 'Croissant',       label: 'Bakery / Pastry' },
  { name: 'Wheat',           label: 'Rice / Grains' },
  { name: 'Egg',             label: 'Breakfast / Eggs' },
  { name: 'Sunrise',         label: 'Breakfast' },
  // Desserts
  { name: 'CakeSlice',       label: 'Cakes / Desserts' },
  { name: 'IceCream',        label: 'Ice Cream' },
  { name: 'Candy',           label: 'Sweets / Candy' },
  // Drinks
  { name: 'Coffee',          label: 'Coffee / Hot Drinks' },
  { name: 'GlassWater',      label: 'Water / Soft Drinks' },
  { name: 'Milk',            label: 'Milkshakes / Dairy' },
  { name: 'Beer',            label: 'Beer' },
  { name: 'Wine',            label: 'Wine / Cocktails' },
  // Produce
  { name: 'Apple',           label: 'Fruits' },
  { name: 'Cherry',          label: 'Berries / Cherry' },
  { name: 'Grape',           label: 'Grapes' },
  { name: 'Carrot',          label: 'Vegetables' },
  { name: 'Sprout',          label: 'Vegan / Plant-Based' },
  // Labels
  { name: 'Flame',           label: 'Spicy / Hot' },
  { name: 'Leaf',            label: 'Vegetarian' },
  { name: 'Star',            label: 'Specials' },
  { name: 'Heart',           label: 'Favorites' },
  { name: 'Sparkles',        label: 'Featured' },
  { name: 'Tag',             label: 'Deals' },
  { name: 'Percent',         label: 'Offers / Discounts' },
  { name: 'Clock',           label: 'Limited Time' },
  { name: 'Sunset',          label: 'Dinner' },
  { name: 'Package',         label: 'Combos / Sets' },
  { name: 'Gift',            label: 'Gift Meals' },
];

interface CategoryIconProps extends LucideProps {
  icon?: string | null;
}

/**
 * Renders a category icon.
 * - If `icon` is a known Lucide name (e.g. "Coffee") → renders the SVG icon.
 * - If `icon` is an emoji/unknown string → renders it as plain text (backward compat).
 */
export function CategoryIcon({ icon, className, ...props }: CategoryIconProps) {
  if (!icon) return null;

  const LucideIcon = ICON_MAP[icon];
  if (LucideIcon) {
    return <LucideIcon className={className} {...props} />;
  }

  // Legacy emoji fallback
  return <span aria-hidden="true">{icon}</span>;
}
