-- =====================================================
-- COMPLETE DATABASE SETUP - Dating App
-- =====================================================
-- This file contains ALL database migrations in the correct order
-- Run this once to set up the entire database from scratch
-- =====================================================

-- =====================================================
-- SECTION 1: EXTENSIONS & PREREQUISITES
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- SECTION 2: CORE TABLES
-- =====================================================

-- User Profiles Table (if not exists from auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(50),
  bio TEXT,
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  photos TEXT[],
  interests TEXT[],
  looking_for VARCHAR(50),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50) DEFAULT 'unverified',
  verification_photos TEXT[],
  verification_submitted_at TIMESTAMP WITH TIME ZONE,
  verification_reviewed_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  show_me_gender TEXT[],
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 100,
  distance_range INTEGER DEFAULT 50,
  email_notifications BOOLEAN DEFAULT TRUE,
  notify_on_match BOOLEAN DEFAULT TRUE,
  notify_on_like BOOLEAN DEFAULT TRUE,
  notify_on_message BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes Table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_super_like BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_id_2 UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50),
  plan_id VARCHAR(100),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account Deletions Tracking Table
CREATE TABLE IF NOT EXISTS account_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  deletion_reason TEXT NOT NULL,
  deletion_category VARCHAR(50),
  feedback TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image VARCHAR(500),
  author_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  tags TEXT[],
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swipe Limits Table
CREATE TABLE IF NOT EXISTS swipe_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  swipes_count INTEGER DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 3: INDEXES FOR PERFORMANCE
-- =====================================================

-- User Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON user_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_deleted ON user_profiles(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location_city, location_country);

-- User Settings Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_notifications ON user_settings(user_id, email_notifications);

-- Likes Indexes
CREATE INDEX IF NOT EXISTS idx_likes_from_user ON likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- Matches Indexes
CREATE INDEX IF NOT EXISTS idx_matches_user_1 ON matches(user_id_1);
CREATE INDEX IF NOT EXISTS idx_matches_user_2 ON matches(user_id_2);
CREATE INDEX IF NOT EXISTS idx_matches_active ON matches(is_active) WHERE is_active = TRUE;

-- Messages Indexes
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = FALSE;

-- Account Deletions Indexes
CREATE INDEX IF NOT EXISTS idx_account_deletions_deleted_at ON account_deletions(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_deletions_category ON account_deletions(deletion_category);

-- Blog Posts Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- Swipe Limits Indexes
CREATE INDEX IF NOT EXISTS idx_swipe_limits_user_id ON swipe_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_limits_last_reset ON swipe_limits(last_reset);

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_limits ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view non-deleted profiles"
  ON user_profiles FOR SELECT
  USING (is_deleted = FALSE OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- User Settings Policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Likes Policies
CREATE POLICY "Users can view likes they sent"
  ON likes FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create likes"
  ON likes FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (from_user_id = auth.uid());

-- Matches Policies
CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- Messages Policies
CREATE POLICY "Users can view messages in their matches"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages in their matches"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- Account Deletions Policies
CREATE POLICY "Admins can view all account deletions"
  ON account_deletions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Users can insert their own deletion record"
  ON account_deletions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Blog Posts Policies
CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all blog posts"
  ON blog_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Swipe Limits Policies
CREATE POLICY "Users can view own swipe limits"
  ON swipe_limits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own swipe limits"
  ON swipe_limits FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own swipe limits"
  ON swipe_limits FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SECTION 5: STORAGE POLICIES
-- =====================================================

-- Profile Photos Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Anyone can view photos
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

-- Storage Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');

-- Storage Policy: Users can update their own photos
CREATE POLICY "Users can update own profile photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policy: Users can delete their own photos
CREATE POLICY "Users can delete own profile photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- SECTION 6: FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE(
  deleted_likes INTEGER,
  deleted_messages INTEGER,
  deleted_inactive_matches INTEGER
) AS $$
DECLARE
  v_deleted_likes INTEGER;
  v_deleted_messages INTEGER;
  v_deleted_inactive_matches INTEGER;
BEGIN
  -- Delete likes older than 90 days where no match occurred
  DELETE FROM likes
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.user_id_1 = likes.from_user_id AND m.user_id_2 = likes.to_user_id)
         OR (m.user_id_1 = likes.to_user_id AND m.user_id_2 = likes.from_user_id)
    );
  GET DIAGNOSTICS v_deleted_likes = ROW_COUNT;

  -- Delete messages older than 1 year from inactive matches
  DELETE FROM messages
  WHERE sent_at < NOW() - INTERVAL '365 days'
    AND match_id IN (
      SELECT id FROM matches WHERE is_active = FALSE
    );
  GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;

  -- Mark matches as inactive if no messages in 6 months
  UPDATE matches
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM messages
      WHERE messages.match_id = matches.id
        AND messages.sent_at > NOW() - INTERVAL '180 days'
    );
  GET DIAGNOSTICS v_deleted_inactive_matches = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_likes, v_deleted_messages, v_deleted_inactive_matches;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job (runs daily at 2 AM)
SELECT cron.schedule(
  'cleanup-old-data',
  '0 2 * * *',
  'SELECT cleanup_old_data();'
);

-- Function: Reset swipe limits daily
CREATE OR REPLACE FUNCTION reset_daily_swipe_limits()
RETURNS void AS $$
BEGIN
  UPDATE swipe_limits
  SET swipes_count = 0,
      last_reset = NOW()
  WHERE last_reset < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule swipe limit reset (runs daily at midnight)
SELECT cron.schedule(
  'reset-swipe-limits',
  '0 0 * * *',
  'SELECT reset_daily_swipe_limits();'
);

-- =====================================================
-- SECTION 7: SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, status, published_at, tags)
VALUES
  (
    '10 Tips for Creating the Perfect Dating Profile',
    '10-tips-perfect-dating-profile',
    'Learn how to make your profile stand out and attract more matches with these expert tips.',
    'Creating a great dating profile is essential... [full content]',
    'published',
    NOW(),
    ARRAY['tips', 'profile', 'dating-advice']
  ),
  (
    'First Date Ideas That Actually Work',
    'first-date-ideas-that-work',
    'Discover creative and fun first date ideas that will help you make a great impression.',
    'First dates can be nerve-wracking... [full content]',
    'published',
    NOW(),
    ARRAY['dating-advice', 'first-date', 'relationships']
  )
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SECTION 8: VERIFICATION QUERIES
-- =====================================================

-- Check if all tables exist
SELECT
  'user_profiles' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') as exists
UNION ALL
SELECT 'user_settings', EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings')
UNION ALL
SELECT 'likes', EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'likes')
UNION ALL
SELECT 'matches', EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'matches')
UNION ALL
SELECT 'messages', EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages')
UNION ALL
SELECT 'blog_posts', EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'blog_posts')
UNION ALL
SELECT 'swipe_limits', EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'swipe_limits')
UNION ALL
SELECT 'account_deletions', EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'account_deletions');

-- =====================================================
-- SECTION 9: POST-SETUP INSTRUCTIONS
-- =====================================================

-- IMPORTANT: After running this script, you need to:
--
-- 1. Set yourself as admin:
--    UPDATE user_profiles
--    SET is_admin = TRUE
--    WHERE email = 'your-email@example.com';
--
-- 2. Verify storage bucket was created:
--    Check Supabase Dashboard > Storage > profile-photos
--
-- 3. Test RLS policies by creating a test user
--
-- 4. Configure environment variables in your .env.local:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
--    - UPSTASH_REDIS_REST_URL (for production)
--    - UPSTASH_REDIS_REST_TOKEN (for production)
--
-- =====================================================

COMMENT ON DATABASE postgres IS 'Complete Dating App Database Setup - All migrations applied';
