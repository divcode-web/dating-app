-- Add soft delete columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS blocked_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Create index for blocked users
CREATE INDEX IF NOT EXISTS idx_user_profiles_blocked ON user_profiles(blocked_by_admin, blocked_until);

-- Create permanent ban table (PERMANENT - user can NEVER sign up again)
CREATE TABLE IF NOT EXISTS banned_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  banned_by UUID REFERENCES admin_users(id),
  ban_reason TEXT,
  original_user_id UUID,
  original_user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast email lookup
CREATE INDEX IF NOT EXISTS idx_banned_emails_email ON banned_emails(email);

-- Enable RLS on banned_emails
ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;

-- Allow public to read (for signup check)
CREATE POLICY "Public can check banned emails" ON banned_emails
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage banned emails" ON banned_emails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Function to check if user is blocked and prevent login
CREATE OR REPLACE FUNCTION check_user_block_status()
RETURNS TRIGGER AS $$
DECLARE
  is_blocked BOOLEAN;
  block_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only check if column exists (prevents errors during migration)
  BEGIN
    SELECT blocked_by_admin, blocked_until
    INTO is_blocked, block_until
    FROM user_profiles
    WHERE id = NEW.id;

    -- Check if user is blocked
    IF is_blocked = true AND (block_until IS NULL OR block_until > NOW()) THEN
      RAISE EXCEPTION 'Your account has been blocked. Please contact support.';
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      -- Column doesn't exist yet, skip check
      NULL;
    WHEN others THEN
      -- Any other error, skip check to avoid breaking login
      NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check block status on auth
DROP TRIGGER IF EXISTS check_block_on_auth ON auth.users;
CREATE TRIGGER check_block_on_auth
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION check_user_block_status();

-- Function to permanently delete expired blocks (2 weeks old) and ADD to banned_emails
CREATE OR REPLACE FUNCTION cleanup_expired_blocks()
RETURNS void AS $$
BEGIN
  -- First, add emails to permanent ban list BEFORE deleting profiles
  INSERT INTO banned_emails (email, original_user_id, original_user_name, ban_reason, banned_at)
  SELECT
    u.email,
    p.id,
    p.full_name,
    p.block_reason,
    p.blocked_at
  FROM user_profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.blocked_by_admin = true
  AND p.blocked_at < NOW() - INTERVAL '14 days'
  ON CONFLICT (email) DO NOTHING;

  -- Then delete profiles that have been blocked for more than 2 weeks
  DELETE FROM user_profiles
  WHERE blocked_by_admin = true
  AND blocked_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: You can run cleanup_expired_blocks() manually or set up a cron job
-- To set up automatic cleanup, run this in Supabase SQL editor:
-- SELECT cron.schedule('cleanup-expired-blocks', '0 2 * * *', 'SELECT cleanup_expired_blocks()');
