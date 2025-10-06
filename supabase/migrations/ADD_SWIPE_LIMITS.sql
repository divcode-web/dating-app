-- ============================================
-- SWIPE LIMITS FOR FREE USERS
-- ============================================
-- Track swipe limits and reset timers for non-premium users

-- Create swipe_limits table
CREATE TABLE IF NOT EXISTS swipe_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    swipes_used INTEGER DEFAULT 0,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to increment swipe count
CREATE OR REPLACE FUNCTION increment_swipe_count(user_id_param UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO swipe_limits (user_id, swipes_used, reset_at)
    VALUES (
        user_id_param,
        1,
        CURRENT_TIMESTAMP + INTERVAL '24 hours'
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        swipes_used = swipe_limits.swipes_used + 1,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE swipe_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swipe limits"
    ON swipe_limits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swipe limits"
    ON swipe_limits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own swipe limits"
    ON swipe_limits FOR UPDATE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_swipe_limits_user_id ON swipe_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_limits_reset_at ON swipe_limits(reset_at);

COMMENT ON TABLE swipe_limits IS 'Tracks daily swipe limits for free users (10 swipes per 24 hours)';
