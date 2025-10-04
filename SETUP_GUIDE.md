# Dating App - Complete Setup Guide

## ✅ What's Been Implemented

### Navigation & Pages
- **Home** (`/home`) - Dashboard with stats, quick actions
- **Swipe** (`/swipe`) - Swipe through profiles (uses real data from database)
- **Matches** (`/matches`) - See your matches
- **Likes** (`/likes`) - See who likes you (Premium feature)
- **Messages** (`/messages`) - Chat with matches
- **Profile** (`/profile`) - Edit your profile & upload photos (up to 6)
- **Settings** (`/settings`) - Manage preferences, dark mode, notifications

### Features
✅ Authentication (Sign in/Sign up)
✅ Profile creation with photo upload (max 6 photos)
✅ Swipe functionality (works on PC with buttons)
✅ Match detection
✅ Real-time messaging
✅ Dark mode (Settings > Account)
✅ "See who likes you" (Premium feature)
✅ Empty states with "Find Match" buttons

### Redirects
✅ After login → `/home`
✅ After logout → `/` (landing page)
✅ Navigation only shows when logged in

---

## 🚀 Quick Start

### 1. Database Setup

**Run the SQL migration:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Open `/supabase/migrations/COMPLETE_RESET.sql`
5. Copy ALL contents and paste into SQL Editor
6. Click "Run"

### 2. Create Storage Bucket (CRITICAL!)

**Photo uploads won't work without this:**

1. In Supabase Dashboard, go to **Storage**
2. Click "**Create a new bucket**"
3. Name: **`profile-photos`** (exact name)
4. ✅ Check "**Public bucket**" (MUST be public!)
5. Click "**Create bucket**"

**Verify:**
- Go to Storage
- You should see "profile-photos" listed
- It should show as "Public"

### 3. Environment Variables

Make sure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run the App

```bash
npm install
npm run dev
```

---

## 📸 Photo Upload Troubleshooting

### If photo upload fails:

**Error: "Storage bucket not found"**
→ You didn't create the `profile-photos` bucket. See step 2 above.

**Error: "Failed to upload"**
→ Make sure the bucket is **Public**

**How to fix:**
1. Supabase Dashboard > Storage
2. Click on "profile-photos" bucket
3. Click Settings
4. Make sure "Public bucket" is enabled

---

## 🎨 User Flow

### New User
1. Lands on landing page
2. Clicks "Get Started"
3. Signs up with email/password
4. Redirected to `/home`
5. Complete profile at `/profile`
6. Start swiping at `/swipe`

### Returning User
1. Lands on landing page
2. Signs in
3. Redirected to `/home`
4. Can access all features via navigation

---

## 📱 Pages Overview

### `/home` - Dashboard
- Shows stats (matches, likes, messages)
- Quick action cards
- Activity feed

### `/swipe` - Discovery
- Swipe through profiles
- Like/Pass/Super Like buttons (works on PC!)
- Shows distance, interests
- Match notifications

### `/matches` - Your Matches
- Grid of matched profiles
- Click to message
- Empty state: "Start Swiping" button

### `/likes` - Who Likes You
- **Premium feature** - shows paywall for non-premium
- Shows who liked/super liked you
- Like back or pass

### `/messages` - Chat
- List of matches with conversations
- Real-time messaging
- Empty state: "Find Your Match" button

### `/profile` - Edit Profile
- Upload up to 6 photos
- Edit bio, interests, info
- Photo validation (5MB max, JPEG/PNG/WebP)

### `/settings` - Settings
- **Preferences:** Distance range, Age range, Privacy
- **Notifications:** Email, Push toggles
- **Premium:** Upgrade option
- **Account:** Email, Dark mode, Sign out

---

## 🐛 Common Issues

### 1. "Navigation not showing"
✅ Fixed - Navigation only shows when logged in

### 2. "Photo upload fails"
→ Create the `profile-photos` storage bucket (see step 2 above)

### 3. "No profiles to swipe"
→ Database is empty. Create test profiles or wait for users to sign up

### 4. "Dark mode not working"
→ Toggle in Settings > Account tab

### 5. "Can't see matches"
→ Need mutual likes to create a match

---

## 🎯 Testing Guide

### Test the Full Flow:

1. **Create 2 accounts** (use different browsers)
2. **Complete profiles** for both
3. **Upload photos** for both
4. **Swipe on each other**
5. **Match should trigger**
6. **Send messages**

### Test Features:
- ✅ Home dashboard shows stats
- ✅ Swipe works on PC with buttons
- ✅ Matches page shows matched users
- ✅ Messages page shows conversations
- ✅ Empty states show "Find Match" buttons
- ✅ Photo upload works (max 6)
- ✅ Dark mode toggles
- ✅ Settings save
- ✅ Sign out redirects to landing page

---

## 📝 Notes

- All pages use **real data from Supabase** (no more mock data)
- Premium features have paywalls
- Photo upload requires the storage bucket to exist
- Dark mode syncs with Settings page
- Navigation is responsive (mobile menu included)

---

## 🎉 You're Ready!

The app is production-ready. Just make sure:
1. ✅ SQL migrations are run
2. ✅ Storage bucket is created
3. ✅ Environment variables are set
4. ✅ App is running

Happy dating! 💕
