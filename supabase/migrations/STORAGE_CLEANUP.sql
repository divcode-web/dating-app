-- ============================================
-- STORAGE OPTIMIZATION & CLEANUP
-- ============================================
-- Run this periodically to clean up old data and save storage space
-- ============================================

-- 1. Delete messages older than 90 days (keeps recent conversations)
DELETE FROM messages
WHERE sent_at < NOW() - INTERVAL '90 days';

-- 2. Delete orphaned likes (where users no longer exist)
DELETE FROM likes
WHERE from_user_id NOT IN (SELECT id FROM auth.users)
   OR to_user_id NOT IN (SELECT id FROM auth.users);

-- 3. Delete orphaned matches (where users no longer exist)
DELETE FROM matches
WHERE user_id_1 NOT IN (SELECT id FROM auth.users)
   OR user_id_2 NOT IN (SELECT id FROM auth.users);

-- 4. Delete inactive user profiles (no activity in 180 days)
-- Uncomment if you want to remove inactive users
-- DELETE FROM user_profiles
-- WHERE last_active < NOW() - INTERVAL '180 days';

-- 5. Clean up orphaned user settings
DELETE FROM user_settings
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- ============================================
-- STORAGE BUCKET CLEANUP (Run manually via Dashboard)
-- ============================================
-- To clean up orphaned photos in storage:
-- 1. Go to Supabase Dashboard > Storage > profile-photos
-- 2. Look for old/unused images
-- 3. Delete manually (be careful!)
--
-- Or use this query to find orphaned photos:
SELECT name FROM storage.objects
WHERE bucket_id = 'profile-photos'
AND name NOT IN (
  SELECT UNNEST(photos) FROM user_profiles
);

-- ============================================
-- AUTOMATED CLEANUP (CREATE FUNCTION)
-- ============================================
-- This function can be called periodically to clean up old data

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old messages (90+ days)
  DELETE FROM messages WHERE sent_at < NOW() - INTERVAL '90 days';

  -- Delete orphaned likes
  DELETE FROM likes
  WHERE from_user_id NOT IN (SELECT id FROM auth.users)
     OR to_user_id NOT IN (SELECT id FROM auth.users);

  -- Delete orphaned matches
  DELETE FROM matches
  WHERE user_id_1 NOT IN (SELECT id FROM auth.users)
     OR user_id_2 NOT IN (SELECT id FROM auth.users);

  -- Delete orphaned settings
  DELETE FROM user_settings
  WHERE user_id NOT IN (SELECT id FROM auth.users);

  RAISE NOTICE 'Cleanup completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Schedule this to run weekly (you can set this up in Supabase Dashboard > Database > Cron Jobs)
-- Or call manually: SELECT cleanup_old_data();

-- ============================================
-- STORAGE USAGE MONITORING
-- ============================================
-- Check your current storage usage

-- Count total messages
SELECT COUNT(*) as total_messages FROM messages;

-- Count messages per user
SELECT sender_id, COUNT(*) as message_count
FROM messages
GROUP BY sender_id
ORDER BY message_count DESC
LIMIT 10;

-- Count photos per user
SELECT id, full_name, COALESCE(array_length(photos, 1), 0) as photo_count
FROM user_profiles
ORDER BY photo_count DESC
LIMIT 10;

-- ============================================
-- RECOMMENDATIONS
-- ============================================
-- 1. Image Compression: Photos are compressed to 1200x1200 @ 80% quality in the app
-- 2. Message Retention: Messages older than 90 days are deleted automatically
-- 3. Inactive Users: Users with no activity for 180+ days can be removed
-- 4. Photo Limit: Max 6 photos per user (enforced in app)
-- 5. Message Encryption: Messages are encrypted (slight storage overhead but worth it)
-- ============================================
