-- =====================================================
-- ADD BLOCKING FEATURE
-- =====================================================
-- Creates blocked_users and reports tables with RLS policies
-- Prevents blocked users from messaging each other
-- =====================================================

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  blocked_by_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT   uuid_generate_v4(),
  reporter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can create blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON blocked_users;
DROP POLICY IF EXISTS "Admins can view all blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;

-- RLS Policies for blocked_users
-- Users can see their own blocks
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can create blocks"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete their own blocks"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- Admins can view all blocks
CREATE POLICY "Admins can view all blocks"
  ON blocked_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for reports
-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can view and manage all reports
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Add RLS policy to messages table to prevent blocked users from messaging
-- Drop existing message policies if they exist
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their matches" ON messages;

-- Policy: Users can only view messages in their matches if not blocked
CREATE POLICY "Users can view messages if not blocked"
  ON messages FOR SELECT
  USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users
      WHERE (blocker_id = auth.uid() AND blocked_id = CASE
        WHEN sender_id = auth.uid() THEN receiver_id
        ELSE sender_id
      END)
      OR (blocker_id = CASE
        WHEN sender_id = auth.uid() THEN receiver_id
        ELSE sender_id
      END AND blocked_id = auth.uid())
    )
  );

-- Policy: Users can only send messages if not blocked
CREATE POLICY "Users can send messages if not blocked"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND (m.user_id_1 = auth.uid() OR m.user_id_2 = auth.uid())
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users
      WHERE (blocker_id = auth.uid() AND blocked_id = receiver_id)
      OR (blocker_id = receiver_id AND blocked_id = auth.uid())
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
