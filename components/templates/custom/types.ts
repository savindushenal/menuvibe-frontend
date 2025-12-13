// Custom Template Types
export * from '../premium/types';

/**
 * Custom Template Configuration
 * 
 * For franchises with special requirements:
 * - Custom payment integrations
 * - User authentication/loyalty programs
 * - Third-party ordering systems
 * - White-label branding
 * 
 * Your dev team can extend this for specific franchise needs.
 */
export interface CustomTemplateConfig {
  // Payment & Ordering
  paymentProvider?: 'stripe' | 'payhere' | 'custom';
  orderingSystem?: 'internal' | 'external';
  externalOrderUrl?: string;
  
  // User Features
  enableUserAuth?: boolean;
  loyaltyProgram?: boolean;
  
  // Layout
  customHeader?: boolean;
  customFooter?: boolean;
  customComponents?: string[];
  
  // External Scripts
  externalScripts?: string[];
}
