# Database Setup Instructions

## 🚀 Quick Start (Fresh Setup or Reset)

### Use `RESET_AND_SETUP.sql` for a clean start

This is the **RECOMMENDED** file to use. It will:
- ✅ Drop all existing tables (if any)
- ✅ Create fresh tables with correct schema
- ✅ Set up all indexes and policies
- ✅ Create the storage bucket for photos

**Steps:**

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run the reset script**
   - Click "New Query"
   - Copy ALL contents from `RESET_AND_SETUP.sql`
   - Paste into the editor
   - Click "Run"

3. **Verify Storage Bucket**
   - Go to **Storage** in the left sidebar
   - You should see a bucket named `profile-photos`
   - If not, create it manually:
     - Click "Create a new bucket"
     - Name: `profile-photos`
     - Make it **Public** ✓
     - Click "Create bucket"

4. **Done!** Your database is ready.

---

## 📋 What's Included

### Tables Created
| Table | Description |
|-------|-------------|
| `user_profiles` | User profile information (name, bio, photos, etc.) |
| `user_settings` | User preferences (notifications, dark mode, filters) |
| `likes` | Swipe likes/passes |
| `matches` | Matched users |
| `messages` | Chat messages between matches |

### Features
- ✅ Row Level Security (RLS) enabled
- ✅ Optimized indexes for performance
- ✅ Auto-updating timestamps
- ✅ Photo storage with proper permissions
- ✅ Geolocation support (PostGIS)

---

## 🔧 Troubleshooting

### Photo Upload Failing?

**Error: "Storage bucket not found"**

**Solution:**
1. Go to Supabase Dashboard > Storage
2. Click "Create a new bucket"
3. Name: `profile-photos`
4. **Important:** Check "Public bucket" ✓
5. Click "Create bucket"

### Settings Not Saving?

Make sure you ran `RESET_AND_SETUP.sql` which has the updated schema with all columns:
- `email_notifications`
- `push_notifications`
- `profile_visibility`
- `distance_range`
- `age_range`
- `dark_mode`

### Dark Mode Not Working?

The dark mode toggle is now in Settings > Account tab. It:
- Saves to database
- Applies immediately
- Persists across sessions

---

## ⚠️ Important Notes

- **RESET_AND_SETUP.sql will DELETE all existing data**
- Always backup important data before running reset scripts
- The storage bucket policies may need to be recreated manually if the SQL insert fails
- Make sure PostGIS extension is enabled (it's in the script)

---

## 🆘 Need Help?

If you encounter errors:

1. **Check Supabase Logs**
   - Go to Database > Logs in Supabase Dashboard

2. **Common Issues:**
   - Extension not found → Enable PostGIS in Database > Extensions
   - Permission denied → Make sure you're using the project owner account
   - Bucket errors → Create the storage bucket manually as described above

3. **Still stuck?**
   - Copy the error message
   - Check which line number failed
   - Most errors are about storage buckets (create manually) or extensions (enable in dashboard)
