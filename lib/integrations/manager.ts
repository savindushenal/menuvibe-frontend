/**
 * Integration Manager
 * 
 * Central hub for managing all integrations. Handles registration,
 * initialization, event routing, and lifecycle management.
 */

import { 
  Integration, 
  IntegrationType, 
  IntegrationEvent, 
  IntegrationStatus,
  IntegrationConfig 
} from './types';

export class IntegrationManager {
  private integrations: Map<string, Integration> = new Map();
  private eventListeners: Map<string, Set<(event: IntegrationEvent) => void>> = new Map();
  private initialized = false;

  /**
   * Register an integration
   */
  register(integration: Integration): void {
    if (this.integrations.has(integration.id)) {
      console.warn(`Integration ${integration.id} is already registered. Replacing.`);
    }
    this.integrations.set(integration.id, integration);
    console.log(`Integration registered: ${integration.name} (${integration.type})`);
  }

  /**
   * Unregister an integration
   */
  async unregister(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      await integration.disconnect();
      this.integrations.delete(integrationId);
      console.log(`Integration unregistered: ${integrationId}`);
    }
  }

  /**
   * Get an integration by ID
   */
  get<T extends Integration>(integrationId: string): T | undefined {
    return this.integrations.get(integrationId) as T | undefined;
  }

  /**
   * Get all integrations of a specific type
   */
  getByType(type: IntegrationType): Integration[] {
    return Array.from(this.integrations.values()).filter(i => i.type === type);
  }

  /**
   * Get all active integrations
   */
  getActive(): Integration[] {
    return Array.from(this.integrations.values()).filter(i => i.status === 'active');
  }

  /**
   * Initialize all registered integrations
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('IntegrationManager already initialized');
      return;
    }

    console.log(`Initializing ${this.integrations.size} integrations...`);

    const results = await Promise.allSettled(
      Array.from(this.integrations.values()).map(async (integration) => {
        try {
          await integration.initialize();
          console.log(`✓ ${integration.name} initialized`);
        } catch (error) {
          console.error(`✗ ${integration.name} failed to initialize:`, error);
          throw error;
        }
      })
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`${failed.length} integration(s) failed to initialize`);
    }

    this.initialized = true;
    console.log('IntegrationManager initialized');
  }

  /**
   * Disconnect all integrations
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down integrations...');
    
    await Promise.allSettled(
      Array.from(this.integrations.values()).map(i => i.disconnect())
    );

    this.integrations.clear();
    this.eventListeners.clear();
    this.initialized = false;
    
    console.log('IntegrationManager shut down');
  }

  /**
   * Emit an event to all relevant integrations
   */
  async emit(event: IntegrationEvent): Promise<void> {
    // Notify specific event listeners
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Event listener error for ${event.type}:`, error);
        }
      });
    }

    // Route to integration hooks
    const hookName = this.eventToHook(event.type);
    if (hookName) {
      for (const integration of this.getActive()) {
        const hook = integration.hooks[hookName as keyof typeof integration.hooks];
        if (typeof hook === 'function') {
          try {
            await hook(event.payload, event);
          } catch (error) {
            console.error(`Hook error in ${integration.name}:`, error);
          }
        }
      }
    }
  }

  /**
   * Subscribe to events
   */
  on(eventType: string, listener: (event: IntegrationEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Run health checks on all integrations
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    const entries = Array.from(this.integrations.entries());
    for (const [id, integration] of entries) {
      try {
        results.set(id, await integration.healthCheck());
      } catch {
        results.set(id, false);
      }
    }
    
    return results;
  }

  /**
   * Get status of all integrations
   */
  getStatus(): Map<string, IntegrationStatus> {
    const status = new Map<string, IntegrationStatus>();
    const entries = Array.from(this.integrations.entries());
    for (const [id, integration] of entries) {
      status.set(id, integration.status);
    }
    return status;
  }

  private eventToHook(eventType: string): string | null {
    const mapping: Record<string, string> = {
      'cart:add': 'onAddToCart',
      'cart:update': 'onCartUpdate',
      'order:placed': 'onOrderPlaced',
      'menu:scan': 'onMenuScan',
      'customer:action': 'onCustomerAction',
    };
    return mapping[eventType] || null;
  }
}

// Singleton instance
let managerInstance: IntegrationManager | null = null;

export function getIntegrationManager(): IntegrationManager {
  if (!managerInstance) {
    managerInstance = new IntegrationManager();
  }
  return managerInstance;
}

export function resetIntegrationManager(): void {
  if (managerInstance) {
    managerInstance.shutdown();
    managerInstance = null;
  }
}
