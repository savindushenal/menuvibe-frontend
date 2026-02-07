// Menu Templates - Central Export
// This file exports all available menu templates

// Premium Template (Default) - Full-featured with animations
export { PremiumTemplate } from './premium';

// Classic Template - Simple list-based layout  
export { ClassicTemplate } from './classic';

// Minimal Template - Clean card-based design
export { MinimalTemplate } from './minimal';

// Custom Template - For franchise-specific implementations
export { CustomTemplate } from './custom';

// Shared Types
export * from './premium/types';

// Template Type Definition
export type TemplateType = 'premium' | 'classic' | 'minimal' | 'custom';

// Template Metadata for UI Selection
export const TEMPLATE_OPTIONS = [
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full-featured with animations, top picks, and modern design',
    preview: '✨',
    features: ['Animated transitions', 'Top picks section', 'Category navigation', 'Cart sheet'],
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Simple and clean list-based menu layout',
    preview: '📋',
    features: ['List layout', 'Category tabs', 'Clean design', 'Easy navigation'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Modern card-based design with quick add buttons',
    preview: '🎯',
    features: ['Grid cards', 'Quick add', 'Bottom sheet cart', 'Compact'],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'For franchises with special requirements (dev team implementation)',
    preview: '🛠️',
    features: ['Custom payment', 'User auth', 'Loyalty programs', 'External integrations'],
  },
] as const;
