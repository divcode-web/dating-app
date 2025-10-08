-- =====================================================
-- ADD SPOTIFY INTEGRATION COLUMNS TO USER_PROFILES
-- =====================================================
-- Run this in your Supabase SQL Editor to fix Spotify integration
-- =====================================================

-- Step 1: Add Spotify OAuth token columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Add Spotify user data columns (these should already exist but let's make sure)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS spotify_top_artists TEXT[],
ADD COLUMN IF NOT EXISTS spotify_anthem JSONB;

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotify_token_expires
ON user_profiles(spotify_token_expires_at)
WHERE spotify_access_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spotify_connected
ON user_profiles(id)
WHERE spotify_access_token IS NOT NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN user_profiles.spotify_access_token IS 'Spotify OAuth access token for Web Playback SDK';
COMMENT ON COLUMN user_profiles.spotify_refresh_token IS 'Spotify OAuth refresh token to renew expired access tokens';
COMMENT ON COLUMN user_profiles.spotify_token_expires_at IS 'Timestamp when the Spotify access token expires';
COMMENT ON COLUMN user_profiles.spotify_top_artists IS 'Array of user''s top 5 Spotify artists';
COMMENT ON COLUMN user_profiles.spotify_anthem IS 'JSON object containing user''s top track (anthem) with track_id, track_name, artist_name, preview_url, album_image';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all columns were added successfully
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name LIKE 'spotify%'
ORDER BY column_name;

-- Expected output:
-- spotify_access_token     | text                        | YES
-- spotify_anthem           | jsonb                       | YES
-- spotify_refresh_token    | text                        | YES
-- spotify_token_expires_at | timestamp with time zone    | YES
-- spotify_top_artists      | ARRAY                       | YES

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================
-- If Spotify connection still fails after running this:
--
-- 1. Check your .env.local has these variables:
--    SPOTIFY_CLIENT_ID=your_client_id
--    SPOTIFY_CLIENT_SECRET=your_client_secret
--    NEXT_PUBLIC_APP_URL=http://localhost:3000
--
-- 2. Check Spotify Developer Dashboard:
--    - Go to https://developer.spotify.com/dashboard
--    - Click your app
--    - Under "Redirect URIs" make sure you have:
--      http://localhost:3000/api/spotify/callback
--      https://your-app.vercel.app/api/spotify/callback
--
-- 3. Test the connection:
--    - Click "Connect Spotify" button
--    - Authorize the app
--    - You should be redirected back with spotify_success=true
--
-- 4. Check if data was saved:
SELECT
    id,
    full_name,
    spotify_top_artists,
    spotify_anthem,
    spotify_access_token IS NOT NULL as has_token,
    spotify_token_expires_at
FROM user_profiles
WHERE spotify_access_token IS NOT NULL
LIMIT 5;

-- =====================================================
-- CLEANUP (Optional)
-- =====================================================
-- Only run this if you want to reset ALL Spotify connections:
-- UPDATE user_profiles
-- SET
--     spotify_access_token = NULL,
--     spotify_refresh_token = NULL,
--     spotify_token_expires_at = NULL,
--     spotify_top_artists = NULL,
--     spotify_anthem = NULL
-- WHERE spotify_access_token IS NOT NULL;
