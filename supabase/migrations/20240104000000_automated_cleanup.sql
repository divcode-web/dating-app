-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cleanup function that returns statistics
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE(
  messages_deleted INTEGER,
  likes_deleted INTEGER,
  matches_deleted INTEGER,
  settings_deleted INTEGER,
  cleanup_time TIMESTAMP
) AS $$
DECLARE
  v_messages INTEGER;
  v_likes INTEGER;
  v_matches INTEGER;
  v_settings INTEGER;
BEGIN
  -- Delete old messages (90+ days)
  DELETE FROM messages WHERE sent_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_messages = ROW_COUNT;

  -- Delete orphaned likes
  DELETE FROM likes
  WHERE from_user_id NOT IN (SELECT id FROM auth.users)
     OR to_user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_likes = ROW_COUNT;

  -- Delete orphaned matches
  DELETE FROM matches
  WHERE user_id_1 NOT IN (SELECT id FROM auth.users)
     OR user_id_2 NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_matches = ROW_COUNT;

  -- Delete orphaned settings
  DELETE FROM user_settings
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_settings = ROW_COUNT;

  RETURN QUERY SELECT v_messages, v_likes, v_matches, v_settings, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run every Sunday at 2 AM UTC
SELECT cron.schedule(
  'weekly-cleanup',
  '0 2 * * 0',
  $$SELECT cleanup_old_data();$$
);

-- Create function to clean up orphaned storage files
CREATE OR REPLACE FUNCTION cleanup_orphaned_photos()
RETURNS TABLE(deleted_file TEXT) AS $$
BEGIN
  RETURN QUERY
  DELETE FROM storage.objects
  WHERE bucket_id = 'profile-photos'
  AND name NOT IN (
    SELECT UNNEST(photos) FROM user_profiles WHERE photos IS NOT NULL
  )
  AND created_at < NOW() - INTERVAL '7 days'
  RETURNING name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule photo cleanup to run monthly on the 1st at 3 AM UTC
SELECT cron.schedule(
  'monthly-photo-cleanup',
  '0 3 1 * *',
  $$SELECT cleanup_orphaned_photos();$$
);
