-- =====================================================
-- SAFE MIGRATION - Only add what's missing
-- =====================================================

-- =====================================================
-- SAFE MIGRATION - Only add what's missing
-- =====================================================

-- Create function if it doesn't exist (simple approach)
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    profile_data RECORD;
BEGIN
    -- Get user profile data
    SELECT * INTO profile_data
    FROM user_profiles
    WHERE id = user_uuid;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Basic Information (20 points)
    IF profile_data.full_name IS NOT NULL AND profile_data.full_name != ''
       AND profile_data.date_of_birth IS NOT NULL
       AND profile_data.gender IS NOT NULL AND profile_data.gender != '' THEN
        completion_score := completion_score + 20;
    END IF;

    -- Bio (20 points)
    IF profile_data.bio IS NOT NULL AND profile_data.bio != '' THEN
        completion_score := completion_score + 20;
    END IF;

    -- Photos (20 points)
    IF profile_data.photos IS NOT NULL AND array_length(profile_data.photos, 1) > 0 THEN
        completion_score := completion_score + 20;
    END IF;

    -- Interests (20 points)
    IF profile_data.interests IS NOT NULL AND array_length(profile_data.interests, 1) > 0 THEN
        completion_score := completion_score + 20;
    END IF;

    -- Face Verification (20 points)
    IF profile_data.is_verified = TRUE THEN
        completion_score := completion_score + 20;
    END IF;

    RETURN completion_score;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_profile_completion(UUID) TO authenticated;

-- Only create message_limits table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'message_limits') THEN
        CREATE TABLE message_limits (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
            messages_sent INTEGER DEFAULT 0,
            reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE message_limits ENABLE ROW LEVEL SECURITY;

        -- Create policies (these will only run if table was just created)
        CREATE POLICY "Users can view their own message limits"
            ON message_limits FOR SELECT
            USING (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can insert their own message limits"
            ON message_limits FOR INSERT
            WITH CHECK (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can update their own message limits"
            ON message_limits FOR UPDATE
            USING (auth.uid()::text = user_id::text)
            WITH CHECK (auth.uid()::text = user_id::text);

        -- Create indexes
        CREATE INDEX idx_message_limits_user ON message_limits(user_id);
        CREATE INDEX idx_message_limits_reset ON message_limits(reset_at);
    END IF;
END $$;

-- =====================================================
-- PRIVACY SETTINGS - COMMENTED OUT (Not needed currently)
-- =====================================================

-- Privacy Settings Table - Commented out until needed
-- CREATE TABLE IF NOT EXISTS user_privacy_settings (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
--     hide_work_education BOOLEAN DEFAULT FALSE,
--     hide_lifestyle BOOLEAN DEFAULT FALSE,
--     hide_interests BOOLEAN DEFAULT FALSE,
--     hide_languages BOOLEAN DEFAULT FALSE,
--     hide_spotify BOOLEAN DEFAULT FALSE,
--     hide_books BOOLEAN DEFAULT FALSE,
--     hide_location BOOLEAN DEFAULT FALSE,
--     hide_age BOOLEAN DEFAULT FALSE,
--     hide_photos BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Enable RLS - Commented out until needed
-- ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Commented out until needed
-- CREATE POLICY "Users can view own privacy settings"
--     ON user_privacy_settings FOR SELECT
--     USING (user_id = auth.uid());

-- CREATE POLICY "Users can update own privacy settings"
--     ON user_privacy_settings FOR UPDATE
--     USING (user_id = auth.uid());

-- CREATE POLICY "Users can insert own privacy settings"
--     ON user_privacy_settings FOR INSERT
--     WITH CHECK (user_id = auth.uid());

-- Function: Auto-create privacy settings for new users - Commented out until needed
-- CREATE OR REPLACE FUNCTION public.handle_new_user_privacy()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     INSERT INTO public.user_privacy_settings (user_id)
--     VALUES (NEW.id);
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create privacy settings on user signup - Commented out until needed
-- DROP TRIGGER IF EXISTS on_auth_user_created_privacy ON auth.users;
-- CREATE TRIGGER on_auth_user_created_privacy
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_privacy();

-- Add updated_at trigger for privacy settings - Commented out until needed
-- CREATE TRIGGER update_user_privacy_settings_updated_at
--     BEFORE UPDATE ON user_privacy_settings
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PRIVACY VIEW - COMMENTED OUT (Not needed currently)
-- =====================================================

-- Create a view that respects privacy settings - Commented out until needed
-- CREATE OR REPLACE VIEW user_profiles_with_privacy AS
-- SELECT
--     p.*,
--     COALESCE(pr.hide_work_education, FALSE) as hide_work_education,
--     COALESCE(pr.hide_lifestyle, FALSE) as hide_lifestyle,
--     COALESCE(pr.hide_interests, FALSE) as hide_interests,
--     COALESCE(pr.hide_languages, FALSE) as hide_languages,
--     COALESCE(pr.hide_spotify, FALSE) as hide_spotify,
--     COALESCE(pr.hide_books, FALSE) as hide_books,
--     COALESCE(pr.hide_location, FALSE) as hide_location,
--     COALESCE(pr.hide_age, FALSE) as hide_age,
--     COALESCE(pr.hide_photos, FALSE) as hide_photos
-- FROM user_profiles p
-- LEFT JOIN user_privacy_settings pr ON p.id = pr.user_id;

-- Enable RLS on the view - Commented out until needed
-- ALTER VIEW user_profiles_with_privacy SET (security_barrier = true);

-- Policy for the view - Commented out until needed
-- CREATE POLICY "Users can view profiles respecting privacy"
--     ON user_profiles_with_privacy FOR SELECT
--     USING (
--         -- Users can always view their own profile
--         id = auth.uid()
--         OR
--         -- For other profiles, they must not be deleted and respect privacy settings
--         (is_deleted = FALSE AND (
--             -- Show basic info always (name, bio, etc.)
--             TRUE
--         ))
--     );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if function exists
SELECT
    'calculate_profile_completion function' as check_name,
    EXISTS (SELECT FROM pg_proc WHERE proname = 'calculate_profile_completion') as exists;

-- Check if privacy settings table exists (commented out - not needed)
-- SELECT
--     'user_privacy_settings table' as table_name,
--     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_privacy_settings') as exists;

-- Check if privacy view exists (commented out - not needed)
-- SELECT
--     'user_profiles_with_privacy view' as view_name,
--     EXISTS (SELECT FROM information_schema.views WHERE view_name = 'user_profiles_with_privacy') as exists;