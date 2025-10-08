-- =====================================================
-- STORIES FEATURE - Dating App
-- =====================================================
-- Adds stories functionality where matches can share
-- 24-hour ephemeral content with each other
-- =====================================================

-- =====================================================
-- SECTION 1: CREATE TABLES
-- =====================================================

-- Stories Table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  caption TEXT,
  duration INTEGER DEFAULT 5, -- Duration in seconds for video, or display time for image
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story Views Table (track who viewed each story)
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id) -- Each user can only view a story once
);

-- =====================================================
-- SECTION 2: INDEXES FOR PERFORMANCE
-- =====================================================

-- Stories Indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_is_active ON stories(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_stories_active_unexpired ON stories(user_id, is_active, expires_at);

-- Story Views Indexes
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at DESC);

-- =====================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Stories Policies

-- Users can view their own stories
CREATE POLICY "Users can view own stories"
  ON stories FOR SELECT
  USING (user_id = auth.uid());

-- Users can view stories from their matches (only active, non-expired stories)
CREATE POLICY "Users can view stories from matches"
  ON stories FOR SELECT
  USING (
    is_active = TRUE
    AND expires_at > NOW()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM matches m
        WHERE (m.user_id_1 = auth.uid() AND m.user_id_2 = stories.user_id)
           OR (m.user_id_2 = auth.uid() AND m.user_id_1 = stories.user_id)
      )
    )
  );

-- Users can create their own stories
CREATE POLICY "Users can create own stories"
  ON stories FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own stories
CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own stories
CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  USING (user_id = auth.uid());

-- Story Views Policies

-- Users can view their own story views (to see who viewed their stories)
CREATE POLICY "Users can view own story views"
  ON story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories s
      WHERE s.id = story_views.story_id AND s.user_id = auth.uid()
    )
  );

-- Users can view stories they've viewed
CREATE POLICY "Users can see their own views"
  ON story_views FOR SELECT
  USING (viewer_id = auth.uid());

-- Users can create story views when viewing stories from matches
CREATE POLICY "Users can create story views"
  ON story_views FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

-- =====================================================
-- SECTION 4: STORAGE BUCKET
-- =====================================================

-- Stories Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Stories

-- Anyone can view stories (bucket is public, but access controlled via RLS on stories table)
CREATE POLICY "Anyone can view stories"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

-- Authenticated users can upload stories
CREATE POLICY "Authenticated users can upload stories"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own story files
CREATE POLICY "Users can update own stories"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own story files
CREATE POLICY "Users can delete own stories"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- SECTION 5: FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Auto-expire old stories
CREATE OR REPLACE FUNCTION expire_old_stories()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Mark stories as inactive if they've expired
  UPDATE stories
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND expires_at <= NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Delete expired stories and their media
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS TABLE(
  deleted_stories INTEGER,
  deleted_views INTEGER
) AS $$
DECLARE
  v_deleted_stories INTEGER;
  v_deleted_views INTEGER;
BEGIN
  -- Delete story views for stories expired more than 7 days ago
  DELETE FROM story_views
  WHERE story_id IN (
    SELECT id FROM stories
    WHERE expires_at < NOW() - INTERVAL '7 days'
  );
  GET DIAGNOSTICS v_deleted_views = ROW_COUNT;

  -- Delete stories expired more than 7 days ago
  -- Note: This will also trigger deletion of associated storage files via application logic
  DELETE FROM stories
  WHERE expires_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted_stories = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_stories, v_deleted_views;
END;
$$ LANGUAGE plpgsql;

-- Function: Get stories from user's matches
CREATE OR REPLACE FUNCTION get_match_stories(p_user_id UUID)
RETURNS TABLE(
  story_id UUID,
  user_id UUID,
  full_name VARCHAR(255),
  profile_photo TEXT,
  media_url TEXT,
  media_type VARCHAR(20),
  thumbnail_url TEXT,
  caption TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_viewed BOOLEAN,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as story_id,
    s.user_id,
    up.full_name,
    up.photos[1] as profile_photo,
    s.media_url,
    s.media_type,
    s.thumbnail_url,
    s.caption,
    s.duration,
    s.created_at,
    s.expires_at,
    EXISTS(
      SELECT 1 FROM story_views sv
      WHERE sv.story_id = s.id AND sv.viewer_id = p_user_id
    ) as is_viewed,
    (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id) as view_count
  FROM stories s
  JOIN user_profiles up ON up.id = s.user_id
  WHERE s.is_active = TRUE
    AND s.expires_at > NOW()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.user_id_1 = p_user_id AND m.user_id_2 = s.user_id)
         OR (m.user_id_2 = p_user_id AND m.user_id_1 = s.user_id)
    )
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update updated_at timestamp for stories
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 6: CRON JOBS
-- =====================================================

-- Schedule story expiration check (runs every hour)
SELECT cron.schedule(
  'expire-old-stories',
  '0 * * * *', -- Every hour
  'SELECT expire_old_stories();'
);

-- Schedule story cleanup (runs daily at 3 AM)
SELECT cron.schedule(
  'cleanup-expired-stories',
  '0 3 * * *', -- Daily at 3 AM
  'SELECT cleanup_expired_stories();'
);

-- =====================================================
-- SECTION 7: VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT
  'stories' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stories') as exists
UNION ALL
SELECT
  'story_views',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'story_views');

-- =====================================================
-- COMPLETE
-- =====================================================

COMMENT ON TABLE stories IS 'Ephemeral 24-hour content shared between matches';
COMMENT ON TABLE story_views IS 'Tracks which users have viewed each story';
