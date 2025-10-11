// =====================================================
// Payment Provider Types
// =====================================================
// Shared types for all payment providers

export type PaymentProvider = 'stripe' | 'lemonsqueezy' | 'cryptomus' | 'nowpayments';

export type PaymentMethod = 'card' | 'bitcoin' | 'ethereum' | 'usdt' | 'crypto';

export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'past_due'
  | 'pending'
  | 'trialing'
  | 'incomplete';

export type PlanInterval = 'month' | 'year';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: PlanInterval;
  features: string[];
  provider: PaymentProvider;
  variantId?: string; // LemonSqueezy specific
  priceId?: string; // Stripe specific
}

export interface CreateCheckoutParams {
  planId: string;
  userId: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
  paymentMethod?: PaymentMethod;
}

export interface CheckoutResponse {
  sessionId?: string;
  checkoutUrl: string;
  provider: PaymentProvider;
}

export interface SubscriptionData {
  id: string;
  userId: string;
  provider: PaymentProvider;
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: SubscriptionStatus;
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: PaymentMethod;
  cryptoCurrency?: string;
}

export interface WebhookEvent {
  provider: PaymentProvider;
  eventType: string;
  eventId?: string;
  payload: any;
}

export interface PaymentProviderInterface {
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResponse>;
  createRecurringPayment(params: CreateCheckoutParams): Promise<CheckoutResponse>;
  getSubscription(subscriptionId: string): Promise<SubscriptionData | null>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  handleWebhook(payload: any, signature: string): Promise<WebhookEvent>;
}
