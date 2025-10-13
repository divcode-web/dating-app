# Premium Badge Setup Guide

This guide explains how to set up the premium badge system so that users who redeem promotional codes will see the premium badge on their profiles and in swipe cards.

## Problem Fixed

When users redeemed promotional codes, they received the subscription tier but the premium badge wasn't showing because the `is_premium` field wasn't being set to `TRUE`.

## Solution Implemented

### 1. Updated Promotional Code Redemption Function

**File**: `supabase/migrations/ADD_PROMOTIONAL_CODES.sql`

The `redeem_promo_code` function now sets three fields when a promo is redeemed:
- `subscription_tier_id` - The tier from the promo code (basic_monthly, standard_3month, premium_yearly)
- `subscription_expires_at` - When the promo expires
- `is_premium` - Set to `TRUE` to show the premium badge

### 2. Created Expiration Handler

**File**: `supabase/migrations/HANDLE_EXPIRED_PROMOS.sql`

This migration includes:
- A `check_expired_promos()` function that resets expired promo users back to free tier
- A view `user_profiles_with_valid_status` that automatically checks promo validity
- Automatic cleanup of expired promotional subscriptions

## How to Run the Migrations

### Step 1: Update Existing Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Update the redeem_promo_code function to set is_premium flag
CREATE OR REPLACE FUNCTION redeem_promo_code(
  p_user_id UUID,
  p_code VARCHAR(50)
)
RETURNS JSON AS $$
DECLARE
  v_promo_id UUID;
  v_tier_id VARCHAR(50);
  v_duration_days INTEGER;
  v_max_uses INTEGER;
  v_current_uses INTEGER;
  v_valid_from TIMESTAMP WITH TIME ZONE;
  v_valid_until TIMESTAMP WITH TIME ZONE;
  v_active BOOLEAN;
  v_already_redeemed BOOLEAN;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get promo code details
  SELECT id, tier_id, duration_days, max_uses, current_uses, valid_from, valid_until, active
  INTO v_promo_id, v_tier_id, v_duration_days, v_max_uses, v_current_uses, v_valid_from, v_valid_until, v_active
  FROM promotional_codes
  WHERE code = UPPER(p_code);

  -- Check if code exists
  IF v_promo_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Invalid promo code'
    );
  END IF;

  -- Check if code is active
  IF NOT v_active THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'This promo code is no longer active'
    );
  END IF;

  -- Check if code is within valid date range
  IF NOW() < v_valid_from OR (v_valid_until IS NOT NULL AND NOW() > v_valid_until) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'This promo code has expired'
    );
  END IF;

  -- Check if max uses reached
  IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'This promo code has reached its maximum number of uses'
    );
  END IF;

  -- Check if user already redeemed this code
  SELECT EXISTS(
    SELECT 1 FROM promo_redemptions
    WHERE user_id = p_user_id AND promo_code_id = v_promo_id
  ) INTO v_already_redeemed;

  IF v_already_redeemed THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'You have already redeemed this promo code'
    );
  END IF;

  -- Calculate expiration date
  v_expires_at := NOW() + (v_duration_days || ' days')::INTERVAL;

  -- Create redemption record
  INSERT INTO promo_redemptions (user_id, promo_code_id, expires_at)
  VALUES (p_user_id, v_promo_id, v_expires_at);

  -- Increment usage count
  UPDATE promotional_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = v_promo_id;

  -- Update user's subscription tier, expiry, and premium status
  UPDATE user_profiles
  SET subscription_tier_id = v_tier_id,
      subscription_expires_at = v_expires_at,
      is_premium = TRUE,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', TRUE,
    'tier_id', v_tier_id,
    'expires_at', v_expires_at,
    'message', 'Promo code redeemed successfully!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: Add Expiration Handler

Run the contents of `supabase/migrations/HANDLE_EXPIRED_PROMOS.sql`:

```sql
-- Copy and paste the entire content from HANDLE_EXPIRED_PROMOS.sql
```

### Step 3: Fix Existing Users (If Any Already Redeemed)

If you have users who already redeemed promo codes but don't have `is_premium` set:

```sql
-- Update existing promo users to have premium badge
UPDATE user_profiles
SET is_premium = TRUE
WHERE subscription_tier_id IN ('basic_monthly', 'standard_3month', 'premium_yearly')
  AND subscription_expires_at > NOW()
  AND (is_premium IS NULL OR is_premium = FALSE);
```

## Where the Premium Badge Shows

The premium badge will now appear in:

1. **User Profile Page** - Crown icon on profile picture ([app/profile/page.tsx:144-148](app/profile/page.tsx#L144-L148))
2. **Swipe Cards** - Will show when profile data includes `is_premium: true`
3. **Messages/Chat** - Admin messages show sender premium status
4. **Matches List** - Shows in match profiles

## How It Works

### When User Redeems Promo Code:

1. User enters promo code
2. `redeem_promo_code()` function validates the code
3. If valid, updates user profile:
   - Sets `subscription_tier_id` to the promo tier (e.g., "basic_monthly")
   - Sets `subscription_expires_at` to NOW + duration days
   - **Sets `is_premium = TRUE`** ← This shows the badge!
4. Premium badge components check `is_premium` field and display crown icon

### When Promo Expires:

You have two options:

**Option A: Manual Cleanup (Run periodically)**
```sql
SELECT check_expired_promos();
```

**Option B: Automatic with pg_cron (Recommended)**
Enable pg_cron extension in Supabase, then:
```sql
SELECT cron.schedule('check-expired-promos', '0 0 * * *', 'SELECT check_expired_promos()');
```

## Testing the Premium Badge

1. **Create a Test Promo Code:**
   ```sql
   INSERT INTO promotional_codes (
     code,
     tier_id,
     duration_days,
     max_uses,
     description,
     active
   ) VALUES (
     'TESTBADGE',
     'basic_monthly',
     3,
     100,
     'Test promo for badge testing',
     true
   );
   ```

2. **Redeem the Code** in your app settings/premium page

3. **Check Your Profile:**
   - Go to `/profile` - You should see a crown badge on your profile picture
   - Have another user view your profile - They should see your crown
   - Check the swipe deck - Your card should show the premium indicator

4. **Verify in Database:**
   ```sql
   SELECT id, full_name, subscription_tier_id, is_premium, subscription_expires_at
   FROM user_profiles
   WHERE subscription_tier_id != 'free';
   ```

## Troubleshooting

### Badge Not Showing After Redeeming Promo?

**Check 1**: Is `is_premium` set?
```sql
SELECT id, full_name, is_premium, subscription_tier_id
FROM user_profiles
WHERE id = 'YOUR_USER_ID';
```

**Check 2**: Run the updated function
```sql
-- Copy the entire CREATE OR REPLACE FUNCTION redeem_promo_code from Step 1 above
```

**Check 3**: Manually set for testing
```sql
UPDATE user_profiles
SET is_premium = TRUE
WHERE id = 'YOUR_USER_ID';
```

### Badge Shows for Expired Promo?

Run the expiration check:
```sql
SELECT check_expired_promos();
```

## Premium Badge Component

The badge uses different colors for different tiers:

- **Basic Monthly** - Pink/Rose gradient (`from-pink-500 to-rose-600`)
- **Standard 3-Month** - Purple/Indigo gradient (`from-purple-500 to-indigo-600`)
- **Premium VIP** - Yellow/Amber gradient (`from-yellow-500 to-amber-600`)

Component location: [`components/premium-badge.tsx`](components/premium-badge.tsx)

## Summary

After running these migrations:
- ✅ Users redeeming promo codes will get `is_premium = TRUE`
- ✅ Premium crown badge will show on their profile
- ✅ Other users will see their premium status in swipe cards
- ✅ Expired promos can be cleaned up automatically
- ✅ "See Who Likes You" feature is available in Basic tier
- ✅ Read receipts (double-tick) work for premium users

Run Step 1 and Step 2 SQL in your Supabase dashboard, then test with a promo code!
