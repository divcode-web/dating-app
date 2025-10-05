-- ============================================
-- COMPLETE DATABASE RESET AND SETUP
-- ============================================
-- WARNING: This will DELETE ALL existing data!
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- ============================================

-- Drop all tables first (CASCADE will automatically drop triggers)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TABLE IF EXISTS message_limits CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS swipes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_mutual_like() CASCADE;
DROP FUNCTION IF EXISTS get_nearby_profiles(FLOAT, FLOAT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_last_active() CASCADE;
DROP FUNCTION IF EXISTS check_message_limit() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_messages() CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS report_type CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS swipe_direction CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS gender_type CASCADE;

-- ============================================
-- STEP 2: ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PostGIS extension (optional, for location features)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not available, location features will be limited';
END
$$;

-- ============================================
-- STEP 3: CREATE TABLES
-- ============================================

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Required fields
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    bio TEXT,
    photos TEXT[],

    -- Optional profile fields
    ethnicity TEXT,
    height INTEGER, -- in cm
    education TEXT,
    occupation TEXT,
    smoking TEXT, -- never, occasionally, regularly
    drinking TEXT, -- never, occasionally, regularly
    religion TEXT,
    relationship_type TEXT, -- casual, serious, friendship, not_sure
    looking_for TEXT[], -- friendship, relationship, casual, etc
    languages TEXT[],
    children TEXT, -- have_children, want_children, dont_want, open

    -- Location (optional, requires PostGIS)
    location GEOMETRY(POINT, 4326),
    location_city TEXT,
    interests TEXT[],

    -- Status fields
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_until TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status TEXT DEFAULT 'unverified', -- unverified, pending, verified, rejected
    verification_video_url TEXT,
    verification_submitted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Settings Table
CREATE TABLE user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    profile_visibility BOOLEAN DEFAULT TRUE,
    distance_range INTEGER DEFAULT 50,
    age_range INTEGER[] DEFAULT '{18,50}',
    dark_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Likes Table
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_super_like BOOLEAN DEFAULT FALSE,
    UNIQUE(from_user_id, to_user_id)
);

-- Matches Table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id_1, user_id_2)
);

-- Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Subscriptions Table (Three-tier premium system)
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium', 'platinum');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    plan subscription_plan DEFAULT 'free',
    status subscription_status DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message Limits Table (Track daily message usage for free users)
CREATE TABLE message_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    message_count INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- Admin Users Table (Create FIRST before blocked_users and reports)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin', -- admin, super_admin
    permissions TEXT[], -- array of permission strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Blocked Users Table
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    blocked_by_admin BOOLEAN DEFAULT FALSE,
    reason TEXT,
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_id)
);

-- Reports Table
CREATE TYPE report_type AS ENUM ('user', 'message', 'inappropriate_content', 'harassment', 'spam', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    reported_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    report_type report_type NOT NULL,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 4: CREATE INDEXES
-- ============================================

CREATE INDEX idx_user_profiles_location ON user_profiles USING GIST(location) WHERE location IS NOT NULL;
CREATE INDEX idx_user_profiles_last_active ON user_profiles(last_active);
CREATE INDEX idx_user_profiles_is_premium ON user_profiles(is_premium);
CREATE INDEX idx_user_profiles_is_verified ON user_profiles(is_verified);
CREATE INDEX idx_user_profiles_verification_status ON user_profiles(verification_status);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_ethnicity ON user_profiles(ethnicity);
CREATE INDEX idx_user_profiles_relationship_type ON user_profiles(relationship_type);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

CREATE INDEX idx_likes_from_user ON likes(from_user_id);
CREATE INDEX idx_likes_to_user ON likes(to_user_id);
CREATE INDEX idx_likes_created_at ON likes(created_at);

CREATE INDEX idx_matches_user1 ON matches(user_id_1);
CREATE INDEX idx_matches_user2 ON matches(user_id_2);
CREATE INDEX idx_matches_created_at ON matches(created_at);
CREATE INDEX idx_matches_matched_at ON matches(matched_at);

CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_message_limits_user_date ON message_limits(user_id, date);

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reviewed_by ON reports(reviewed_by);

CREATE INDEX idx_admin_users_role ON admin_users(role);

-- ============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are viewable by authenticated users"
    ON user_profiles FOR SELECT
    USING (auth.role() = 'authenticated');

-- User Settings Policies
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Likes Policies
CREATE POLICY "Users can view likes they've given or received"
    ON likes FOR SELECT
    USING (auth.uid() IN (from_user_id, to_user_id));

CREATE POLICY "Users can insert their own likes"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

-- Matches Policies
CREATE POLICY "Users can view their own matches"
    ON matches FOR SELECT
    USING (auth.uid() IN (user_id_1, user_id_2));

CREATE POLICY "Users can insert matches"
    ON matches FOR INSERT
    WITH CHECK (auth.uid() IN (user_id_1, user_id_2));

-- Messages Policies
CREATE POLICY "Users can view messages in their matches"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matches
            WHERE matches.id = messages.match_id
            AND (matches.user_id_1 = auth.uid() OR matches.user_id_2 = auth.uid())
        )
    );

CREATE POLICY "Users can insert their own messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM matches
            WHERE matches.id = messages.match_id
            AND (matches.user_id_1 = auth.uid() OR matches.user_id_2 = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id);

-- Subscriptions Policies
CREATE POLICY "Users can view their own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Message Limits Policies
CREATE POLICY "Users can view their own message limits"
    ON message_limits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message limits"
    ON message_limits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message limits"
    ON message_limits FOR UPDATE
    USING (auth.uid() = user_id);

-- Blocked Users Policies
CREATE POLICY "Users can view their blocks"
    ON blocked_users FOR SELECT
    USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
    ON blocked_users FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others"
    ON blocked_users FOR DELETE
    USING (auth.uid() = blocker_id);

-- Reports Policies
CREATE POLICY "Users can view their own reports"
    ON reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
    ON reports FOR SELECT
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update reports"
    ON reports FOR UPDATE
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Admin Users Policies
-- Allow users to read their own admin record (prevents infinite recursion)
CREATE POLICY "Users can view own admin record"
    ON admin_users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Super admins can manage admins"
    ON admin_users FOR ALL
    USING (auth.uid() = id AND role = 'super_admin');

-- ============================================
-- STEP 7: CREATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles
    SET last_active = CURRENT_TIMESTAMP
    WHERE id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check message limit for free users
CREATE OR REPLACE FUNCTION check_message_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_plan subscription_plan;
    today_count INTEGER;
    daily_limit INTEGER := 50; -- Free users: 50 messages per day
BEGIN
    -- Get user's subscription plan
    SELECT COALESCE(s.plan, 'free') INTO user_plan
    FROM subscriptions s
    WHERE s.user_id = NEW.sender_id
    LIMIT 1;

    -- If user doesn't have a subscription record, treat as free
    IF user_plan IS NULL THEN
        user_plan := 'free';
    END IF;

    -- Only check limits for free users
    IF user_plan = 'free' THEN
        -- Get today's message count
        SELECT COALESCE(message_count, 0) INTO today_count
        FROM message_limits
        WHERE user_id = NEW.sender_id AND date = CURRENT_DATE;

        -- Check if limit exceeded
        IF today_count >= daily_limit THEN
            RAISE EXCEPTION 'Daily message limit reached. Upgrade to premium for unlimited messages.';
        END IF;

        -- Increment message count
        INSERT INTO message_limits (user_id, date, message_count)
        VALUES (NEW.sender_id, CURRENT_DATE, 1)
        ON CONFLICT (user_id, date)
        DO UPDATE SET message_count = message_limits.message_count + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old messages based on subscription tier
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
    -- Delete messages older than 3 weeks (21 days) for free users
    DELETE FROM messages m
    WHERE m.sent_at < NOW() - INTERVAL '21 days'
    AND EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = m.sender_id
        AND s.plan = 'free'
    );

    -- Delete messages older than 60 days for premium users (basic, premium, platinum)
    DELETE FROM messages m
    WHERE m.sent_at < NOW() - INTERVAL '60 days'
    AND EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = m.sender_id
        AND s.plan IN ('basic', 'premium', 'platinum')
    );

    -- Also delete messages for users without subscription (treat as free)
    DELETE FROM messages m
    WHERE m.sent_at < NOW() - INTERVAL '21 days'
    AND NOT EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = m.sender_id
    );

    RAISE NOTICE 'Message cleanup completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    total_fields INTEGER := 20; -- Total number of profile fields
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record FROM user_profiles WHERE id = user_uuid;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Required fields (already have them if profile exists)
    IF profile_record.full_name IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.date_of_birth IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.gender IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.bio IS NOT NULL AND LENGTH(profile_record.bio) > 20 THEN completion_score := completion_score + 1; END IF;
    IF profile_record.photos IS NOT NULL AND array_length(profile_record.photos, 1) >= 3 THEN completion_score := completion_score + 2; END IF;

    -- Optional fields
    IF profile_record.ethnicity IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.height IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.education IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.occupation IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.smoking IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.drinking IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.religion IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.relationship_type IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.looking_for IS NOT NULL AND array_length(profile_record.looking_for, 1) > 0 THEN completion_score := completion_score + 1; END IF;
    IF profile_record.languages IS NOT NULL AND array_length(profile_record.languages, 1) > 0 THEN completion_score := completion_score + 1; END IF;
    IF profile_record.children IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.location_city IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.interests IS NOT NULL AND array_length(profile_record.interests, 1) >= 3 THEN completion_score := completion_score + 1; END IF;
    IF profile_record.is_verified = TRUE THEN completion_score := completion_score + 2; END IF; -- Bonus for verification

    RETURN ROUND((completion_score::FLOAT / total_fields) * 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 8: CREATE TRIGGERS
-- ============================================

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER check_message_limit_trigger
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION check_message_limit();

-- ============================================
-- DATABASE SETUP COMPLETE!
-- ============================================
--
-- ✅ ALL DONE! Next steps:
--
-- 1. CREATE STORAGE BUCKET (Manual Step)
-- ========================================
-- Go to Supabase Dashboard > Storage:
-- - Click "Create a new bucket"
-- - Name: profile-photos
-- - Make it PUBLIC ✓
-- - Click "Create"
--
-- 2. RUN MESSAGE CLEANUP (Optional)
-- ===================================
-- To cleanup old messages based on subscription tiers:
-- SELECT cleanup_old_messages();
--
-- Set up a weekly cron job to run this automatically.
--
-- 3. SUBSCRIPTION TIERS
-- =======================
-- Free: 50 messages/day, messages deleted after 21 days
-- Basic: Unlimited messages, messages deleted after 60 days
-- Premium: Unlimited messages, messages deleted after 60 days
-- Platinum: Unlimited messages, messages deleted after 60 days
--
-- That's it! Everything is ready.
-- ============================================
