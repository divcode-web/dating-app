# Photo Upload Fix - Step by Step

## The Problem
Photo uploads are failing with error: "new row violates row-level security policy"

## The Solution (3 Steps)

### Step 1: Create Storage Bucket
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Storage** in left sidebar
4. Click "**New bucket**"
5. Name: `profile-photos` (EXACTLY this name)
6. ✅ Check "**Public bucket**" ← IMPORTANT!
7. Click "Create bucket"

### Step 2: Run Storage Policies SQL
1. Still in Supabase Dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click "**New query**"
4. Copy the contents from `/supabase/migrations/STORAGE_POLICIES.sql`
5. Paste into the editor
6. Click "**Run**"

This creates the security policies that allow authenticated users to upload.

### Step 3: Verify It Works
1. Go back to **Storage**
2. Click on "profile-photos" bucket
3. Try uploading a test image
4. If it works here, it will work in the app!

## The Code Fix (Already Applied)
I've already fixed the file path issue in `lib/api.ts:166` - it was duplicating the bucket name.

Before:
```typescript
const filePath = `profile-photos/${fileName}`;
```

After:
```typescript
const filePath = fileName; // Just the filename
```

## Test the Upload
1. Sign in to the app
2. Go to Profile page
3. Click "Add Photo"
4. Select an image (JPEG, PNG, or WebP, max 5MB)
5. Should upload successfully!

## Still Having Issues?

### Check 1: Bucket is Public
- Storage > profile-photos > Settings
- "Public bucket" should be ON

### Check 2: Policies exist
Run this in SQL Editor:
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'profile-photos';
```
Should show 4 policies.

### Check 3: Browser console
- Open browser DevTools (F12)
- Go to Console tab
- Try uploading
- Look for detailed error messages

## Common Errors

**"Bucket not found"**
→ Bucket name is wrong or doesn't exist. Go to Step 1.

**"Row-level security policy"**
→ Policies aren't set up. Go to Step 2.

**"File too large"**
→ File must be under 5MB. Use a smaller image.

**"Invalid file type"**
→ Only JPEG, PNG, and WebP are allowed.

---

Once you complete these steps, photo uploads will work perfectly! 📸
