-- ============================================
-- ADD MISSING PROFILE FIELDS
-- ============================================
-- Adds fields for enhanced profile setup

-- Add new columns to user_profiles table if they don't exist
DO $$
BEGIN
    -- Add occupation if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'occupation'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN occupation TEXT;
    END IF;

    -- Add education if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'education'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN education TEXT;
    END IF;

    -- Add relationship_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'relationship_type'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN relationship_type TEXT;
    END IF;

    -- Add looking_for if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'looking_for'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN looking_for TEXT[];
    END IF;

    -- Add height if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'height'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN height INTEGER;
    END IF;

    -- Ensure location_city exists (should already be there)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'location_city'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN location_city TEXT;
    END IF;

    -- Ensure interests exists (should already be there)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'interests'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN interests TEXT[];
    END IF;

END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_occupation ON user_profiles(occupation);
CREATE INDEX IF NOT EXISTS idx_user_profiles_education ON user_profiles(education);
CREATE INDEX IF NOT EXISTS idx_user_profiles_relationship_type ON user_profiles(relationship_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_height ON user_profiles(height);

COMMENT ON COLUMN user_profiles.occupation IS 'User job title or profession';
COMMENT ON COLUMN user_profiles.education IS 'User education background';
COMMENT ON COLUMN user_profiles.relationship_type IS 'What type of relationship user is looking for';
COMMENT ON COLUMN user_profiles.looking_for IS 'Array of relationship goals (friendship, dating, etc.)';
COMMENT ON COLUMN user_profiles.height IS 'User height in centimeters';
