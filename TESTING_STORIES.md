# Testing Guide - Stories Feature

## Prerequisites

Before testing, ensure:
- ✅ Database migration has been run (`ADD_STORIES_FEATURE.sql`)
- ✅ Storage bucket `stories` exists in Supabase
- ✅ You have at least 2 test accounts
- ✅ Test accounts are matched with each other

## Test Scenarios

### 1. Upload Story (Photo)

**Steps:**
1. Login as User A
2. Navigate to `/matches`
3. Click the "+" button (Your Story)
4. Click "Photo" option
5. Select an image file (< 50MB)
6. Add caption: "Testing photo story!"
7. Click "Share Story"

**Expected Result:**
- ✅ Upload progress shown
- ✅ Success message displayed
- ✅ Your story appears in ring with colorful gradient
- ✅ Story count shows (1)

**Error Cases to Test:**
- File > 50MB → Should show error
- Invalid file type → Should show error
- No file selected → Button disabled

---

### 2. Upload Story (Video)

**Steps:**
1. Click "+" button again
2. Click "Video" option
3. Select a video file (< 50MB)
4. Add caption: "Testing video story!"
5. Click "Share Story"

**Expected Result:**
- ✅ Video preview shown
- ✅ Upload successful
- ✅ Your story count increases to (2)

---

### 3. View Own Stories

**Steps:**
1. Click on your story avatar in the ring
2. Observe both stories

**Expected Result:**
- ✅ Full-screen viewer opens
- ✅ Progress bars show (2 bars)
- ✅ Stories auto-advance
- ✅ Can see viewer count (0)
- ✅ Can see delete button (trash icon)
- ✅ Can see viewers button (eye icon)

**Interactions to Test:**
- Tap left → Previous story
- Tap right → Next story
- Hold → Pause (progress stops)
- Release → Resume
- Click X → Close viewer

---

### 4. View Match's Stories

**Steps:**
1. Logout from User A
2. Login as User B (matched with User A)
3. Navigate to `/matches`
4. Observe User A's story in the ring

**Expected Result:**
- ✅ User A's avatar shows with colorful gradient (unviewed)
- ✅ Click to view stories

**Steps (continued):**
5. Click User A's story avatar
6. View all stories

**Expected Result:**
- ✅ Stories display correctly
- ✅ Video plays automatically
- ✅ Captions shown at bottom
- ✅ Auto-advances through stories
- ✅ No delete button (not your story)
- ✅ No viewers button (not your story)

---

### 5. Story View Tracking

**Steps:**
1. After viewing User A's stories as User B
2. Close viewer
3. Observe story ring

**Expected Result:**
- ✅ User A's avatar now has GRAY ring (viewed)

**Steps (continued):**
4. Logout and login as User A
5. View your story
6. Click eye icon (viewers)

**Expected Result:**
- ✅ Shows "Viewers (1)"
- ✅ User B's profile shown
- ✅ Timestamp shows "just now" or "1m ago"

---

### 6. Delete Story

**Steps:**
1. As User A, view your story
2. Click trash icon on first story
3. Confirm delete

**Expected Result:**
- ✅ Story immediately removed
- ✅ Viewer advances to next story
- ✅ Story count decreases
- ✅ File removed from storage

---

### 7. Multiple Users' Stories

**Setup:**
- Create User C, match with User A
- User B posts a story
- User C posts a story

**Steps:**
1. Login as User A
2. Navigate to `/matches`

**Expected Result:**
- ✅ Horizontal scrollable ring shows all stories
- ✅ Unviewed stories first (colorful gradient)
- ✅ Viewed stories after (gray)
- ✅ Can scroll horizontally through all avatars

**Steps (continued):**
3. Click through all stories

**Expected Result:**
- ✅ Auto-advances through users
- ✅ Shows all stories for each user
- ✅ Tap right/arrows to skip to next user
- ✅ Tap left/arrows to go back

---

### 8. Story Expiration (Manual Test)

**Steps:**
1. In Supabase SQL Editor, run:
```sql
-- Set a story to expire now
UPDATE stories
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE id = 'story-id-here';

-- Run expire function
SELECT expire_old_stories();
```

**Expected Result:**
- ✅ Story marked as inactive
- ✅ No longer appears in stories ring
- ✅ Cannot be viewed

---

### 9. Privacy Check

**Steps:**
1. Create User D (NOT matched with User A)
2. Login as User D
3. Try to access User A's story directly via API

```bash
curl -X GET "https://your-app.com/api/stories/matches" \
  -H "Authorization: Bearer user-d-token"
```

**Expected Result:**
- ✅ User A's stories NOT returned
- ✅ Only stories from User D's matches returned

---

### 10. Performance Test

**Steps:**
1. Create 10+ test users
2. Each posts 3 stories
3. Match all with User A
4. Login as User A
5. Navigate to `/matches`

**Expected Result:**
- ✅ Stories ring loads quickly
- ✅ Smooth horizontal scrolling
- ✅ Images load progressively
- ✅ No lag when viewing stories

---

## Database Verification

Run these queries in Supabase SQL Editor:

```sql
-- Check stories table
SELECT * FROM stories ORDER BY created_at DESC LIMIT 10;

-- Check story views
SELECT
  s.id,
  u.full_name as story_owner,
  COUNT(sv.id) as view_count
FROM stories s
LEFT JOIN user_profiles u ON u.id = s.user_id
LEFT JOIN story_views sv ON sv.story_id = s.id
GROUP BY s.id, u.full_name
ORDER BY s.created_at DESC;

-- Check storage bucket
SELECT * FROM storage.objects WHERE bucket_id = 'stories';

-- Verify RLS policies
SELECT * FROM stories WHERE user_id != auth.uid();
-- Should return ONLY stories from your matches

-- Check cron jobs
SELECT * FROM cron.job WHERE jobname LIKE '%stor%';
```

---

## Mobile Testing

Test on mobile devices/responsive mode:

### Portrait Mode
- ✅ Stories ring scrolls horizontally
- ✅ Story viewer fills screen
- ✅ Tap left/right to navigate
- ✅ Hold to pause works
- ✅ Swipe up for viewers panel

### Landscape Mode
- ✅ Story viewer adapts
- ✅ Navigation arrows visible
- ✅ All controls accessible

---

## Edge Cases

### Empty States
- No matches → Stories ring not shown (or shows only "Your Story")
- No stories from matches → Only "Your Story" shown
- Own story expired → Can still add new story

### Error Handling
- Network error during upload → Error message shown
- File too large → Prevented before upload
- Invalid token → Redirected to login
- Story deleted while viewing → Gracefully handled

### Concurrent Actions
- Two users view same story → Both views recorded
- User deletes story while being viewed → Viewer sees error/closure
- Upload while viewing → Both work independently

---

## Cleanup After Testing

```sql
-- Delete test stories
DELETE FROM stories WHERE user_id IN ('user-a-id', 'user-b-id', 'user-c-id');

-- Delete test files from storage (do via Supabase Dashboard)
```

---

## Common Issues & Solutions

### Stories not appearing
- Check matches exist
- Verify story hasn't expired
- Check RLS policies

### Upload fails
- Check Supabase storage quota
- Verify CORS settings
- Check file size/format

### Cron jobs not running
```sql
-- Manually trigger
SELECT expire_old_stories();
SELECT cleanup_expired_stories();
```

### Performance issues
```sql
-- Check indexes exist
SELECT * FROM pg_indexes WHERE tablename = 'stories';
SELECT * FROM pg_indexes WHERE tablename = 'story_views';
```

---

## Success Criteria

All tests pass when:
- ✅ Stories upload successfully
- ✅ Only matches can view each other's stories
- ✅ View tracking works correctly
- ✅ Stories expire after 24 hours
- ✅ Delete works immediately
- ✅ UI is smooth and responsive
- ✅ Privacy/security enforced by RLS
- ✅ No memory leaks or performance issues
