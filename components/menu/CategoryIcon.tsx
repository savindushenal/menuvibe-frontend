'use client';

import type { FC } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  UtensilsCrossed,
  ChefHat,
  Pizza,
  Sandwich,
  Beef,
  Fish,
  Salad,
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
  Carrot,
  Wheat,
  Candy,
  Flame,
  Leaf,
  Star,
  Heart,
  Sparkles,
  Tag,
  Clock,
} from 'lucide-react';

// Map of stored icon name → Lucide component.
// All SVG-based — render identically on every device/OS.
const ICON_MAP: Record<string, FC<LucideProps>> = {
  UtensilsCrossed,
  ChefHat,
  Pizza,
  Sandwich,
  Beef,
  Fish,
  Salad,
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
  Carrot,
  Wheat,
  Candy,
  Flame,
  Leaf,
  Star,
  Heart,
  Sparkles,
  Tag,
  Clock,
};

export interface CategoryIconEntry {
  name: string;
  label: string;
}

/** Curated list shown in the category icon picker */
export const CATEGORY_ICONS: CategoryIconEntry[] = [
  { name: 'UtensilsCrossed', label: 'Utensils' },
  { name: 'ChefHat',         label: 'Chef' },
  { name: 'Pizza',           label: 'Pizza' },
  { name: 'Sandwich',        label: 'Sandwich' },
  { name: 'Beef',            label: 'Beef' },
  { name: 'Fish',            label: 'Seafood' },
  { name: 'Salad',           label: 'Salad' },
  { name: 'Coffee',          label: 'Coffee' },
  { name: 'Wine',            label: 'Wine' },
  { name: 'Beer',            label: 'Beer' },
  { name: 'GlassWater',      label: 'Drinks' },
  { name: 'IceCream',        label: 'Ice Cream' },
  { name: 'CakeSlice',       label: 'Desserts' },
  { name: 'Cookie',          label: 'Snacks' },
  { name: 'Croissant',       label: 'Bakery' },
  { name: 'Egg',             label: 'Breakfast' },
  { name: 'Milk',            label: 'Dairy' },
  { name: 'Apple',           label: 'Fruits' },
  { name: 'Carrot',          label: 'Veggies' },
  { name: 'Wheat',           label: 'Grains' },
  { name: 'Candy',           label: 'Sweets' },
  { name: 'Flame',           label: 'Spicy / Hot' },
  { name: 'Leaf',            label: 'Vegan' },
  { name: 'Star',            label: 'Specials' },
  { name: 'Heart',           label: 'Favorites' },
  { name: 'Sparkles',        label: 'Featured' },
  { name: 'Tag',             label: 'Deals' },
  { name: 'Clock',           label: 'Limited Time' },
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
