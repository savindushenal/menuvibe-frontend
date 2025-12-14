/**
 * Analytics Integration
 * 
 * Track menu views, user behavior, and conversion metrics.
 */

import {
  Integration,
  IntegrationConfig,
  IntegrationHooks,
  IntegrationMetadata,
  IntegrationStatus,
  AnalyticsEvent,
} from './types';

export interface AnalyticsConfig extends IntegrationConfig {
  type: 'analytics';
  settings: {
    trackingId?: string;
    debug?: boolean;
    sampleRate?: number;
    excludePaths?: string[];
  };
}

export interface AnalyticsIntegrationInterface extends Integration {
  /** Track a page view */
  trackPageView(path: string, title?: string): void;
  
  /** Track a custom event */
  trackEvent(event: string, properties?: Record<string, any>): void;
  
  /** Identify a user */
  identify(userId: string, traits?: Record<string, any>): void;
  
  /** Set user properties */
  setUserProperties(properties: Record<string, any>): void;
  
  /** Track timing */
  trackTiming(category: string, variable: string, value: number): void;
  
  /** Get session ID */
  getSessionId(): string | null;
}

/**
 * Base Analytics Integration
 */
export abstract class BaseAnalyticsIntegration implements AnalyticsIntegrationInterface {
  readonly type = 'analytics' as const;
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  
  status: IntegrationStatus = 'inactive';
  config: AnalyticsConfig;
  hooks: IntegrationHooks;
  
  protected sessionId: string | null = null;
  protected userId: string | null = null;
  protected eventQueue: AnalyticsEvent[] = [];

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.hooks = {
      onMenuScan: async (endpoint) => {
        this.trackEvent('menu_scan', {
          endpoint_id: endpoint.id,
          endpoint_type: endpoint.type,
          endpoint_name: endpoint.name,
        });
      },
      onAddToCart: async (item, quantity) => {
        this.trackEvent('add_to_cart', {
          item_id: item.id,
          item_name: item.name,
          item_price: item.price,
          quantity,
        });
      },
      onOrderPlaced: async (order) => {
        this.trackEvent('order_placed', {
          order_total: order.total,
          items_count: order.items.length,
          currency: order.currency,
        });
      },
    };
  }

  abstract initialize(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  
  abstract trackPageView(path: string, title?: string): void;
  abstract trackEvent(event: string, properties?: Record<string, any>): void;
  abstract identify(userId: string, traits?: Record<string, any>): void;
  abstract setUserProperties(properties: Record<string, any>): void;
  abstract trackTiming(category: string, variable: string, value: number): void;

  getSessionId(): string | null {
    return this.sessionId;
  }

  getMetadata(): IntegrationMetadata {
    return {
      id: this.id,
      name: this.name,
      description: 'Analytics tracking integration',
      version: this.version,
      type: 'analytics',
      supportedFeatures: ['pageViews', 'events', 'userIdentification', 'timing'],
      requiredConfig: ['trackingId'],
      optionalConfig: ['sampleRate', 'debug'],
    };
  }

  protected generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected shouldTrack(): boolean {
    const sampleRate = this.config.settings?.sampleRate ?? 100;
    return Math.random() * 100 < sampleRate;
  }

  protected log(...args: any[]): void {
    if (this.config.settings?.debug) {
      console.log(`[${this.name}]`, ...args);
    }
  }
}

/**
 * Console Analytics (for development)
 */
export class ConsoleAnalyticsIntegration extends BaseAnalyticsIntegration {
  readonly id = 'console-analytics';
  readonly name = 'Console Analytics';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    this.sessionId = this.generateSessionId();
    this.status = 'active';
    this.log('Initialized with session:', this.sessionId);
  }

  async disconnect(): Promise<void> {
    this.log('Disconnected');
    this.status = 'inactive';
  }

  async healthCheck(): Promise<boolean> {
    return this.status === 'active';
  }

  trackPageView(path: string, title?: string): void {
    if (!this.shouldTrack()) return;
    this.log('Page View:', { path, title, sessionId: this.sessionId });
  }

  trackEvent(event: string, properties?: Record<string, any>): void {
    if (!this.shouldTrack()) return;
    this.log('Event:', event, properties);
    
    this.eventQueue.push({
      event,
      properties: properties || {},
      timestamp: new Date(),
      sessionId: this.sessionId || undefined,
      userId: this.userId || undefined,
    });
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    this.log('Identify:', userId, traits);
  }

  setUserProperties(properties: Record<string, any>): void {
    this.log('User Properties:', properties);
  }

  trackTiming(category: string, variable: string, value: number): void {
    this.log('Timing:', { category, variable, value });
  }
}

/**
 * REST API Analytics Integration
 * Send analytics to your own backend
 */
export class RestApiAnalyticsIntegration extends BaseAnalyticsIntegration {
  readonly id = 'rest-analytics';
  readonly name = 'REST API Analytics';
  readonly version = '1.0.0';

  private baseUrl: string;
  private headers: HeadersInit;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsConfig) {
    super(config);
    this.baseUrl = config.baseUrl || '';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };
  }

  async initialize(): Promise<void> {
    if (!this.baseUrl) {
      throw new Error('Base URL is required');
    }
    
    this.sessionId = this.generateSessionId();
    this.status = 'active';
    
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), 30000);
  }

  async disconnect(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
    this.status = 'inactive';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { headers: this.headers });
      return response.ok;
    } catch {
      return false;
    }
  }

  trackPageView(path: string, title?: string): void {
    this.trackEvent('page_view', { path, title });
  }

  trackEvent(event: string, properties?: Record<string, any>): void {
    if (!this.shouldTrack()) return;
    
    this.eventQueue.push({
      event,
      properties: properties || {},
      timestamp: new Date(),
      sessionId: this.sessionId || undefined,
      userId: this.userId || undefined,
    });
    
    // Auto-flush if queue is large
    if (this.eventQueue.length >= 20) {
      this.flush();
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    this.trackEvent('identify', { userId, ...traits });
  }

  setUserProperties(properties: Record<string, any>): void {
    this.trackEvent('user_properties', properties);
  }

  trackTiming(category: string, variable: string, value: number): void {
    this.trackEvent('timing', { category, variable, value });
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      await fetch(`${this.baseUrl}/events/batch`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // Put events back in queue on failure
      this.eventQueue.unshift(...events);
      console.error('Failed to flush analytics:', error);
    }
  }
}
