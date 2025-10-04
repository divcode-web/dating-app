-- ============================================
-- STORAGE BUCKET SETUP AND POLICIES
-- ============================================
-- Run this AFTER creating the storage bucket manually
-- ============================================

-- First, make sure the bucket exists (create manually in Dashboard > Storage)
-- Bucket name: profile-photos
-- Public: YES

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- Create storage policies for profile-photos bucket
-- Policy 1: Anyone can view (read) photos in the profile-photos bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Policy 2: Authenticated users can upload photos
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Policy 3: Users can update their own photos
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Policy 4: Users can delete their own photos
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- ============================================
-- VERIFICATION
-- ============================================
-- To verify the policies are created:
-- SELECT * FROM storage.objects_policies WHERE bucket_id = 'profile-photos';
--
-- Make sure the bucket is PUBLIC:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click on profile-photos
-- 3. Settings tab
-- 4. Ensure "Public bucket" is enabled
-- ============================================
