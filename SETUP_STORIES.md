# Quick Setup Guide - Stories Feature

## 🚀 5-Minute Setup

### Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `supabase/migrations/ADD_STORIES_FEATURE.sql`
5. Paste and click **RUN**

✅ This creates all tables, indexes, RLS policies, storage bucket, and cron jobs

### Step 2: Verify Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Confirm `stories` bucket exists
3. Verify it's set to **public**

### Step 3: Test the Feature

1. **Deploy or restart your Next.js app:**
   ```bash
   npm run dev
   ```

2. **Navigate to `/matches` page**

3. **Test uploading a story:**
   - Click the "+" button at the top
   - Upload a photo or video
   - Add a caption (optional)
   - Click "Share Story"

4. **Test viewing stories:**
   - Stories from your matches appear in the ring
   - Click any avatar to view
   - Tap/click to navigate

## That's it! 🎉

The feature is fully functional and includes:
- ✅ 24-hour auto-expiration
- ✅ View tracking
- ✅ Only visible to matches
- ✅ Automatic cleanup
- ✅ Full privacy controls

## Quick Test Checklist

- [ ] Upload a photo story
- [ ] Upload a video story
- [ ] View a match's story
- [ ] See who viewed your story
- [ ] Delete your own story
- [ ] Verify story ring shows unviewed (colorful) vs viewed (gray)

## Need Help?

See `STORIES_FEATURE_README.md` for detailed documentation.

Common issues:
- **Upload fails**: Check file size (max 50MB) and format
- **Stories not visible**: Verify you have matches
- **Cron jobs not running**: Manually test with `SELECT expire_old_stories();`
