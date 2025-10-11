-- =====================================================
-- ADD MULTI-PAYMENT PROVIDER SUPPORT
-- =====================================================
-- Extends subscriptions table to support multiple payment providers:
-- - LemonSqueezy (fiat payments)
-- - Cryptomus (crypto payments - primary)
-- - NOWPayments (crypto payments - backup)
-- - Stripe (existing - kept for legacy)
-- =====================================================

-- Add new columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50) DEFAULT 'stripe';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50); -- 'card', 'crypto', 'bitcoin', 'ethereum', etc.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS crypto_currency VARCHAR(20); -- For crypto payments
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS recurring_payment_id VARCHAR(255); -- For crypto recurring payments
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_payment_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS failed_payments_count INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB; -- For provider-specific data

-- Rename existing columns for clarity (preserve Stripe data)
-- Don't drop stripe_ columns, just add new generic ones above

-- Create payment_transactions table for tracking all payments
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  payment_provider VARCHAR(50) NOT NULL,
  provider_transaction_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  crypto_currency VARCHAR(20),
  crypto_amount DECIMAL(18, 8),
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_method VARCHAR(50),
  transaction_type VARCHAR(50) NOT NULL, -- 'subscription', 'one_time', 'renewal'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook_events table for debugging and audit trail
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for webhook_events (admin only)
CREATE POLICY "Admins can view webhook events"
  ON webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage webhook events"
  ON webhook_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_provider ON subscriptions(payment_provider);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_customer ON subscriptions(provider_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription ON subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON subscriptions(next_payment_at) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

-- Add constraint to ensure valid payment providers
ALTER TABLE subscriptions ADD CONSTRAINT valid_payment_provider
  CHECK (payment_provider IN ('stripe', 'lemonsqueezy', 'cryptomus', 'nowpayments'));

-- Add constraint for transaction status
ALTER TABLE payment_transactions ADD CONSTRAINT valid_transaction_status
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'));

-- Add comment for documentation
COMMENT ON TABLE payment_transactions IS 'Tracks all payment transactions across all providers';
COMMENT ON TABLE webhook_events IS 'Stores webhook events from all payment providers for debugging and audit';
COMMENT ON COLUMN subscriptions.payment_provider IS 'Payment provider: stripe, lemonsqueezy, cryptomus, nowpayments';
COMMENT ON COLUMN subscriptions.payment_method IS 'Payment method type: card, bitcoin, ethereum, usdt, etc.';
