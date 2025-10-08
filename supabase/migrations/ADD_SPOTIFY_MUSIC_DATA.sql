-- Add Spotify music data fields to user_profiles table
-- These fields store user's top artists and favorite track (anthem)

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS spotify_top_artists TEXT[],
ADD COLUMN IF NOT EXISTS spotify_anthem JSONB;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.spotify_top_artists IS 'Array of user''s top 5 artists from Spotify (medium term)';
COMMENT ON COLUMN user_profiles.spotify_anthem IS 'User''s top track with metadata (id, name, artist, preview_url, album_image)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_spotify_artists
ON user_profiles USING GIN(spotify_top_artists)
WHERE spotify_top_artists IS NOT NULL;

-- Create index for anthem queries
CREATE INDEX IF NOT EXISTS idx_spotify_anthem
ON user_profiles(spotify_anthem)
WHERE spotify_anthem IS NOT NULL;