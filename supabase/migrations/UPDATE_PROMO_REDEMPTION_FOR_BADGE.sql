-- =====================================================
-- UPDATE PROMO REDEMPTION TO SET PREMIUM BADGE
-- Run this to fix the premium badge issue
-- =====================================================

-- Drop and recreate the redeem_promo_code function with is_premium update
DROP FUNCTION IF EXISTS redeem_promo_code(UUID, VARCHAR);

-- Handle the trigger that might already exist from previous migrations
DROP TRIGGER IF EXISTS promotional_codes_updated_at ON promotional_codes;
DROP FUNCTION IF EXISTS update_promotional_codes_updated_at();

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

  -- ✨ NEW: Update user's subscription tier, expiry, AND premium status (for badge)
  UPDATE user_profiles
  SET subscription_tier_id = v_tier_id,
      subscription_expires_at = v_expires_at,
      is_premium = TRUE,  -- THIS ENABLES THE PREMIUM BADGE! 👑
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

-- Recreate the trigger function and trigger
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
GRANT EXECUTE ON FUNCTION redeem_promo_code(UUID, VARCHAR) TO authenticated;

-- =====================================================
-- FIX EXISTING USERS WHO ALREADY REDEEMED
-- =====================================================

-- Update any users who redeemed codes before this fix
UPDATE user_profiles
SET is_premium = TRUE,
    updated_at = NOW()
WHERE
  -- Has a paid subscription tier
  subscription_tier_id IN ('basic_monthly', 'standard_3month', 'premium_yearly')
  -- Subscription hasn't expired
  AND subscription_expires_at IS NOT NULL
  AND subscription_expires_at > NOW()
  -- But premium badge is not showing
  AND (is_premium IS NULL OR is_premium = FALSE);

-- Show the users who were just updated
SELECT
  id,
  full_name,
  subscription_tier_id,
  subscription_expires_at,
  is_premium,
  'Premium badge now enabled! 👑' as status
FROM user_profiles
WHERE subscription_tier_id IN ('basic_monthly', 'standard_3month', 'premium_yearly')
  AND subscription_expires_at > NOW()
  AND is_premium = TRUE;
