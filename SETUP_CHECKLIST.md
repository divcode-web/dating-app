# 🚀 Complete Setup Checklist

## ✅ What You Have Now

### Database Schema (/supabase/migrations/)
- ✅ `COMPLETE_RESET.sql` - Full database with all tables, functions, triggers
- ✅ `CREATE_ADMIN.sql` - Helper script to create admin accounts
- ✅ `STORAGE_POLICIES.sql` - Storage bucket policies
- ✅ `STORAGE_CLEANUP.sql` - Optional cleanup automation

### Admin Portal
- ✅ `/admin/login` - Separate admin authentication
- ✅ `/admin/dashboard` - Full admin dashboard with:
  - Analytics (users, premium, verified, reports)
  - Reports management
  - Verification video review
  - Dark purple theme

### User Features
- ✅ Extended profiles with 11+ optional fields
- ✅ Profile completion % indicator
- ✅ Verification system with video upload
- ✅ Verified badge ✓ on profiles
- ✅ View other users' profiles
- ✅ Message encryption (AES-GCM)
- ✅ Image sending in chat
- ✅ Report/block users
- ✅ Premium subscription tiers (3 levels)
- ✅ Message limits (50/day for free users)

---

## 📋 Setup Steps (In Order)

### 1️⃣ Database Setup

**Run in Supabase SQL Editor:**

```sql
-- This creates EVERYTHING
-- Tables, indexes, functions, policies, triggers
```

**File to run:** `supabase/migrations/COMPLETE_RESET.sql`

**What it creates:**
- user_profiles (with verification fields)
- admin_users
- subscriptions (free, basic, premium, platinum)
- message_limits
- blocked_users
- reports (with admin review fields)
- matches
- messages (with image_url)
- likes
- user_settings
- All RLS policies
- calculate_profile_completion() function
- check_message_limit() trigger
- cleanup_old_messages() function

---

### 2️⃣ Storage Bucket Setup

**In Supabase Dashboard > Storage:**

1. Click "Create a new bucket"
2. Name: `profile-photos`
3. **Make it PUBLIC** ✓
4. Click "Create"

**Then run in SQL Editor:**

```sql
-- File: supabase/migrations/STORAGE_POLICIES.sql
```

This adds RLS policies for the storage bucket.

---

### 3️⃣ Create Your Admin Account

**Step 3a: Sign up as a regular user first**

1. Go to your app: `http://localhost:3000/auth`
2. Sign up with your email/password
3. Complete the onboarding

**Step 3b: Make yourself an admin**

1. Open: `supabase/migrations/CREATE_ADMIN.sql`
2. Follow the instructions in that file:
   - Replace email in step 1
   - Run step 1 to get your UUID
   - Copy UUID
   - Uncomment step 2 and paste your UUID
   - Run step 2 to create admin account
   - Run step 3 to verify

**Example commands:**

```sql
-- Find your ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Create admin (replace with your UUID)
INSERT INTO admin_users (id, role, permissions)
VALUES ('your-uuid-from-above', 'super_admin', ARRAY['all']);

-- Verify
SELECT * FROM admin_users WHERE id = 'your-uuid';
```

---

### 4️⃣ Test Admin Access

1. **Logout** from user app
2. Go to: `http://localhost:3000/admin/login`
3. Login with same credentials
4. You should see admin dashboard

**You should see:**
- Stats cards (users, premium, verified, reports)
- Reports tab
- Verifications tab

---

### 5️⃣ Test User Features

**Profile Completion:**
- Go to `/profile`
- See completion % circle
- See "Get Verified" card

**Verification:**
- Click "Verify Now"
- Upload a test video
- Go to admin dashboard
- Approve/reject verification
- See ✓ badge appear

**Messages:**
- Send a message
- Try sending an image
- Try reporting a user
- Try blocking a user

---

## 🎯 Quick Reference

### URLs

**User App:**
- `/` - Landing page
- `/auth` - Sign up/in
- `/onboarding` - Multi-step onboarding
- `/home` - Dashboard
- `/swipe` - Swipe interface
- `/matches` - View matches
- `/likes` - See who likes you (premium)
- `/messages` - Chat with matches
- `/profile` - Your profile
- `/profile?userId=xxx` - View other user
- `/profile/verify` - Upload verification
- `/settings` - App settings

**Admin Portal:**
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin panel

### Database Tables

**Core:**
- `user_profiles` - User data + verification
- `user_settings` - User preferences
- `auth.users` - Supabase auth

**Social:**
- `matches` - User matches
- `messages` - Chat messages (encrypted)
- `likes` - User likes/swipes

**Admin:**
- `admin_users` - Admin accounts
- `reports` - User reports
- `blocked_users` - Blocked relationships

**Monetization:**
- `subscriptions` - Premium tiers
- `message_limits` - Daily message tracking

### Key Functions

```sql
-- Get profile completion %
SELECT calculate_profile_completion('user-uuid');

-- Cleanup old messages
SELECT cleanup_old_messages();

-- Check if user is admin
SELECT * FROM admin_users WHERE id = 'user-uuid';
```

---

## 🔐 Admin Permissions

### Roles

**super_admin:**
- Full access to everything
- Can create/manage other admins
- Can view all data
- Can modify reports

**admin:**
- Can view reports
- Can review verifications
- Can view analytics
- Cannot manage other admins

### How to Add More Admins

```sql
-- As super_admin, run:
INSERT INTO admin_users (id, role, permissions, created_by)
VALUES (
    'new-admin-user-uuid',
    'admin',  -- or 'super_admin'
    ARRAY['view_reports', 'manage_verifications'],
    'your-uuid'
);
```

---

## 📊 Subscription Tiers

| Feature | Free | Basic | Premium | Platinum |
|---------|------|-------|---------|----------|
| Messages/Day | 50 | ∞ | ∞ | ∞ |
| Message History | 21 days | 60 days | 60 days | 60 days |
| See Who Likes You | ❌ | ❌ | ✅ | ✅ |
| Verified Badge Eligible | ✅ | ✅ | ✅ | ✅ |
| Image Sharing | ✅ | ✅ | ✅ | ✅ |

**To change user's plan:**
```sql
UPDATE subscriptions
SET plan = 'premium', expires_at = NOW() + INTERVAL '30 days'
WHERE user_id = 'user-uuid';
```

---

## 🧹 Maintenance

### Message Cleanup (Weekly)

```sql
-- Run this weekly to cleanup old messages
SELECT cleanup_old_messages();
```

**Or set up automatic cleanup** (Supabase Dashboard > Database > Cron Jobs):
```sql
SELECT cron.schedule(
    'cleanup-messages',
    '0 2 * * 0',  -- Every Sunday at 2 AM
    $$ SELECT cleanup_old_messages(); $$
);
```

### View Stats

```sql
-- Total users
SELECT COUNT(*) FROM user_profiles;

-- Premium users
SELECT COUNT(*) FROM subscriptions WHERE plan != 'free';

-- Verified users
SELECT COUNT(*) FROM user_profiles WHERE is_verified = true;

-- Pending verifications
SELECT COUNT(*) FROM user_profiles WHERE verification_status = 'pending';

-- Pending reports
SELECT COUNT(*) FROM reports WHERE status = 'pending';
```

---

## 🐛 Troubleshooting

### Can't access admin dashboard
**Problem:** Redirects to /admin/login
**Solution:**
1. Check you're in admin_users table:
   ```sql
   SELECT * FROM admin_users WHERE id = auth.uid();
   ```
2. If not there, add yourself using CREATE_ADMIN.sql

### Profile completion shows 0%
**Problem:** Function not working
**Solution:**
1. Check function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'calculate_profile_completion';
   ```
2. If not, re-run COMPLETE_RESET.sql

### Verification upload fails
**Problem:** Storage error
**Solutions:**
- Check `profile-photos` bucket exists
- Verify bucket is PUBLIC
- Check STORAGE_POLICIES.sql was run
- Check video is under 50MB

### Messages not sending
**Problem:** Could be message limit
**Solution:**
1. Check if user hit daily limit:
   ```sql
   SELECT * FROM message_limits WHERE user_id = 'user-id' AND date = CURRENT_DATE;
   ```
2. If free user, upgrade to premium or reset count:
   ```sql
   DELETE FROM message_limits WHERE user_id = 'user-id' AND date = CURRENT_DATE;
   ```

### RLS policy errors
**Problem:** "new row violates row-level security policy"
**Solution:**
- Re-run COMPLETE_RESET.sql
- Check user is authenticated
- Verify policies exist for that table

---

## 📝 Files Summary

### SQL Files (supabase/migrations/)
1. `COMPLETE_RESET.sql` - **RUN THIS FIRST** - Full database
2. `CREATE_ADMIN.sql` - Helper to create admins
3. `STORAGE_POLICIES.sql` - Storage bucket policies
4. `STORAGE_CLEANUP.sql` - Optional automation

### Admin Portal (app/admin/)
- `login/page.tsx` - Admin login
- `dashboard/page.tsx` - Admin dashboard

### User Features
- `app/profile/page.tsx` - Profile view + completion %
- `app/profile/verify/page.tsx` - Verification upload
- `app/messages/page.tsx` - Chat with encryption, images, report, block

### Documentation
- `ADMIN_AND_VERIFICATION_GUIDE.md` - Full feature guide
- `SETUP_CHECKLIST.md` - This file
- `FEATURES_IMPLEMENTED.md` - Complete feature list

---

## ✅ Final Checklist

Before going live:

- [ ] Run COMPLETE_RESET.sql
- [ ] Create profile-photos bucket (PUBLIC)
- [ ] Run STORAGE_POLICIES.sql
- [ ] Create your admin account
- [ ] Test admin login
- [ ] Test verification flow
- [ ] Test message sending
- [ ] Test image upload
- [ ] Test report/block
- [ ] Set up weekly cleanup cron job
- [ ] Configure environment variables (.env.local)

---

## 🎉 You're Done!

Everything is ready. The app has:
- ✅ Complete user profiles with 15+ fields
- ✅ Profile completion tracking
- ✅ Verification system
- ✅ Full admin portal (separate)
- ✅ Message encryption
- ✅ Premium subscriptions
- ✅ Reports & moderation
- ✅ Image sharing
- ✅ Block/report features

**Next:** Just run the SQL and start managing your dating platform! 🚀
