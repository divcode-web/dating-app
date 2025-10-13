-- Add security features to enhance protection against brute force attacks and improve monitoring

-- Add columns to user_profiles for security tracking
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS security_events JSONB DEFAULT '[]'::jsonb;

-- Create security_events table for detailed logging
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'failed_login', 'account_locked', 'password_reset', 'suspicious_activity'
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);

-- Create banned_emails table (referenced in auth-form.tsx but doesn't exist)
CREATE TABLE IF NOT EXISTS banned_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    ban_reason TEXT,
    banned_by UUID REFERENCES user_profiles(id),
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes after table creation (separate statements)
CREATE INDEX IF NOT EXISTS idx_banned_emails_email ON banned_emails(email);

-- Function to check if email is banned (drop first to avoid return type conflict)
DROP FUNCTION IF EXISTS can_signup_with_email(TEXT);

-- Function to check if email is banned
CREATE FUNCTION can_signup_with_email(email_to_check TEXT)
RETURNS JSONB AS $$
DECLARE
    ban_record RECORD;
    result JSONB;
BEGIN
    -- Check if email is in banned list (permanent bans)
    SELECT * INTO ban_record
    FROM banned_emails
    WHERE email = LOWER(email_to_check)
    AND expires_at IS NULL;

    IF FOUND THEN
        result := jsonb_build_object(
            'can_signup', false,
            'message', 'This email has been banned from the platform.'
        );
    ELSE
        -- Check temporary bans
        SELECT * INTO ban_record
        FROM banned_emails
        WHERE email = LOWER(email_to_check)
        AND expires_at IS NOT NULL
        AND expires_at > NOW();

        IF FOUND THEN
            result := jsonb_build_object(
                'can_signup', false,
                'message', 'This email is temporarily banned from the platform.'
            );
        ELSE
            result := jsonb_build_object(
                'can_signup', true,
                'message', 'Email is allowed to signup.'
            );
        END IF;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_ip_address INET,
    p_user_agent TEXT,
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (user_id, event_type, ip_address, user_agent, details)
    VALUES (p_user_id, p_event_type, p_ip_address, p_user_agent, p_details)
    RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login(
    p_user_id UUID,
    p_ip_address INET,
    p_user_agent TEXT
)
RETURNS JSONB AS $$
DECLARE
    current_attempts INTEGER;
    lockout_duration INTERVAL := INTERVAL '15 minutes';
    new_attempts INTEGER;
    is_locked BOOLEAN := false;
BEGIN
    -- Get current failed attempts
    SELECT failed_login_attempts INTO current_attempts
    FROM user_profiles
    WHERE id = p_user_id;

    -- Increment attempts
    new_attempts := COALESCE(current_attempts, 0) + 1;

    -- Check if should lock account
    IF new_attempts >= 5 THEN
        is_locked := true;
        lockout_duration := CASE
            WHEN new_attempts >= 20 THEN INTERVAL '1 hour'
            WHEN new_attempts >= 10 THEN INTERVAL '30 minutes'
            ELSE INTERVAL '15 minutes'
        END;
    END IF;

    -- Update user profile
    UPDATE user_profiles
    SET
        failed_login_attempts = new_attempts,
        last_failed_login = NOW(),
        locked_until = CASE WHEN is_locked THEN NOW() + lockout_duration ELSE locked_until END
    WHERE id = p_user_id;

    -- Log the event
    PERFORM log_security_event(
        p_user_id,
        CASE WHEN is_locked THEN 'account_locked' ELSE 'failed_login' END,
        p_ip_address,
        p_user_agent,
        jsonb_build_object(
            'attempts', new_attempts,
            'locked', is_locked,
            'lockout_duration_minutes', EXTRACT(EPOCH FROM lockout_duration)/60
        )
    );

    RETURN jsonb_build_object(
        'attempts', new_attempts,
        'locked', is_locked,
        'locked_until', CASE WHEN is_locked THEN NOW() + lockout_duration ELSE NULL END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset failed attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_logins(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles
    SET
        failed_login_attempts = 0,
        locked_until = NULL,
        last_failed_login = NULL
    WHERE id = p_user_id;

    -- Log successful login
    PERFORM log_security_event(
        p_user_id,
        'successful_login',
        NULL,
        NULL,
        jsonb_build_object('message', 'User successfully logged in')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    locked_until_val TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT locked_until INTO locked_until_val
    FROM user_profiles
    WHERE id = p_user_id;

    RETURN locked_until_val IS NOT NULL AND locked_until_val > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;