-- Fix existing users who redeemed promo codes but don't have is_premium set
-- Run this ONCE after updating the redeem_promo_code function

-- Update users with active promotional subscriptions to show premium badge
UPDATE user_profiles
SET is_premium = TRUE,
    updated_at = NOW()
WHERE
  -- Has a non-free subscription tier
  subscription_tier_id IN ('basic_monthly', 'standard_3month', 'premium_yearly')
  -- Subscription hasn't expired yet
  AND subscription_expires_at > NOW()
  -- But is_premium is not set
  AND (is_premium IS NULL OR is_premium = FALSE)
  -- And they don't have an active paid subscription (this is a promo user)
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = user_profiles.id
    AND status = 'active'
  );

-- Show affected users
SELECT
  id,
  full_name,
  subscription_tier_id,
  subscription_expires_at,
  is_premium,
  updated_at
FROM user_profiles
WHERE subscription_tier_id IN ('basic_monthly', 'standard_3month', 'premium_yearly')
  AND subscription_expires_at > NOW()
ORDER BY updated_at DESC;
