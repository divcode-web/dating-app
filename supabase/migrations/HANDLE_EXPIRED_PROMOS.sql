-- Migration to handle expired promotional subscriptions
-- This ensures users lose premium status when their promo expires

-- Function to check and update expired promo subscriptions
CREATE OR REPLACE FUNCTION check_expired_promos()
RETURNS void AS $$
BEGIN
  -- Update users whose promo has expired
  UPDATE user_profiles
  SET
    subscription_tier_id = 'free',
    is_premium = FALSE
  WHERE
    subscription_expires_at IS NOT NULL
    AND subscription_expires_at < NOW()
    AND is_premium = TRUE
    AND subscription_tier_id NOT IN (
      -- Exclude users with active paid subscriptions
      SELECT DISTINCT tier_id
      FROM subscriptions
      WHERE user_id = user_profiles.id
      AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run this function daily (if using pg_cron extension)
-- Note: You need to enable pg_cron extension first
-- SELECT cron.schedule('check-expired-promos', '0 0 * * *', 'SELECT check_expired_promos()');

-- Create a view that automatically checks promo expiry status
CREATE OR REPLACE VIEW user_profiles_with_valid_status AS
SELECT
  up.*,
  CASE
    WHEN up.subscription_expires_at IS NOT NULL
         AND up.subscription_expires_at < NOW()
         AND NOT EXISTS (
           SELECT 1 FROM subscriptions s
           WHERE s.user_id = up.id AND s.status = 'active'
         )
    THEN FALSE
    ELSE up.is_premium
  END AS is_premium_valid,
  CASE
    WHEN up.subscription_expires_at IS NOT NULL
         AND up.subscription_expires_at < NOW()
         AND NOT EXISTS (
           SELECT 1 FROM subscriptions s
           WHERE s.user_id = up.id AND s.status = 'active'
         )
    THEN 'free'
    ELSE up.subscription_tier_id
  END AS subscription_tier_id_valid
FROM user_profiles up;

-- Grant select on the view
GRANT SELECT ON user_profiles_with_valid_status TO authenticated;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_expired_promos() TO authenticated;

-- Run initial check for any expired promos
SELECT check_expired_promos();
