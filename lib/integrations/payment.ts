/**
 * Payment Integration
 * 
 * Handle payments through various payment gateways.
 */

import {
  Integration,
  IntegrationConfig,
  IntegrationHooks,
  IntegrationMetadata,
  IntegrationStatus,
  PaymentIntent,
  OrderData,
} from './types';

export interface PaymentConfig extends IntegrationConfig {
  type: 'payment';
  settings: {
    publishableKey?: string;
    merchantId?: string;
    currency?: string;
    testMode?: boolean;
    supportedMethods?: string[];
  };
}

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'succeeded' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'bank' | 'cash';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface PaymentIntegrationInterface extends Integration {
  /** Create a payment intent */
  createPaymentIntent(order: OrderData): Promise<PaymentIntent>;
  
  /** Confirm a payment */
  confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent>;
  
  /** Cancel a payment */
  cancelPayment(paymentIntentId: string): Promise<boolean>;
  
  /** Refund a payment */
  refundPayment(paymentIntentId: string, amount?: number): Promise<boolean>;
  
  /** Get payment status */
  getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent>;
  
  /** Get supported payment methods */
  getSupportedMethods(): string[];
}

/**
 * Base Payment Integration
 */
export abstract class BasePaymentIntegration implements PaymentIntegrationInterface {
  readonly type = 'payment' as const;
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  
  status: IntegrationStatus = 'inactive';
  config: PaymentConfig;
  hooks: IntegrationHooks;

  constructor(config: PaymentConfig) {
    this.config = config;
    this.hooks = {};
  }

  abstract initialize(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  
  abstract createPaymentIntent(order: OrderData): Promise<PaymentIntent>;
  abstract confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent>;
  abstract cancelPayment(paymentIntentId: string): Promise<boolean>;
  abstract refundPayment(paymentIntentId: string, amount?: number): Promise<boolean>;
  abstract getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent>;

  getSupportedMethods(): string[] {
    return this.config.settings?.supportedMethods || ['card'];
  }

  getMetadata(): IntegrationMetadata {
    return {
      id: this.id,
      name: this.name,
      description: 'Payment processing integration',
      version: this.version,
      type: 'payment',
      supportedFeatures: ['createIntent', 'confirm', 'refund'],
      requiredConfig: ['apiKey', 'publishableKey'],
      optionalConfig: ['testMode', 'supportedMethods'],
    };
  }
}

/**
 * REST API Payment Integration
 * Connect to a payment gateway via REST API
 */
export class RestApiPaymentIntegration extends BasePaymentIntegration {
  readonly id = 'rest-payment';
  readonly name = 'REST API Payment';
  readonly version = '1.0.0';

  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: PaymentConfig) {
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
    
    this.status = 'connecting';
    const healthy = await this.healthCheck();
    this.status = healthy ? 'active' : 'error';
    
    if (!healthy) {
      throw new Error('Failed to connect to payment API');
    }
  }

  async disconnect(): Promise<void> {
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

  async createPaymentIntent(order: OrderData): Promise<PaymentIntent> {
    const response = await fetch(`${this.baseUrl}/payment-intents`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        amount: Math.round(order.total * 100), // Convert to cents
        currency: order.currency.toLowerCase(),
        metadata: {
          items_count: order.items.length,
          endpoint_id: order.endpointId,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }
    
    return response.json();
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    const response = await fetch(`${this.baseUrl}/payment-intents/${paymentIntentId}/confirm`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ payment_method: paymentMethodId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to confirm payment');
    }
    
    return response.json();
  }

  async cancelPayment(paymentIntentId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/payment-intents/${paymentIntentId}/cancel`, {
      method: 'POST',
      headers: this.headers,
    });
    
    return response.ok;
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/refunds`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      }),
    });
    
    return response.ok;
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent> {
    const response = await fetch(`${this.baseUrl}/payment-intents/${paymentIntentId}`, {
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error('Payment intent not found');
    }
    
    return response.json();
  }
}

/**
 * Mock Payment Integration (for development/testing)
 */
export class MockPaymentIntegration extends BasePaymentIntegration {
  readonly id = 'mock-payment';
  readonly name = 'Mock Payment';
  readonly version = '1.0.0';

  private intents: Map<string, PaymentIntent> = new Map();
  private counter = 0;

  async initialize(): Promise<void> {
    this.status = 'active';
  }

  async disconnect(): Promise<void> {
    this.intents.clear();
    this.status = 'inactive';
  }

  async healthCheck(): Promise<boolean> {
    return this.status === 'active';
  }

  async createPaymentIntent(order: OrderData): Promise<PaymentIntent> {
    const id = `pi_mock_${++this.counter}_${Date.now()}`;
    
    const intent: PaymentIntent = {
      id,
      amount: Math.round(order.total * 100),
      currency: order.currency.toLowerCase(),
      status: 'pending',
      clientSecret: `${id}_secret_${Math.random().toString(36).substr(2)}`,
    };
    
    this.intents.set(id, intent);
    return intent;
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    const intent = this.intents.get(paymentIntentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }
    
    // Simulate processing
    intent.status = 'processing';
    intent.paymentMethod = paymentMethodId;
    
    // Simulate success after delay
    setTimeout(() => {
      intent.status = 'succeeded';
    }, 1000);
    
    return intent;
  }

  async cancelPayment(paymentIntentId: string): Promise<boolean> {
    const intent = this.intents.get(paymentIntentId);
    if (!intent) {
      return false;
    }
    
    if (intent.status === 'succeeded') {
      return false;
    }
    
    intent.status = 'cancelled';
    return true;
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<boolean> {
    const intent = this.intents.get(paymentIntentId);
    if (!intent || intent.status !== 'succeeded') {
      return false;
    }
    
    // In mock, we just mark as refunded (simplified)
    return true;
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent> {
    const intent = this.intents.get(paymentIntentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }
    return intent;
  }
}
