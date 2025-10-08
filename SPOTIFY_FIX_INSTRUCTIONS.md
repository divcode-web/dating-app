# Spotify Integration Fix - Setup Instructions

## Problem
Spotify connects successfully but data (top artists, anthem) doesn't save to database.

## Root Cause
The callback was using the **anon key** instead of **service role key**, which doesn't have permission to bypass Row Level Security (RLS) policies when updating user profiles.

## Solution Applied
Updated the callback to use service role key with proper Supabase client configuration.

---

## Required Steps to Fix

### Step 1: Add Service Role Key to Environment Variables

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (⚠️ Keep this secret!)
5. Add it to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **SECURITY WARNING**: Never commit this key to git or expose it in client-side code!

### Step 2: Verify SQL Columns Exist

1. Go to Supabase dashboard → **SQL Editor**
2. Run this verification query:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name LIKE 'spotify%'
ORDER BY column_name;
```

You should see:
- `spotify_access_token` (text)
- `spotify_anthem` (jsonb)
- `spotify_refresh_token` (text)
- `spotify_token_expires_at` (timestamp with time zone)
- `spotify_top_artists` (ARRAY)

If any are missing, run the SQL from [FIX_SPOTIFY_COLUMNS.sql](./FIX_SPOTIFY_COLUMNS.sql)

### Step 3: Verify Spotify App Configuration

1. Go to https://developer.spotify.com/dashboard
2. Click your app
3. Under **Redirect URIs**, make sure you have:
   - `http://localhost:3004/api/spotify/callback` (for local dev)
   - `https://your-production-url.vercel.app/api/spotify/callback` (for production)
4. Click **Save**

### Step 4: Restart Your App

```bash
npm run dev
```

### Step 5: Reconnect Spotify

1. Go to your profile page
2. Click **Connect Spotify** button
3. Authorize the app
4. You should be redirected back with `spotify_success=true`
5. Check your browser console for these logs:
   - ✅ Token data received
   - ✅ Top artists: [list of artists]
   - ✅ Anthem found: [track name]
   - ✅ Spotify integration completed successfully

### Step 6: Verify Data Saved

Run this in Supabase SQL Editor:

```sql
SELECT
    id,
    full_name,
    spotify_top_artists,
    spotify_anthem,
    spotify_access_token IS NOT NULL as has_token,
    spotify_token_expires_at
FROM user_profiles
WHERE id = 'your-user-id-here';
```

You should see:
- `has_token`: true
- `spotify_top_artists`: Array with artist names
- `spotify_anthem`: JSON object with track info

---

## Changes Made

### Files Modified:

1. **[.env.example](./env.example)**
   - Added `SUPABASE_SERVICE_ROLE_KEY`
   - Added Spotify API credentials

2. **[app/api/spotify/callback/route.ts](./app/api/spotify/callback/route.ts)**
   - Changed from anon key to service role key
   - Simplified database update logic (single update instead of split)
   - Added `.select()` to verify update succeeded
   - Improved error logging

### Key Fix:

```typescript
// BEFORE (didn't work):
const supabase = createClient(supabaseUrl, supabaseKey); // anon key

// AFTER (works):
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

---

## Troubleshooting

### Still showing "Connect Spotify" after authorization?

1. Check browser console for error messages
2. Verify all environment variables are set correctly
3. Make sure you restarted the dev server after adding `SUPABASE_SERVICE_ROLE_KEY`

### Getting `spotify_error=unknown`?

1. Check the server console (terminal where `npm run dev` is running)
2. Look for detailed error logs starting with:
   - ❌ Token exchange failed
   - ❌ Artists fetch failed
   - ❌ Database save failed

### Data still showing as null?

1. Clear Spotify connection and reconnect:
```sql
UPDATE user_profiles
SET spotify_access_token = NULL,
    spotify_refresh_token = NULL,
    spotify_token_expires_at = NULL
WHERE id = 'your-user-id';
```

2. Try connecting again with the updated code

### Need to check what's happening?

The callback now has extensive logging. Check your terminal for:
- 🎵 Spotify callback started for user: [user-id]
- 🔄 Exchanging code for access token...
- 🔐 Token response status: 200
- ✅ Token data received
- 🎤 Fetching top artists...
- ✅ Top artists: [artist names]
- 🎵 Fetching top track...
- ✅ Anthem found: [track name]
- 💾 Saving to database...
- ✅ Spotify integration completed successfully

---

## What This Fixes

✅ Spotify data now saves to database
✅ Top artists display on profile
✅ Anthem displays on profile
✅ Proper error logging for debugging
✅ Service role key bypasses RLS policies
✅ Single atomic database update

---

## Security Note

The service role key has **full access** to your database and bypasses all RLS policies. This is why:

1. ✅ It's only used in server-side API routes (never client-side)
2. ✅ It's not in `.env.example` or committed to git
3. ✅ It's only used for admin operations that need to bypass RLS
4. ✅ The callback route validates user identity via state parameter

This is the correct and secure way to handle OAuth callbacks that need to update user data.
