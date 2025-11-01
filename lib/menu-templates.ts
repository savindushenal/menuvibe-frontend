export interface MenuStyle {
  background_type?: 'color' | 'gradient' | 'image';
  background_color: string;
  background_gradient?: string;
  background_image?: string;
  primary_color?: string;
  text_color: string;
  accent_color?: string;
  font_family: string;
  layout: 'grid' | 'list' | 'masonry';
  border_radius: number;
  spacing: number;
  show_images: boolean;
  show_prices: boolean;
  show_descriptions?: boolean;
  show_dietary_info?: boolean;
  show_allergens?: boolean;
  card_style?: 'modern' | 'classic' | 'minimal' | 'elegant' | 'shadow' | 'bordered' | 'filled' | 'none';
  title_font_size?: number;
  item_name_font_size?: number;
  description_font_size?: number;
  price_font_size?: number;
  category_font_size?: number;
}

export interface MenuTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // Preview image or emoji
  style: MenuStyle;
}

export const MENU_TEMPLATES: MenuTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design',
    preview: '🎨',
    style: {
      layout: 'grid',
      card_style: 'shadow',
      border_radius: 12,
      spacing: 16,
      show_images: true,
      show_prices: true,
      primary_color: '#3B82F6',
      background_color: '#F9FAFB',
      text_color: '#1F2937',
      font_family: 'Inter',
      title_font_size: 32,
      item_name_font_size: 16,
      description_font_size: 14,
      price_font_size: 16,
      category_font_size: 24
    }
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional restaurant style',
    preview: '📜',
    style: {
      layout: 'list',
      card_style: 'bordered',
      border_radius: 4,
      spacing: 12,
      show_images: true,
      show_prices: true,
      primary_color: '#92400E',
      background_color: '#FEF3C7',
      text_color: '#78350F',
      font_family: 'Georgia',
      title_font_size: 36,
      item_name_font_size: 18,
      description_font_size: 14,
      price_font_size: 16,
      category_font_size: 26
    }
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simple and elegant',
    preview: '⚪',
    style: {
      layout: 'list',
      card_style: 'none',
      border_radius: 0,
      spacing: 20,
      show_images: false,
      show_prices: true,
      primary_color: '#000000',
      background_color: '#FFFFFF',
      text_color: '#000000',
      font_family: 'Helvetica',
      title_font_size: 28,
      item_name_font_size: 16,
      description_font_size: 12,
      price_font_size: 14,
      category_font_size: 20
    }
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Eye-catching and vibrant',
    preview: '🔥',
    style: {
      layout: 'grid',
      card_style: 'filled',
      border_radius: 16,
      spacing: 20,
      show_images: true,
      show_prices: true,
      primary_color: '#DC2626',
      background_color: '#1F2937',
      text_color: '#FFFFFF',
      font_family: 'Arial',
      title_font_size: 40,
      item_name_font_size: 18,
      description_font_size: 14,
      price_font_size: 18,
      category_font_size: 28
    }
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated fine dining',
    preview: '✨',
    style: {
      layout: 'list',
      card_style: 'shadow',
      border_radius: 8,
      spacing: 16,
      show_images: true,
      show_prices: true,
      primary_color: '#6B21A8',
      background_color: '#FAF5FF',
      text_color: '#581C87',
      font_family: 'Georgia',
      title_font_size: 34,
      item_name_font_size: 17,
      description_font_size: 14,
      price_font_size: 17,
      category_font_size: 25
    }
  },
  {
    id: 'colorful',
    name: 'Colorful',
    description: 'Fun and playful',
    preview: '🌈',
    style: {
      layout: 'grid',
      card_style: 'filled',
      border_radius: 20,
      spacing: 18,
      show_images: true,
      show_prices: true,
      primary_color: '#EC4899',
      background_color: '#FDF2F8',
      text_color: '#831843',
      font_family: 'Arial',
      title_font_size: 36,
      item_name_font_size: 16,
      description_font_size: 14,
      price_font_size: 16,
      category_font_size: 26
    }
  }
];
