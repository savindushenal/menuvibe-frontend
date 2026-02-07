/**
 * Template Router
 * 
 * This system allows developers to create custom menu templates
 * and register them here. Each franchise can select their preferred template.
 * 
 * How to add a new template:
 * 1. Create folder: templates/your-template-name/
 * 2. Create MenuView.tsx component
 * 3. Register below in TEMPLATE_REGISTRY
 * 4. Assign template_key in database
 */

import { ComponentType } from 'react';
import DefaultTemplate from '@/components/menu/ApiDrivenMenu';
import PremiumRestaurantTemplate from '@/templates/premium-restaurant/MenuView';
import BaristaStyleTemplate from '@/templates/barista-style/MenuView';

// Template component interface
export interface MenuTemplateProps {
  code: string;
}

export type TemplateComponent = ComponentType<MenuTemplateProps>;

// Template metadata
export interface TemplateInfo {
  key: string;
  name: string;
  description: string;
  developer: string;
  isPremium: boolean;
  previewImage?: string;
  component: TemplateComponent;
}

/**
 * Template Registry
 * Add your custom templates here
 */
export const TEMPLATE_REGISTRY: Record<string, TemplateInfo> = {
  'default': {
    key: 'default',
    name: 'Default Template',
    description: 'Universal API-driven template with dynamic configuration',
    developer: 'MenuVire Core',
    isPremium: false,
    component: DefaultTemplate,
  },
  
  'premium-restaurant': {
    key: 'premium-restaurant',
    name: 'Premium Restaurant',
    description: 'Elegant full-screen template with hero section, featured items, and floating cart',
    developer: 'MenuVire Team',
    isPremium: true,
    previewImage: '/templates/premium-restaurant-preview.jpg',
    component: PremiumRestaurantTemplate,
  },
  
  'barista-style': {
    key: 'barista-style',
    name: 'Barista Coffee Style',
    description: 'Premium cafe template with animated header, category tabs, product sheets and cart',
    developer: 'MenuVire Team',
    isPremium: true,
    previewImage: '/templates/barista-style-preview.jpg',
    component: BaristaStyleTemplate,
  },
  
  // Example: Add your custom templates
  // 'premium-cafe': {
  //   key: 'premium-cafe',
  //   name: 'Premium Cafe',
  //   description: 'Beautiful template for coffee shops with animations',
  //   developer: 'Your Name',
  //   isPremium: true,
  //   previewImage: '/templates/premium-cafe-preview.jpg',
  //   component: PremiumCafeTemplate,
  // },
  
  // 'restaurant-deluxe': {
  //   key: 'restaurant-deluxe',
  //   name: 'Restaurant Deluxe',
  //   description: 'Elegant template for fine dining establishments',
  //   developer: 'Your Name',
  //   isPremium: true,
  //   component: RestaurantDeluxeTemplate,
  // },
};

/**
 * Get template component by key
 * Falls back to default if template not found
 */
export function getTemplate(templateKey: string): TemplateComponent {
  const template = TEMPLATE_REGISTRY[templateKey];
  
  if (!template) {
    console.warn(`Template '${templateKey}' not found, using default`);
    return TEMPLATE_REGISTRY['default'].component;
  }
  
  return template.component;
}

/**
 * Get all available templates
 * Useful for template selection UI
 */
export function getAllTemplates(): TemplateInfo[] {
  return Object.values(TEMPLATE_REGISTRY);
}

/**
 * Get template metadata
 */
export function getTemplateInfo(templateKey: string): TemplateInfo | null {
  return TEMPLATE_REGISTRY[templateKey] || null;
}

/**
 * Check if template is premium
 */
export function isTemplatePremium(templateKey: string): boolean {
  return TEMPLATE_REGISTRY[templateKey]?.isPremium || false;
}
