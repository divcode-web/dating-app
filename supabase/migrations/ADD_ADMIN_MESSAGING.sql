-- ============================================
-- ADMIN MESSAGING SYSTEM
-- ============================================
-- Allows admins to send system messages to users (welcome messages, announcements, etc.)

-- Create admin_messages table
CREATE TABLE IF NOT EXISTS admin_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    message_type TEXT DEFAULT 'system', -- system, welcome, announcement, warning
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration for temporary messages
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_messages_recipient ON admin_messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_messages_admin ON admin_messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_type ON admin_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_admin_messages_read ON admin_messages(is_read, recipient_id);

-- Enable RLS
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own admin messages"
    ON admin_messages FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Users can mark their messages as read"
    ON admin_messages FOR UPDATE
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Admins can view all admin messages"
    ON admin_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can create admin messages"
    ON admin_messages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete admin messages"
    ON admin_messages FOR DELETE
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Function to send welcome message to new user
CREATE OR REPLACE FUNCTION send_welcome_message(user_id UUID)
RETURNS VOID AS $$
DECLARE
    welcome_content TEXT;
    admin_user_id UUID;
BEGIN
    -- Get a super admin to send the message
    SELECT id INTO admin_user_id
    FROM admin_users
    WHERE role = 'super_admin'
    LIMIT 1;

    -- Default welcome message
    welcome_content := 'Welcome to our dating app! 🎉

We''re excited to have you here. To get started:

1. Complete your profile with photos and bio
2. Set your preferences in Settings
3. Start swiping to find your perfect match!

If you need any help, feel free to reach out to our support team.

Happy matching! ❤️';

    -- Insert welcome message
    INSERT INTO admin_messages (
        admin_id,
        recipient_id,
        message_type,
        subject,
        content
    ) VALUES (
        admin_user_id,
        user_id,
        'welcome',
        'Welcome to DatingApp!',
        welcome_content
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send bulk message to all users
CREATE OR REPLACE FUNCTION send_bulk_message(
    admin_id_param UUID,
    subject_param TEXT,
    content_param TEXT,
    message_type_param TEXT DEFAULT 'announcement'
)
RETURNS INTEGER AS $$
DECLARE
    messages_sent INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Verify sender is admin
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = admin_id_param) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can send bulk messages';
    END IF;

    -- Send message to all active users
    FOR user_record IN
        SELECT id FROM user_profiles
        WHERE id NOT IN (
            SELECT blocked_id FROM blocked_users
            WHERE blocked_by_admin = TRUE
        )
    LOOP
        INSERT INTO admin_messages (
            admin_id,
            recipient_id,
            message_type,
            subject,
            content
        ) VALUES (
            admin_id_param,
            user_record.id,
            message_type_param,
            subject_param,
            content_param
        );

        messages_sent := messages_sent + 1;
    END LOOP;

    RETURN messages_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION mark_admin_message_read(message_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE admin_messages
    SET is_read = TRUE,
        read_at = CURRENT_TIMESTAMP
    WHERE id = message_id
    AND recipient_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_admin_messages_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM admin_messages
    WHERE recipient_id = user_id
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to send welcome message when new user profile is created
CREATE OR REPLACE FUNCTION trigger_send_welcome_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Send welcome message after a short delay (using pg_notify for async)
    PERFORM send_welcome_message(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS send_welcome_on_profile_create ON user_profiles;

CREATE TRIGGER send_welcome_on_profile_create
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_send_welcome_message();

-- Cleanup expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_admin_messages()
RETURNS VOID AS $$
BEGIN
    DELETE FROM admin_messages
    WHERE expires_at IS NOT NULL
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE admin_messages IS 'System messages sent from admins to users';
COMMENT ON FUNCTION send_welcome_message IS 'Automatically send welcome message to new users';
COMMENT ON FUNCTION send_bulk_message IS 'Send announcement to all active users';
COMMENT ON FUNCTION mark_admin_message_read IS 'Mark message as read by user';
