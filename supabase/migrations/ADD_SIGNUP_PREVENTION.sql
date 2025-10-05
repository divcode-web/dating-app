-- ============================================
-- PREVENT DUPLICATE SIGNUPS
-- ============================================
-- Ensures users can't create multiple accounts with same email
-- Allows re-signup only if account was deleted (not banned)

-- Create a function to check if email can be used for signup
CREATE OR REPLACE FUNCTION can_signup_with_email(email_to_check TEXT)
RETURNS JSON AS $$
DECLARE
    existing_user RECORD;
    existing_profile RECORD;
    is_banned BOOLEAN;
BEGIN
    -- Check if user exists in auth.users
    SELECT * INTO existing_user
    FROM auth.users
    WHERE email = email_to_check
    LIMIT 1;

    -- If no user exists, signup is allowed
    IF existing_user IS NULL THEN
        RETURN json_build_object(
            'can_signup', TRUE,
            'reason', 'email_available'
        );
    END IF;

    -- Check if user profile exists and is banned
    SELECT * INTO existing_profile
    FROM user_profiles
    WHERE id = existing_user.id;

    -- Check if user is in blocked_users (banned by admin)
    SELECT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE blocked_id = existing_user.id
        AND blocked_by_admin = TRUE
    ) INTO is_banned;

    -- If user is banned, prevent signup
    IF is_banned THEN
        RETURN json_build_object(
            'can_signup', FALSE,
            'reason', 'account_banned',
            'message', 'This email is associated with a banned account. Please contact support.'
        );
    END IF;

    -- If user exists but profile was deleted (soft delete scenario)
    IF existing_profile IS NULL THEN
        RETURN json_build_object(
            'can_signup', TRUE,
            'reason', 'account_deleted',
            'message', 'Previous account was deleted. You can create a new account.'
        );
    END IF;

    -- If user exists and has active profile, prevent signup
    RETURN json_build_object(
        'can_signup', FALSE,
        'reason', 'account_exists',
        'message', 'An account with this email already exists. Please sign in instead.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to prevent duplicate auth.users creation
-- This runs BEFORE insert on auth.users to validate email
CREATE OR REPLACE FUNCTION validate_signup_email()
RETURNS TRIGGER AS $$
DECLARE
    signup_check JSON;
BEGIN
    -- Check if email can be used for signup
    signup_check := can_signup_with_email(NEW.email);

    -- If signup is not allowed, raise exception
    IF (signup_check->>'can_signup')::BOOLEAN = FALSE THEN
        RAISE EXCEPTION '%', signup_check->>'message'
            USING ERRCODE = 'unique_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_signup_before_insert ON auth.users;

-- Create trigger on auth.users (requires superuser privileges)
-- Note: This may not work on Supabase hosted - use client-side check instead
-- CREATE TRIGGER validate_signup_before_insert
--   BEFORE INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION validate_signup_email();

-- Create a table to track signup attempts for rate limiting
CREATE TABLE IF NOT EXISTS signup_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    ip_address TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_signup_attempts_email ON signup_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip ON signup_attempts(ip_address, attempted_at DESC);

-- Function to check signup rate limit (prevent spam)
CREATE OR REPLACE FUNCTION check_signup_rate_limit(
    email_to_check TEXT,
    ip_to_check TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    recent_attempts INTEGER;
    recent_ip_attempts INTEGER;
BEGIN
    -- Check email-based attempts (last 24 hours)
    SELECT COUNT(*) INTO recent_attempts
    FROM signup_attempts
    WHERE email = email_to_check
    AND attempted_at > NOW() - INTERVAL '24 hours';

    -- If more than 3 attempts in 24 hours, rate limit
    IF recent_attempts >= 3 THEN
        RETURN json_build_object(
            'allowed', FALSE,
            'reason', 'rate_limit_email',
            'message', 'Too many signup attempts. Please try again later.'
        );
    END IF;

    -- Check IP-based attempts if provided (last 1 hour)
    IF ip_to_check IS NOT NULL THEN
        SELECT COUNT(*) INTO recent_ip_attempts
        FROM signup_attempts
        WHERE ip_address = ip_to_check
        AND attempted_at > NOW() - INTERVAL '1 hour';

        -- If more than 5 attempts from same IP in 1 hour, rate limit
        IF recent_ip_attempts >= 5 THEN
            RETURN json_build_object(
                'allowed', FALSE,
                'reason', 'rate_limit_ip',
                'message', 'Too many signup attempts from this location. Please try again later.'
            );
        END IF;
    END IF;

    RETURN json_build_object(
        'allowed', TRUE,
        'reason', 'ok'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log signup attempt
CREATE OR REPLACE FUNCTION log_signup_attempt(
    email_param TEXT,
    ip_param TEXT DEFAULT NULL,
    success_param BOOLEAN DEFAULT FALSE,
    reason_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO signup_attempts (email, ip_address, success, failure_reason)
    VALUES (email_param, ip_param, success_param, reason_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old signup attempts (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_signup_attempts()
RETURNS VOID AS $$
BEGIN
    DELETE FROM signup_attempts
    WHERE attempted_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_signup_with_email(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_signup_rate_limit(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_signup_attempt(TEXT, TEXT, BOOLEAN, TEXT) TO authenticated, anon;

COMMENT ON FUNCTION can_signup_with_email IS 'Check if email can be used for signup (not banned, not already registered)';
COMMENT ON FUNCTION check_signup_rate_limit IS 'Prevent signup spam by rate limiting attempts';
COMMENT ON FUNCTION log_signup_attempt IS 'Log signup attempt for tracking and rate limiting';
