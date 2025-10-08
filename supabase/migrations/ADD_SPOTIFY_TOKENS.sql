-- Add Spotify token storage to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for token expiration queries
CREATE INDEX IF NOT EXISTS idx_spotify_token_expires
ON user_profiles(spotify_token_expires_at)
WHERE spotify_access_token IS NOT NULL;

-- Comment
COMMENT ON COLUMN user_profiles.spotify_access_token IS 'Spotify OAuth access token for Web Playback SDK';
COMMENT ON COLUMN user_profiles.spotify_refresh_token IS 'Spotify OAuth refresh token to renew expired access tokens';
COMMENT ON COLUMN user_profiles.spotify_token_expires_at IS 'Timestamp when the Spotify access token expires';
