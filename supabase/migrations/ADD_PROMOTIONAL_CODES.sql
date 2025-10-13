-- Add subscription_expires_at column to user_profiles if it doesn't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create promotional codes table
CREATE TABLE IF NOT EXISTS promotional_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  tier_id VARCHAR(50) REFERENCES subscription_tiers(id) NOT NULL,
  duration_days INTEGER NOT NULL, -- How many days the promo subscription lasts
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promo code redemptions tracking table
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES promotional_codes(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(user_id, promo_code_id) -- Prevent same user redeeming same code twice
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promotional_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promotional_codes(active);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_expires ON promo_redemptions(expires_at);

-- Insert 3-day promotional offers for new sign-ups
INSERT INTO promotional_codes (code, description, tier_id, duration_days, max_uses, valid_until) VALUES
(
  'WELCOME3',
  '3-Day Basic Plan Trial for New Users',
  'basic_monthly',
  3,
  NULL, -- Unlimited uses
  NOW() + INTERVAL '90 days' -- Valid for 90 days from now
),
(
  'NEWLOVE3',
  '3-Day Standard Plan Trial for New Users',
  'standard_3month',
  3,
  NULL, -- Unlimited uses
  NOW() + INTERVAL '90 days'
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  tier_id = EXCLUDED.tier_id,
  duration_days = EXCLUDED.duration_days,
  max_uses = EXCLUDED.max_uses,
  valid_until = EXCLUDED.valid_until,
  updated_at = NOW();

-- Function to validate and redeem promo code
CREATE OR REPLACE FUNCTION redeem_promo_code(
  p_user_id UUID,
  p_code VARCHAR(50)
)
RETURNS JSON AS $$
DECLARE
  v_promo_id UUID;
  v_tier_id VARCHAR(50);
  v_duration_days INTEGER;
  v_max_uses INTEGER;
  v_current_uses INTEGER;
  v_valid_from TIMESTAMP WITH TIME ZONE;
  v_valid_until TIMESTAMP WITH TIME ZONE;
  v_active BOOLEAN;
  v_already_redeemed BOOLEAN;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get promo code details
  SELECT id, tier_id, duration_days, max_uses, current_uses, valid_from, valid_until, active
  INTO v_promo_id, v_tier_id, v_duration_days, v_max_uses, v_current_uses, v_valid_from, v_valid_until, v_active
  FROM promotional_codes
  WHERE code = UPPER(p_code);

  -- Check if code exists
  IF v_promo_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Invalid promo code'
    );
  END IF;

  -- Check if code is active
  IF NOT v_active THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'This promo code is no longer active'
    );
  END IF;

  -- Check if code is within valid date range
  IF NOW() < v_valid_from OR (v_valid_until IS NOT NULL AND NOW() > v_valid_until) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'This promo code has expired'
    );
  END IF;

  -- Check if max uses reached
  IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'This promo code has reached its maximum number of uses'
    );
  END IF;

  -- Check if user already redeemed this code
  SELECT EXISTS(
    SELECT 1 FROM promo_redemptions
    WHERE user_id = p_user_id AND promo_code_id = v_promo_id
  ) INTO v_already_redeemed;

  IF v_already_redeemed THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'You have already redeemed this promo code'
    );
  END IF;

  -- Calculate expiration date
  v_expires_at := NOW() + (v_duration_days || ' days')::INTERVAL;

  -- Create redemption record
  INSERT INTO promo_redemptions (user_id, promo_code_id, expires_at)
  VALUES (p_user_id, v_promo_id, v_expires_at);

  -- Increment usage count
  UPDATE promotional_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = v_promo_id;

  -- Update user's subscription tier, expiry, and premium status
  UPDATE user_profiles
  SET subscription_tier_id = v_tier_id,
      subscription_expires_at = v_expires_at,
      is_premium = TRUE,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', TRUE,
    'tier_id', v_tier_id,
    'expires_at', v_expires_at,
    'message', 'Promo code redeemed successfully!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active promo subscription
CREATE OR REPLACE FUNCTION has_active_promo(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_active BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM promo_redemptions
    WHERE user_id = p_user_id
    AND expires_at > NOW()
  ) INTO v_has_active;

  RETURN v_has_active;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promotional_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promotional_codes_updated_at
BEFORE UPDATE ON promotional_codes
FOR EACH ROW
EXECUTE FUNCTION update_promotional_codes_updated_at();

-- Grant permissions
GRANT SELECT ON promotional_codes TO authenticated;
GRANT SELECT, INSERT ON promo_redemptions TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_promo_code(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_promo(UUID) TO authenticated;
