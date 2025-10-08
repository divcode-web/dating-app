-- =====================================================
-- STORY REACTIONS & REPLIES - Dating App
-- =====================================================
-- Adds emoji reactions and reply functionality to stories
-- =====================================================

-- =====================================================
-- SECTION 1: CREATE TABLES
-- =====================================================

-- Story Reactions Table (emoji reactions like Instagram)
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  emoji VARCHAR(10) NOT NULL, -- The emoji reaction (e.g., '❤️', '😂', '😮')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id) -- Each user can only react once per story (can update emoji)
);

-- Update messages table to track story replies
ALTER TABLE messages ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES stories(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS story_reply_type VARCHAR(20) DEFAULT NULL CHECK (story_reply_type IN ('text', 'emoji'));

-- =====================================================
-- SECTION 2: INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_created_at ON story_reactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_story_id ON messages(story_id) WHERE story_id IS NOT NULL;

-- =====================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- Story Reactions Policies

-- Users can view reactions on their own stories
CREATE POLICY "Users can view reactions on own stories"
  ON story_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories s
      WHERE s.id = story_reactions.story_id AND s.user_id = auth.uid()
    )
  );

-- Users can view their own reactions
CREATE POLICY "Users can see their own reactions"
  ON story_reactions FOR SELECT
  USING (user_id = auth.uid());

-- Users can view reactions on stories from matches
CREATE POLICY "Users can view reactions on match stories"
  ON story_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories s
      JOIN matches m ON (
        (m.user_id_1 = auth.uid() AND m.user_id_2 = s.user_id)
        OR (m.user_id_2 = auth.uid() AND m.user_id_1 = s.user_id)
      )
      WHERE s.id = story_reactions.story_id
    )
  );

-- Users can create reactions on stories from matches
CREATE POLICY "Users can react to match stories"
  ON story_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM stories s
      JOIN matches m ON (
        (m.user_id_1 = auth.uid() AND m.user_id_2 = s.user_id)
        OR (m.user_id_2 = auth.uid() AND m.user_id_1 = s.user_id)
      )
      WHERE s.id = story_reactions.story_id
        AND s.is_active = TRUE
        AND s.expires_at > NOW()
    )
  );

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions"
  ON story_reactions FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
  ON story_reactions FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- SECTION 4: FUNCTIONS
-- =====================================================

-- Function: Get reactions for a story
CREATE OR REPLACE FUNCTION get_story_reactions(p_story_id UUID)
RETURNS TABLE(
  reaction_id UUID,
  user_id UUID,
  full_name VARCHAR(255),
  profile_photo TEXT,
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.id as reaction_id,
    sr.user_id,
    up.full_name,
    up.photos[1] as profile_photo,
    sr.emoji,
    sr.created_at
  FROM story_reactions sr
  JOIN user_profiles up ON up.id = sr.user_id
  WHERE sr.story_id = p_story_id
  ORDER BY sr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get emoji counts for a story
CREATE OR REPLACE FUNCTION get_story_emoji_counts(p_story_id UUID)
RETURNS TABLE(
  emoji VARCHAR(10),
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.emoji,
    COUNT(*) as count
  FROM story_reactions sr
  WHERE sr.story_id = p_story_id
  GROUP BY sr.emoji
  ORDER BY count DESC, sr.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 5: VERIFICATION
-- =====================================================

-- Verify table was created
SELECT
  'story_reactions' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'story_reactions') as exists;

-- Verify column was added to messages
SELECT
  'messages.story_id' as column_name,
  EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'story_id'
  ) as exists;

-- =====================================================
-- COMPLETE
-- =====================================================

COMMENT ON TABLE story_reactions IS 'Emoji reactions on stories (like Instagram)';
COMMENT ON COLUMN messages.story_id IS 'Reference to story if this message is a reply to a story';
COMMENT ON COLUMN messages.story_reply_type IS 'Type of story reply: text or emoji';
