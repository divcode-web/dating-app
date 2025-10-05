-- ============================================
-- ADD LOCATION PREFERENCES TO USER SETTINGS
-- ============================================
-- Allows users to set custom discovery location and expand search radius

-- Add location preference fields to user_settings
DO $$
BEGIN
    -- Add custom_location_city if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'custom_location_city'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN custom_location_city TEXT;
    END IF;

    -- Add custom_location_state if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'custom_location_state'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN custom_location_state TEXT;
    END IF;

    -- Add custom_location_country if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'custom_location_country'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN custom_location_country TEXT;
    END IF;

    -- Add use_custom_location flag if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'use_custom_location'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN use_custom_location BOOLEAN DEFAULT FALSE;
    END IF;

    -- Update distance_range default if needed (already exists, just commenting)
    -- distance_range INTEGER DEFAULT 50 (in kilometers)

    -- Add show_me_gender preferences if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'show_me_gender'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN show_me_gender TEXT[] DEFAULT ARRAY['Male', 'Female', 'Non-binary', 'Other'];
    END IF;

END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_custom_location ON user_settings(custom_location_city, custom_location_state, custom_location_country);
CREATE INDEX IF NOT EXISTS idx_user_settings_distance_range ON user_settings(distance_range);

COMMENT ON COLUMN user_settings.custom_location_city IS 'Custom city for discovery (overrides profile location if use_custom_location is true)';
COMMENT ON COLUMN user_settings.custom_location_state IS 'Custom state/region for discovery';
COMMENT ON COLUMN user_settings.custom_location_country IS 'Custom country for discovery';
COMMENT ON COLUMN user_settings.use_custom_location IS 'If true, use custom location for discovery instead of profile location';
COMMENT ON COLUMN user_settings.distance_range IS 'Search radius in kilometers (default 50km)';
COMMENT ON COLUMN user_settings.show_me_gender IS 'Array of genders to show in discovery';
