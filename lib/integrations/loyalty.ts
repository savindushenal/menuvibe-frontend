/**
 * Loyalty Program Integration
 * 
 * Base class and implementations for loyalty program integrations.
 * Supports common loyalty providers and custom implementations.
 */

import {
  Integration,
  IntegrationConfig,
  IntegrationHooks,
  IntegrationMetadata,
  IntegrationStatus,
  LoyaltyPoints,
  LoyaltyReward,
  CustomerInfo,
} from './types';

export interface LoyaltyConfig extends IntegrationConfig {
  type: 'loyalty';
  settings: {
    pointsPerCurrency?: number;  // Points earned per dollar spent
    welcomeBonus?: number;       // Points for new members
    referralBonus?: number;      // Points for referrals
    customEndpoint?: string;     // Custom API endpoint
  };
}

export interface LoyaltyIntegrationInterface extends Integration {
  /** Get customer's loyalty points */
  getPoints(customerId: string): Promise<LoyaltyPoints>;
  
  /** Add points to customer */
  addPoints(customerId: string, points: number, reason?: string): Promise<LoyaltyPoints>;
  
  /** Redeem points for a reward */
  redeemReward(customerId: string, reward: LoyaltyReward): Promise<boolean>;
  
  /** Get available rewards */
  getRewards(customerId: string): Promise<LoyaltyReward[]>;
  
  /** Check if customer is enrolled */
  isEnrolled(customerId: string): Promise<boolean>;
  
  /** Enroll a new customer */
  enroll(customer: CustomerInfo): Promise<string>;
}

/**
 * Base Loyalty Integration
 * Extend this class to create custom loyalty integrations
 */
export abstract class BaseLoyaltyIntegration implements LoyaltyIntegrationInterface {
  readonly type = 'loyalty' as const;
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  
  status: IntegrationStatus = 'inactive';
  config: LoyaltyConfig;
  hooks: IntegrationHooks;

  constructor(config: LoyaltyConfig) {
    this.config = config;
    this.hooks = {
      onOrderPlaced: async (order) => {
        if (order.customerInfo?.loyaltyId) {
          const points = this.calculatePoints(order.total);
          await this.addPoints(order.customerInfo.loyaltyId, points, 'Order completed');
        }
      },
    };
  }

  abstract initialize(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  
  abstract getPoints(customerId: string): Promise<LoyaltyPoints>;
  abstract addPoints(customerId: string, points: number, reason?: string): Promise<LoyaltyPoints>;
  abstract redeemReward(customerId: string, reward: LoyaltyReward): Promise<boolean>;
  abstract getRewards(customerId: string): Promise<LoyaltyReward[]>;
  abstract isEnrolled(customerId: string): Promise<boolean>;
  abstract enroll(customer: CustomerInfo): Promise<string>;

  getMetadata(): IntegrationMetadata {
    return {
      id: this.id,
      name: this.name,
      description: 'Loyalty program integration',
      version: this.version,
      type: 'loyalty',
      supportedFeatures: ['points', 'rewards', 'tiers'],
      requiredConfig: ['apiKey'],
      optionalConfig: ['pointsPerCurrency', 'welcomeBonus'],
    };
  }

  protected calculatePoints(amount: number): number {
    const rate = this.config.settings?.pointsPerCurrency || 1;
    return Math.floor(amount * rate);
  }
}

/**
 * Generic REST API Loyalty Integration
 * Connect to any loyalty API with standard REST endpoints
 */
export class RestApiLoyaltyIntegration extends BaseLoyaltyIntegration {
  readonly id = 'rest-loyalty';
  readonly name = 'REST API Loyalty';
  readonly version = '1.0.0';

  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: LoyaltyConfig) {
    super(config);
    this.baseUrl = config.baseUrl || config.settings?.customEndpoint || '';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };
  }

  async initialize(): Promise<void> {
    if (!this.baseUrl) {
      throw new Error('Base URL is required for REST API loyalty integration');
    }
    this.status = 'connecting';
    
    const healthy = await this.healthCheck();
    if (healthy) {
      this.status = 'active';
    } else {
      this.status = 'error';
      throw new Error('Failed to connect to loyalty API');
    }
  }

  async disconnect(): Promise<void> {
    this.status = 'inactive';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.headers,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getPoints(customerId: string): Promise<LoyaltyPoints> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/points`, {
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to get loyalty points');
    }
    
    return response.json();
  }

  async addPoints(customerId: string, points: number, reason?: string): Promise<LoyaltyPoints> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/points`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ points, reason }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add loyalty points');
    }
    
    return response.json();
  }

  async redeemReward(customerId: string, reward: LoyaltyReward): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/redeem`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ rewardId: reward.id }),
    });
    
    return response.ok;
  }

  async getRewards(customerId: string): Promise<LoyaltyReward[]> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/rewards`, {
      headers: this.headers,
    });
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  }

  async isEnrolled(customerId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
      headers: this.headers,
    });
    return response.ok;
  }

  async enroll(customer: CustomerInfo): Promise<string> {
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(customer),
    });
    
    if (!response.ok) {
      throw new Error('Failed to enroll customer');
    }
    
    const data = await response.json();
    return data.loyaltyId || data.id;
  }
}

/**
 * In-Memory Loyalty Integration (for development/testing)
 */
export class InMemoryLoyaltyIntegration extends BaseLoyaltyIntegration {
  readonly id = 'memory-loyalty';
  readonly name = 'In-Memory Loyalty';
  readonly version = '1.0.0';

  private customers: Map<string, { points: LoyaltyPoints; info: CustomerInfo }> = new Map();
  private rewards: LoyaltyReward[] = [
    { id: '1', name: 'Free Coffee', description: 'Any size coffee', pointsCost: 100, type: 'freeItem' },
    { id: '2', name: '10% Off', description: '10% off your order', pointsCost: 200, type: 'discount', value: 10 },
    { id: '3', name: 'Free Dessert', description: 'Any dessert item', pointsCost: 300, type: 'freeItem' },
    { id: '4', name: '20% Off', description: '20% off your order', pointsCost: 500, type: 'discount', value: 20 },
  ];

  async initialize(): Promise<void> {
    this.status = 'active';
  }

  async disconnect(): Promise<void> {
    this.customers.clear();
    this.status = 'inactive';
  }

  async healthCheck(): Promise<boolean> {
    return this.status === 'active';
  }

  async getPoints(customerId: string): Promise<LoyaltyPoints> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer.points;
  }

  async addPoints(customerId: string, points: number, reason?: string): Promise<LoyaltyPoints> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    customer.points.current += points;
    customer.points.lifetime += points;
    
    // Update tier
    if (customer.points.lifetime >= 5000) {
      customer.points.tier = 'Gold';
    } else if (customer.points.lifetime >= 1000) {
      customer.points.tier = 'Silver';
    } else {
      customer.points.tier = 'Bronze';
    }
    
    return customer.points;
  }

  async redeemReward(customerId: string, reward: LoyaltyReward): Promise<boolean> {
    const customer = this.customers.get(customerId);
    if (!customer || customer.points.current < reward.pointsCost) {
      return false;
    }
    
    customer.points.current -= reward.pointsCost;
    return true;
  }

  async getRewards(customerId: string): Promise<LoyaltyReward[]> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      return [];
    }
    
    return this.rewards.filter(r => r.pointsCost <= customer.points.current);
  }

  async isEnrolled(customerId: string): Promise<boolean> {
    return this.customers.has(customerId);
  }

  async enroll(customer: CustomerInfo): Promise<string> {
    const loyaltyId = `LYL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.customers.set(loyaltyId, {
      points: {
        current: this.config.settings?.welcomeBonus || 50,
        lifetime: this.config.settings?.welcomeBonus || 50,
        tier: 'Bronze',
      },
      info: { ...customer, loyaltyId },
    });
    
    return loyaltyId;
  }
}
