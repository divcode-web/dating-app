-- =====================================================
-- ADD SUBSCRIPTION TIERS
-- =====================================================
-- Creates 4-tier subscription system:
-- 1. Free - Limited features
-- 2. Basic ($9/month) - Core features
-- 3. Standard ($24/3 months) - Enhanced features
-- 4. Premium ($99/year) - All features
-- =====================================================

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  interval VARCHAR(20) NOT NULL, -- 'free', 'month', '3month', 'year'
  interval_count INTEGER DEFAULT 1,

  -- Feature limits
  daily_swipe_limit INTEGER, -- NULL = unlimited
  daily_message_limit INTEGER, -- NULL = unlimited
  daily_super_likes INTEGER DEFAULT 0,
  monthly_boosts INTEGER DEFAULT 0,

  -- Feature flags
  can_see_who_likes BOOLEAN DEFAULT FALSE,
  can_use_ai_matching BOOLEAN DEFAULT FALSE,
  can_rewind_swipes BOOLEAN DEFAULT FALSE,
  has_global_dating BOOLEAN DEFAULT FALSE,
  has_priority_matches BOOLEAN DEFAULT FALSE,
  has_read_receipts BOOLEAN DEFAULT FALSE,
  has_advanced_filters BOOLEAN DEFAULT FALSE,
  has_profile_boost BOOLEAN DEFAULT FALSE,
  no_ads BOOLEAN DEFAULT FALSE,
  has_priority_support BOOLEAN DEFAULT FALSE,
  can_see_online_status BOOLEAN DEFAULT FALSE,
  has_unlimited_rewinds BOOLEAN DEFAULT FALSE,

  -- Display
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert subscription tiers (with conflict handling)
INSERT INTO subscription_tiers (
  id, name, description, price, interval, interval_count,
  daily_swipe_limit, daily_message_limit, daily_super_likes, monthly_boosts,
  can_see_who_likes, can_use_ai_matching, can_rewind_swipes, has_global_dating,
  has_priority_matches, has_read_receipts, has_advanced_filters, has_profile_boost,
  no_ads, has_priority_support, can_see_online_status, has_unlimited_rewinds,
  is_popular, sort_order
) VALUES
-- Free Plan
(
  'free',
  'Free',
  'Get started with basic features',
  0.00,
  'free',
  0,
  10, -- 10 swipes per day
  11, -- 11 messages per day
  0, -- No super likes
  0, -- No boosts
  FALSE, -- Can't see who likes
  FALSE, -- No AI matching
  FALSE, -- No rewind
  FALSE, -- No global dating
  FALSE, -- No priority
  FALSE, -- No read receipts
  FALSE, -- No advanced filters
  FALSE, -- No profile boost
  FALSE, -- Has ads
  FALSE, -- No priority support
  FALSE, -- Can't see online status
  FALSE, -- No unlimited rewinds
  FALSE,
  1
),
-- Basic Monthly Plan ($9/month)
(
  'basic_monthly',
  'Basic',
  'Essential features for active daters',
  9.99,
  'month',
  1,
  50, -- 50 swipes per day
  NULL, -- Unlimited messages
  5, -- 5 super likes per day
  1, -- 1 boost per month
  FALSE, -- Can't see who likes (saved for higher tiers)
  FALSE, -- No AI matching
  TRUE, -- Can rewind swipes
  TRUE, -- Global dating
  FALSE, -- No priority matches
  TRUE, -- Read receipts
  FALSE, -- No advanced filters
  FALSE, -- No profile boost
  TRUE, -- No ads
  FALSE, -- No priority support
  TRUE, -- Can see online status
  FALSE, -- No unlimited rewinds
  TRUE, -- Popular plan
  2
),
-- Standard 3-Month Plan ($24 total, $8/month)
(
  'standard_3month',
  'Standard',
  'More features and better value',
  24.00,
  '3month',
  3,
  NULL, -- Unlimited swipes
  NULL, -- Unlimited messages
  10, -- 10 super likes per day
  3, -- 3 boosts per month
  TRUE, -- Can see who likes
  TRUE, -- AI matching
  TRUE, -- Can rewind
  TRUE, -- Global dating
  TRUE, -- Priority matches
  TRUE, -- Read receipts
  TRUE, -- Advanced filters
  TRUE, -- Profile boost
  TRUE, -- No ads
  FALSE, -- No priority support
  TRUE, -- Can see online status
  TRUE, -- Unlimited rewinds
  FALSE,
  3
),
-- Premium Yearly Plan ($99/year, $8.25/month)
(
  'premium_yearly',
  'Premium VIP',
  'Ultimate dating experience with all features',
  99.99,
  'year',
  12,
  NULL, -- Unlimited swipes
  NULL, -- Unlimited messages
  20, -- 20 super likes per day
  5, -- 5 boosts per month
  TRUE, -- Can see who likes
  TRUE, -- AI matching
  TRUE, -- Can rewind
  TRUE, -- Global dating
  TRUE, -- Priority matches
  TRUE, -- Read receipts
  TRUE, -- Advanced filters
  TRUE, -- Profile boost
  TRUE, -- No ads
  TRUE, -- Priority support
  TRUE, -- Can see online status
  TRUE, -- Unlimited rewinds
  FALSE,
  4
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  interval_count = EXCLUDED.interval_count,
  daily_swipe_limit = EXCLUDED.daily_swipe_limit,
  daily_message_limit = EXCLUDED.daily_message_limit,
  daily_super_likes = EXCLUDED.daily_super_likes,
  monthly_boosts = EXCLUDED.monthly_boosts,
  can_see_who_likes = EXCLUDED.can_see_who_likes,
  can_use_ai_matching = EXCLUDED.can_use_ai_matching,
  can_rewind_swipes = EXCLUDED.can_rewind_swipes,
  has_global_dating = EXCLUDED.has_global_dating,
  has_priority_matches = EXCLUDED.has_priority_matches,
  has_read_receipts = EXCLUDED.has_read_receipts,
  has_advanced_filters = EXCLUDED.has_advanced_filters,
  has_profile_boost = EXCLUDED.has_profile_boost,
  no_ads = EXCLUDED.no_ads,
  has_priority_support = EXCLUDED.has_priority_support,
  can_see_online_status = EXCLUDED.can_see_online_status,
  has_unlimited_rewinds = EXCLUDED.has_unlimited_rewinds,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Update subscriptions table to link to tiers
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tier_id VARCHAR(50) REFERENCES subscription_tiers(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Update user_profiles to track current tier
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_tier_id VARCHAR(50) DEFAULT 'free' REFERENCES subscription_tiers(id);

-- Create message_limits table (new table for message tracking)
CREATE TABLE IF NOT EXISTS message_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  messages_sent INTEGER DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing swipe_limits table structure
-- Add reset_at column if it doesn't exist
ALTER TABLE swipe_limits ADD COLUMN IF NOT EXISTS reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours';

-- Rename swipes_count to swipes_used if the old column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'swipe_limits' AND column_name = 'swipes_count'
  ) THEN
    ALTER TABLE swipe_limits RENAME COLUMN swipes_count TO swipes_used;
  END IF;
END $$;

-- Add swipes_used column if it doesn't exist (in case rename didn't happen)
ALTER TABLE swipe_limits ADD COLUMN IF NOT EXISTS swipes_used INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view subscription tiers (public info)
DROP POLICY IF EXISTS "Anyone can view subscription tiers" ON subscription_tiers;
CREATE POLICY "Anyone can view subscription tiers"
  ON subscription_tiers FOR SELECT
  TO public
  USING (is_active = TRUE);

-- Users can view their own message limits
DROP POLICY IF EXISTS "Users can view their own message limits" ON message_limits;
CREATE POLICY "Users can view their own message limits"
  ON message_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active ON subscription_tiers(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(subscription_tier_id);
CREATE INDEX IF NOT EXISTS idx_message_limits_user ON message_limits(user_id);

-- Create index on reset_at only if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_limits' AND column_name = 'reset_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_message_limits_reset ON message_limits(reset_at);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'swipe_limits' AND column_name = 'reset_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_swipe_limits_reset ON swipe_limits(reset_at);
  END IF;
END $$;

-- Function to check if user has feature access
CREATE OR REPLACE FUNCTION has_feature_access(
  p_user_id UUID,
  p_feature VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
  v_tier_id VARCHAR(50);
  v_has_access BOOLEAN;
BEGIN
  -- Get user's current tier
  SELECT subscription_tier_id INTO v_tier_id
  FROM user_profiles
  WHERE id = p_user_id;

  -- Default to free if no tier found
  IF v_tier_id IS NULL THEN
    v_tier_id := 'free';
  END IF;

  -- Check feature access based on tier
  CASE p_feature
    WHEN 'see_who_likes' THEN
      SELECT can_see_who_likes INTO v_has_access FROM subscription_tiers WHERE id = v_tier_id;
    WHEN 'ai_matching' THEN
      SELECT can_use_ai_matching INTO v_has_access FROM subscription_tiers WHERE id = v_tier_id;
    WHEN 'rewind' THEN
      SELECT can_rewind_swipes INTO v_has_access FROM subscription_tiers WHERE id = v_tier_id;
    WHEN 'global_dating' THEN
      SELECT has_global_dating INTO v_has_access FROM subscription_tiers WHERE id = v_tier_id;
    WHEN 'no_ads' THEN
      SELECT no_ads INTO v_has_access FROM subscription_tiers WHERE id = v_tier_id;
    WHEN 'priority_support' THEN
      SELECT has_priority_support INTO v_has_access FROM subscription_tiers WHERE id = v_tier_id;
    ELSE
      v_has_access := FALSE;
  END CASE;

  RETURN COALESCE(v_has_access, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current limits
CREATE OR REPLACE FUNCTION get_user_limits(p_user_id UUID)
RETURNS TABLE (
  daily_swipe_limit INTEGER,
  daily_message_limit INTEGER,
  daily_super_likes INTEGER,
  monthly_boosts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.daily_swipe_limit,
    st.daily_message_limit,
    st.daily_super_likes,
    st.monthly_boosts
  FROM user_profiles up
  JOIN subscription_tiers st ON up.subscription_tier_id = st.id
  WHERE up.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE subscription_tiers IS 'Defines subscription tiers and their features';
COMMENT ON TABLE message_limits IS 'Tracks daily message limits for free/basic users';
COMMENT ON FUNCTION has_feature_access IS 'Check if user has access to a specific feature based on their tier';
COMMENT ON FUNCTION get_user_limits IS 'Get user daily/monthly limits based on their subscription tier';
