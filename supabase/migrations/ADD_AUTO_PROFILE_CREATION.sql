-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================
-- This trigger automatically creates a user_profile
-- when a new user signs up via Supabase Auth

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile with minimal required fields
  INSERT INTO public.user_profiles (
    id,
    full_name,
    date_of_birth,
    gender,
    bio
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(
      (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
      CASE
        WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL
        THEN (DATE_TRUNC('year', CURRENT_DATE) - (NEW.raw_user_meta_data->>'age')::INT * INTERVAL '1 year')::DATE
        ELSE (CURRENT_DATE - INTERVAL '25 years')::DATE
      END
    ),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'prefer-not-to-say'),
    COALESCE(NEW.raw_user_meta_data->>'bio', '')
  );

  -- Also set optional fields if provided
  UPDATE public.user_profiles
  SET
    location_city = NEW.raw_user_meta_data->>'location',
    interests = CASE
      WHEN NEW.raw_user_meta_data->'interests' IS NOT NULL
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'interests'))
      ELSE NULL
    END
  WHERE id = NEW.id;

  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default subscription (free tier)
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================

-- Allow the trigger function to bypass RLS
ALTER FUNCTION handle_new_user() SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates user profile, settings, and subscription when a new user signs up';
