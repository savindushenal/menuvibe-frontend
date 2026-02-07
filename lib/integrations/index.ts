/**
 * MenuVire Integrations System
 * 
 * This module provides a pluggable architecture for connecting third-party services
 * such as loyalty programs, ordering systems, payment gateways, and analytics.
 * 
 * Usage:
 *   import { IntegrationManager, LoyaltyIntegration } from '@/lib/integrations';
 *   
 *   const manager = new IntegrationManager();
 *   manager.register(new LoyaltyIntegration(config));
 *   await manager.initialize();
 */

export * from './types';
export * from './manager';
export * from './loyalty';
export * from './ordering';
export * from './analytics';
export * from './payment';
