/**
 * Integration Types
 * 
 * Base types for the MenuVire integrations system.
 */

export type IntegrationType = 
  | 'loyalty'
  | 'ordering'
  | 'payment'
  | 'analytics'
  | 'reservation'
  | 'delivery'
  | 'pos'
  | 'crm'
  | 'marketing'
  | 'custom';

export type IntegrationStatus = 'inactive' | 'connecting' | 'active' | 'error';

export interface IntegrationConfig {
  id: string;
  type: IntegrationType;
  name: string;
  description?: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  baseUrl?: string;
  settings?: Record<string, any>;
  enabled: boolean;
}

export interface IntegrationEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
}

export interface IntegrationHooks {
  /** Called when a menu item is added to cart */
  onAddToCart?: (item: any, quantity: number) => Promise<void>;
  /** Called when cart is updated */
  onCartUpdate?: (cart: any[]) => Promise<void>;
  /** Called when an order is placed */
  onOrderPlaced?: (order: any) => Promise<void>;
  /** Called when a QR code is scanned */
  onMenuScan?: (endpoint: any) => Promise<void>;
  /** Called when a customer action occurs */
  onCustomerAction?: (action: string, data: any) => Promise<void>;
}

export interface Integration {
  readonly id: string;
  readonly type: IntegrationType;
  readonly name: string;
  readonly version: string;
  
  status: IntegrationStatus;
  config: IntegrationConfig;
  hooks: IntegrationHooks;
  
  /** Initialize the integration */
  initialize(): Promise<void>;
  
  /** Disconnect and cleanup */
  disconnect(): Promise<void>;
  
  /** Check if integration is healthy */
  healthCheck(): Promise<boolean>;
  
  /** Handle incoming webhook */
  handleWebhook?(event: IntegrationEvent): Promise<any>;
  
  /** Get integration metadata */
  getMetadata(): IntegrationMetadata;
}

export interface IntegrationMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  type: IntegrationType;
  icon?: string;
  website?: string;
  supportedFeatures: string[];
  requiredConfig: string[];
  optionalConfig: string[];
}

// Specific integration interfaces

export interface LoyaltyPoints {
  current: number;
  lifetime: number;
  tier?: string;
  nextTierPoints?: number;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'freeItem' | 'upgrade' | 'custom';
  value?: number;
  itemId?: string;
}

export interface OrderData {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  customerInfo?: CustomerInfo;
  notes?: string;
  tableNumber?: string;
  endpointId?: number;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  variations?: { name: string; price: number }[];
  notes?: string;
}

export interface CustomerInfo {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  loyaltyId?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  clientSecret?: string;
  paymentMethod?: string;
}

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}
