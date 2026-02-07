/**
 * Ordering System Integration
 * 
 * Integrations for order management, kitchen display systems,
 * and third-party ordering platforms.
 */

import {
  Integration,
  IntegrationConfig,
  IntegrationHooks,
  IntegrationMetadata,
  IntegrationStatus,
  OrderData,
  OrderItem,
  CustomerInfo,
} from './types';

export interface OrderingConfig extends IntegrationConfig {
  type: 'ordering';
  settings: {
    autoConfirm?: boolean;        // Auto-confirm orders
    kitchenPrinter?: string;      // Kitchen printer endpoint
    estimatedPrepTime?: number;   // Default prep time in minutes
    maxQueueSize?: number;        // Max orders in queue
    webhookEvents?: string[];     // Events to send webhooks for
  };
}

export interface Order extends OrderData {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  estimatedReadyAt?: Date;
  completedAt?: Date;
  kitchenNotes?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OrderingIntegrationInterface extends Integration {
  /** Submit a new order */
  submitOrder(order: OrderData): Promise<Order>;
  
  /** Get order status */
  getOrderStatus(orderId: string): Promise<Order>;
  
  /** Update order status */
  updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order>;
  
  /** Cancel an order */
  cancelOrder(orderId: string, reason?: string): Promise<boolean>;
  
  /** Get order history for a customer */
  getOrderHistory(customerId: string): Promise<Order[]>;
  
  /** Get current queue */
  getQueue(): Promise<Order[]>;
  
  /** Estimate preparation time */
  estimatePrepTime(items: OrderItem[]): Promise<number>;
}

/**
 * Base Ordering Integration
 */
export abstract class BaseOrderingIntegration implements OrderingIntegrationInterface {
  readonly type = 'ordering' as const;
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  
  status: IntegrationStatus = 'inactive';
  config: OrderingConfig;
  hooks: IntegrationHooks;

  constructor(config: OrderingConfig) {
    this.config = config;
    this.hooks = {};
  }

  abstract initialize(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  
  abstract submitOrder(order: OrderData): Promise<Order>;
  abstract getOrderStatus(orderId: string): Promise<Order>;
  abstract updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order>;
  abstract cancelOrder(orderId: string, reason?: string): Promise<boolean>;
  abstract getOrderHistory(customerId: string): Promise<Order[]>;
  abstract getQueue(): Promise<Order[]>;
  abstract estimatePrepTime(items: OrderItem[]): Promise<number>;

  getMetadata(): IntegrationMetadata {
    return {
      id: this.id,
      name: this.name,
      description: 'Order management integration',
      version: this.version,
      type: 'ordering',
      supportedFeatures: ['submit', 'track', 'queue', 'history'],
      requiredConfig: ['apiKey'],
      optionalConfig: ['autoConfirm', 'estimatedPrepTime'],
    };
  }
}

/**
 * REST API Ordering Integration
 */
export class RestApiOrderingIntegration extends BaseOrderingIntegration {
  readonly id = 'rest-ordering';
  readonly name = 'REST API Ordering';
  readonly version = '1.0.0';

  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: OrderingConfig) {
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
      throw new Error('Failed to connect to ordering API');
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

  async submitOrder(order: OrderData): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(order),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit order');
    }
    
    return response.json();
  }

  async getOrderStatus(orderId: string): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error('Order not found');
    }
    
    return response.json();
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ status, notes }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update order');
    }
    
    return response.json();
  }

  async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ reason }),
    });
    
    return response.ok;
  }

  async getOrderHistory(customerId: string): Promise<Order[]> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/orders`, {
      headers: this.headers,
    });
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  }

  async getQueue(): Promise<Order[]> {
    const response = await fetch(`${this.baseUrl}/orders/queue`, {
      headers: this.headers,
    });
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  }

  async estimatePrepTime(items: OrderItem[]): Promise<number> {
    const response = await fetch(`${this.baseUrl}/orders/estimate`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ items }),
    });
    
    if (!response.ok) {
      return this.config.settings?.estimatedPrepTime || 15;
    }
    
    const data = await response.json();
    return data.estimatedMinutes;
  }
}

/**
 * In-Memory Ordering Integration (for development/testing)
 */
export class InMemoryOrderingIntegration extends BaseOrderingIntegration {
  readonly id = 'memory-ordering';
  readonly name = 'In-Memory Ordering';
  readonly version = '1.0.0';

  private orders: Map<string, Order> = new Map();
  private orderCounter = 0;

  async initialize(): Promise<void> {
    this.status = 'active';
  }

  async disconnect(): Promise<void> {
    this.orders.clear();
    this.status = 'inactive';
  }

  async healthCheck(): Promise<boolean> {
    return this.status === 'active';
  }

  async submitOrder(orderData: OrderData): Promise<Order> {
    const orderId = `ORD-${++this.orderCounter}-${Date.now()}`;
    const prepTime = await this.estimatePrepTime(orderData.items);
    
    const order: Order = {
      ...orderData,
      id: orderId,
      status: this.config.settings?.autoConfirm ? 'confirmed' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedReadyAt: new Date(Date.now() + prepTime * 60000),
    };
    
    this.orders.set(orderId, order);
    return order;
  }

  async getOrderStatus(orderId: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    order.status = status;
    order.updatedAt = new Date();
    if (notes) {
      order.kitchenNotes = notes;
    }
    if (status === 'completed') {
      order.completedAt = new Date();
    }
    
    return order;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) {
      return false;
    }
    
    if (['ready', 'completed'].includes(order.status)) {
      return false;
    }
    
    order.status = 'cancelled';
    order.updatedAt = new Date();
    if (reason) {
      order.kitchenNotes = `Cancelled: ${reason}`;
    }
    
    return true;
  }

  async getOrderHistory(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.customerInfo?.id === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getQueue(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async estimatePrepTime(items: OrderItem[]): Promise<number> {
    // Simple estimation: base time + time per item
    const baseTime = 5;
    const timePerItem = 3;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return Math.min(
      baseTime + Math.ceil(totalItems * timePerItem),
      this.config.settings?.estimatedPrepTime || 30
    );
  }
}
