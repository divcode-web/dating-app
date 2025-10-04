# Admin Portal & Profile Verification Guide

## ✅ What's Been Implemented

### 1. Extended User Profiles
**New Optional Fields Added:**
- `ethnicity` - User's ethnicity
- `height` - Height in cm
- `education` - Education level
- `occupation` - Job/profession
- `smoking` - Smoking habits (never, occasionally, regularly)
- `drinking` - Drinking habits (never, occasionally, regularly)
- `religion` - Religious beliefs
- `relationship_type` - What they're looking for
- `looking_for[]` - Array of relationship goals
- `languages[]` - Languages spoken
- `children` - Children status/preference

**Verification Fields:**
- `is_verified` - Boolean flag
- `verification_status` - unverified, pending, verified, rejected
- `verification_video_url` - URL to verification video
- `verification_submitted_at` - Timestamp
- `verified_at` - When verification was approved

### 2. Profile Completion System
**Automatic Calculation:**
- SQL function: `calculate_profile_completion(user_id)`
- Returns percentage (0-100%)
- Weights:
  - Required fields: name, DOB, gender (3 points)
  - Bio >20 chars (1 point)
  - 3+ photos (2 points)
  - Each optional field (1 point each)
  - Verification (2 bonus points)
- **Visual indicator** on profile page showing completion %

### 3. Verification System

#### User Side (`/profile/verify`)
- **Video upload interface**
- Instructions for users:
  - Record 5-10 second video
  - Show ID or make peace sign
  - Say "I'm verifying my profile for [Name]"
  - Clear face visibility required
  - Max 50MB video
- **Status tracking:**
  - Unverified: Show "Get Verified" CTA
  - Pending: Show "Under Review" message
  - Verified: Show ✓ badge

#### Admin Side
- **Review interface** at `/admin/dashboard`
- Watch verification videos
- Approve or reject with one click
- Updates user's verification status

### 4. Admin Portal (Completely Separate)

#### Access Control
**Location:** `/admin/login` and `/admin/dashboard`
**Authentication:** Separate from user app
- Only users in `admin_users` table can access
- Admin login required at `/admin/login`
- Automatic redirect if not admin
- Sign out returns to admin login

#### Admin Dashboard Features

**📊 Analytics Dashboard:**
- Total users count
- Premium users & conversion rate
- Verified users count
- Pending verifications
- Total reports & pending count
- Today's signups

**🚩 Reports Management:**
- View all user reports
- Filter by status (pending, resolved, dismissed)
- See reporter & reported user
- Read report reason
- Actions:
  - Resolve report
  - Dismiss report
  - Track who reviewed (reviewed_by field)
  - Add admin notes

**✓ Verification Review:**
- View pending verification videos
- See user's name and photos
- Watch verification video
- Approve or reject
- Automatic status updates

**🎨 UI Design:**
- Dark purple/slate theme
- Distinct from user app
- Professional admin aesthetic
- Real-time stats

### 5. Profile Page Enhancements

#### For Own Profile (`/profile`)
- **Profile completion circle** (SVG progress ring)
- Shows percentage with gradient
- "Get Verified" CTA card
- Verified badge ✓ when approved
- "Verification Pending" status card

#### For Viewing Others (`/profile?userId=xxx`)
- View other user's profile
- See verified badge ✓
- View all their photos
- See optional fields (occupation, education, etc.)
- Interests displayed as tags

## 🔧 Setup Instructions

### Step 1: Run Updated SQL Migration

```sql
-- Run this in Supabase SQL Editor
-- File: /supabase/migrations/COMPLETE_RESET.sql
```

This creates:
- Extended `user_profiles` columns
- `admin_users` table
- Updated `reports` table with admin fields
- `calculate_profile_completion()` function
- All necessary indexes and RLS policies

### Step 2: Create Your Admin Account

1. **First, sign up as a regular user:**
   - Go to `/auth`
   - Create account with your email
   - Complete onboarding

2. **Get your user ID:**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

3. **Add yourself as admin:**
   ```sql
   INSERT INTO admin_users (id, role, permissions)
   VALUES ('your-user-id-here', 'super_admin', ARRAY['all']);
   ```

   Replace `'your-user-id-here'` with your actual UUID from step 2.

4. **Verify admin access:**
   - Log out from user app
   - Go to `/admin/login`
   - Log in with same credentials
   - You should see admin dashboard

### Step 3: Create Storage Bucket (if not exists)

```sql
-- In Supabase Dashboard > Storage
-- Create bucket: profile-photos (PUBLIC)
-- Then run storage policies SQL
```

## 📱 User Flow

### Profile Verification Flow
1. User goes to `/profile`
2. Sees "Get Verified" card (if not verified)
3. Clicks "Verify Now" → `/profile/verify`
4. Records verification video
5. Uploads video (max 50MB)
6. Status changes to "pending"
7. Admin reviews at `/admin/dashboard`
8. Admin approves/rejects
9. User sees verified badge ✓ on profile

### Profile Completion
- Automatic calculation on profile load
- Visual circle shows percentage
- Encourages users to complete optional fields
- Higher completion = better matches

## 🎯 Features By URL

### User App
- `/profile` - Own profile with completion % and verification
- `/profile?userId=xxx` - View other user's profile
- `/profile/verify` - Upload verification video
- `/settings` - App settings

### Admin Portal
- `/admin/login` - Admin authentication
- `/admin/dashboard` - Main admin interface
  - Reports tab
  - Verifications tab
  - Analytics overview

## 🔐 Security & Permissions

### Admin RLS Policies
```sql
-- Only admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Only super admins can manage admins
CREATE POLICY "Super admins can manage admins"
  ON admin_users FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'));
```

### Admin Roles
- `admin` - Can review reports and verifications
- `super_admin` - Can do everything + manage other admins

## 📊 Database Schema Additions

### admin_users Table
```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT DEFAULT 'admin',
    permissions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
```

### Extended user_profiles
- 11 new optional fields
- 4 verification fields
- All indexed for performance

### Updated reports Table
- `admin_notes` - Admin can add notes
- `reviewed_by` - Tracks which admin reviewed
- `reviewed_at` - When it was reviewed

## 🎨 UI Components

### Profile Completion Circle
```jsx
{/* SVG circle showing completion % */}
<div className="relative w-24 h-24">
  <svg className="w-24 h-24 transform -rotate-90">
    <circle r="40" stroke="#e5e7eb" />
    <circle r="40" stroke="url(#gradient)"
      strokeDashoffset={/* calculated based on % */} />
  </svg>
  <div className="absolute inset-0">
    <span>{completionPercentage}%</span>
  </div>
</div>
```

### Verified Badge
```jsx
{profileData.is_verified && (
  <span className="text-2xl" title="Verified">✓</span>
)}
```

## 🚀 Next Steps

### For You (Admin):
1. Run COMPLETE_RESET.sql
2. Create admin account
3. Test admin login at `/admin/login`
4. Test user verification flow

### Future Enhancements:
- AI-powered verification video analysis
- Email notifications for verification status
- Admin activity logs
- Bulk user actions
- Advanced analytics charts
- Report categories and filters

## ⚠️ Important Notes

1. **Admin and User are separate** - Admin uses `/admin/*` routes, users use regular routes
2. **Verification videos** stored in same `profile-photos` bucket
3. **Profile completion** calculated in real-time via SQL function
4. **Verified badge** shows as ✓ emoji throughout the app
5. **Admin access** strictly controlled via `admin_users` table

## 🐛 Troubleshooting

**Can't access admin dashboard?**
- Verify you're in `admin_users` table
- Try logging out and back in at `/admin/login`

**Profile completion not showing?**
- Make sure SQL function was created
- Check browser console for errors

**Verification upload fails?**
- Check video is under 50MB
- Ensure storage bucket exists
- Verify storage policies are set

## 📝 File Structure

```
app/
├── admin/
│   ├── login/page.tsx          # Admin login page
│   └── dashboard/page.tsx      # Admin dashboard
├── profile/
│   ├── page.tsx                # Profile view (own + others)
│   └── verify/page.tsx         # Verification upload
supabase/migrations/
└── COMPLETE_RESET.sql          # Full database schema
```

---

**Everything is ready to use!** Just run the SQL and create your admin account.
