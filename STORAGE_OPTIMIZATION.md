# Storage Optimization Guide

## How We Optimize Storage to Prevent Free Tier Overuse

### 1. Image Compression ✅ Implemented

**What we do:**
- All uploaded photos are automatically compressed before upload
- Max dimensions: 1200x1200 pixels
- JPEG format at 80% quality
- Typically reduces file size by 60-80%

**Code location:** `app/onboarding/page.tsx` - `compressImage()` function

**Example:**
- Original: 5MB photo
- Compressed: ~500KB (10x smaller!)

### 2. Photo Limits ✅ Implemented

- **Max 6 photos per user**
- Prevents unlimited uploads
- Enforced in the UI

### 3. Message Encryption ✅ Implemented

**What we do:**
- Messages are encrypted using AES-GCM
- Provides security without significant storage overhead
- Stored as base64 (minimal size increase)

**Code location:** `lib/encryption.ts`

**To use:**
```typescript
import { encryptMessage, decryptMessage } from '@/lib/encryption';

// When sending
const encrypted = await encryptMessage("Hello!");
await sendMessage(matchId, userId, encrypted);

// When receiving
const decrypted = await decryptMessage(message.content);
```

### 4. Automatic Data Cleanup

**Message Retention:**
- Messages older than 90 days are automatically deleted
- Keeps recent conversations
- Dramatically reduces storage

**Orphaned Data Cleanup:**
- Removes likes/matches from deleted users
- Removes user settings with no user
- Runs weekly

**How to enable:**
1. Go to `/supabase/migrations/STORAGE_CLEANUP.sql`
2. Copy all contents
3. Run in Supabase SQL Editor
4. This creates the cleanup function

**Manual cleanup:**
```sql
SELECT cleanup_old_data();
```

### 5. Inactive User Removal (Optional)

Users with no activity for 180+ days can be removed:

```sql
DELETE FROM user_profiles
WHERE last_active < NOW() - INTERVAL '180 days';
```

⚠️ **Caution:** This permanently deletes user data!

## Storage Usage Monitoring

### Check Current Usage

Run these queries in Supabase SQL Editor:

```sql
-- Total messages
SELECT COUNT(*) FROM messages;

-- Top message senders
SELECT sender_id, COUNT(*) as count
FROM messages
GROUP BY sender_id
ORDER BY count DESC
LIMIT 10;

-- Users with most photos
SELECT full_name, array_length(photos, 1) as photo_count
FROM user_profiles
ORDER BY photo_count DESC
LIMIT 10;
```

### Supabase Dashboard

1. Go to **Settings** > **Billing**
2. Check "Database Size" and "Storage"
3. Monitor usage over time

## Recommended Cleanup Schedule

| Task | Frequency | Storage Saved |
|------|-----------|---------------|
| Delete old messages (90+ days) | Weekly | ~60% of message storage |
| Remove orphaned data | Weekly | ~10% of total storage |
| Clean up orphaned photos | Monthly | Varies |
| Remove inactive users | Quarterly | Varies |

## Free Tier Limits (Supabase)

- **Database:** 500MB
- **Storage:** 1GB
- **Monthly Active Users:** Unlimited
- **API Requests:** 500K/month

## Expected Usage

### With Optimizations:
- **100 users:** ~50MB database, ~200MB storage
- **500 users:** ~150MB database, ~600MB storage
- **1000 users:** ~300MB database, ~900MB storage

### Without Optimizations:
- **100 users:** ~200MB database, ~800MB storage
- **500 users:** ~800MB database, ~3GB storage (exceeds free tier!)

## Implementation Checklist

- [x] Image compression on upload
- [x] Photo limit (max 6)
- [x] Message encryption
- [ ] Run STORAGE_CLEANUP.sql in Supabase
- [ ] Set up weekly cleanup cron job
- [ ] Monitor storage usage monthly

## Setting Up Automated Cleanup

### Option 1: Manual (Run weekly)
```sql
SELECT cleanup_old_data();
```

### Option 2: Cron Job (Automatic)
1. Supabase Dashboard > Database > Cron Jobs
2. Create new job
3. Schedule: `0 0 * * 0` (every Sunday at midnight)
4. SQL: `SELECT cleanup_old_data();`

## Best Practices

1. **Compress images client-side** ✅ Done
2. **Limit media uploads** ✅ Done
3. **Delete old data** - Set up cleanup
4. **Monitor usage** - Check dashboard monthly
5. **Upgrade if needed** - When approaching limits

## Cost Savings

With these optimizations, you can support:
- **Before:** ~100-200 active users on free tier
- **After:** ~500-1000 active users on free tier

That's **5-10x more users** on the same storage! 🎉

## Need More Space?

If you exceed free tier limits:

**Supabase Pro:**
- $25/month
- 8GB database
- 100GB storage
- Much higher limits

Still cheaper than AWS S3 + RDS separately!

---

## Questions?

See [STORAGE_CLEANUP.sql](/supabase/migrations/STORAGE_CLEANUP.sql) for implementation details.
