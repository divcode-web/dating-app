-- =====================================================
-- ADD PROFILE BOOST FEATURE
-- =====================================================

-- Create profile_boosts table to track active boosts
CREATE TABLE IF NOT EXISTS profile_boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    boost_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'premium', 'super'
    duration_hours INTEGER DEFAULT 24,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    is_active BOOLEAN DEFAULT TRUE,
    boost_multiplier DECIMAL(3,2) DEFAULT 2.0, -- How much more visibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure only one active boost per user
    UNIQUE(user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create boost_usage table to track monthly boost usage
CREATE TABLE IF NOT EXISTS boost_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    boost_type VARCHAR(50) DEFAULT 'standard',
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    month_year VARCHAR(7), -- Format: '2024-01'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Index for efficient monthly counting
    UNIQUE(user_id, month_year, boost_type, used_at)
);

-- Enable RLS
ALTER TABLE profile_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own boosts"
    ON profile_boosts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own boosts"
    ON profile_boosts FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own boosts"
    ON profile_boosts FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own boost usage"
    ON boost_usage FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own boost usage"
    ON boost_usage FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Function to activate profile boost
CREATE OR REPLACE FUNCTION activate_profile_boost(
    p_user_id UUID,
    p_boost_type VARCHAR(50) DEFAULT 'standard',
    p_duration_hours INTEGER DEFAULT 24
) RETURNS BOOLEAN AS $$
DECLARE
    v_monthly_limit INTEGER;
    v_used_this_month INTEGER;
    v_boost_multiplier DECIMAL(3,2);
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user's monthly boost limit
    SELECT monthly_boosts INTO v_monthly_limit
    FROM subscription_tiers st
    JOIN user_profiles up ON up.subscription_tier_id = st.id
    WHERE up.id = p_user_id;

    -- Count boosts used this month
    SELECT COUNT(*) INTO v_used_this_month
    FROM boost_usage
    WHERE user_id = p_user_id
      AND month_year = TO_CHAR(NOW(), 'YYYY-MM');

    -- Check if user has boosts remaining
    IF v_used_this_month >= COALESCE(v_monthly_limit, 0) THEN
        RETURN FALSE;
    END IF;

    -- Set boost multiplier based on type
    CASE p_boost_type
        WHEN 'standard' THEN v_boost_multiplier := 2.0;
        WHEN 'premium' THEN v_boost_multiplier := 3.0;
        WHEN 'super' THEN v_boost_multiplier := 5.0;
        ELSE v_boost_multiplier := 2.0;
    END CASE;

    -- Calculate expiration
    v_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;

    -- Deactivate any existing boosts
    UPDATE profile_boosts
    SET is_active = FALSE
    WHERE user_id = p_user_id AND is_active = TRUE;

    -- Insert new boost
    INSERT INTO profile_boosts (
        user_id, boost_type, duration_hours, expires_at, boost_multiplier
    ) VALUES (
        p_user_id, p_boost_type, p_duration_hours, v_expires_at, v_boost_multiplier
    );

    -- Record boost usage
    INSERT INTO boost_usage (user_id, boost_type, month_year)
    VALUES (p_user_id, p_boost_type, TO_CHAR(NOW(), 'YYYY-MM'));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active boost for user
CREATE OR REPLACE FUNCTION get_active_boost(p_user_id UUID)
RETURNS TABLE (
    boost_type VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE,
    boost_multiplier DECIMAL(3,2),
    time_remaining INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pb.boost_type,
        pb.expires_at,
        pb.boost_multiplier,
        pb.expires_at - NOW() as time_remaining
    FROM profile_boosts pb
    WHERE pb.user_id = p_user_id
      AND pb.is_active = TRUE
      AND pb.expires_at > NOW()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining boosts this month
CREATE OR REPLACE FUNCTION get_remaining_boosts(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_monthly_limit INTEGER;
    v_used_this_month INTEGER;
BEGIN
    -- Get user's monthly boost limit
    SELECT monthly_boosts INTO v_monthly_limit
    FROM subscription_tiers st
    JOIN user_profiles up ON up.subscription_tier_id = st.id
    WHERE up.id = p_user_id;

    -- Count boosts used this month
    SELECT COUNT(*) INTO v_used_this_month
    FROM boost_usage
    WHERE user_id = p_user_id
      AND month_year = TO_CHAR(NOW(), 'YYYY-MM');

    RETURN GREATEST(0, COALESCE(v_monthly_limit, 0) - v_used_this_month);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired boosts
CREATE OR REPLACE FUNCTION cleanup_expired_boosts()
RETURNS void AS $$
BEGIN
    UPDATE profile_boosts
    SET is_active = FALSE
    WHERE is_active = TRUE AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job (runs hourly)
SELECT cron.schedule(
    'cleanup-expired-boosts',
    '0 * * * *',  -- Every hour
    'SELECT cleanup_expired_boosts();'
);

-- Add updated_at triggers
CREATE TRIGGER update_profile_boosts_updated_at
    BEFORE UPDATE ON profile_boosts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_boosts_user_active ON profile_boosts(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_profile_boosts_expires_at ON profile_boosts(expires_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_boost_usage_user_month ON boost_usage(user_id, month_year);

-- Grant permissions
GRANT EXECUTE ON FUNCTION activate_profile_boost(UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_boost(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_remaining_boosts(UUID) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables exist
SELECT
    'profile_boosts table' as check_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profile_boosts') as exists
UNION ALL
SELECT
    'boost_usage table' as check_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'boost_usage') as exists;

-- Check if functions exist
SELECT
    'activate_profile_boost function' as check_name,
    EXISTS (SELECT FROM pg_proc WHERE proname = 'activate_profile_boost') as exists
UNION ALL
SELECT
    'get_active_boost function' as check_name,
    EXISTS (SELECT FROM pg_proc WHERE proname = 'get_active_boost') as exists
UNION ALL
SELECT
    'get_remaining_boosts function' as check_name,
    EXISTS (SELECT FROM pg_proc WHERE proname = 'get_remaining_boosts') as exists;