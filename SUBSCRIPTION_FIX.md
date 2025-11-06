# Subscription Status Fix - Summary

## ❌ Problem Found

When you tried to create a location, you got **"No active subscription found"** even though you have a Pro subscription in the database.

### Root Cause

The `user_subscriptions` table has **TWO columns** for tracking status:
1. `status` (values: 'active', 'cancelled')
2. `is_active` (values: 0, 1)

**The Problem:**
- When creating subscriptions, the code only set `status = 'active'` 
- But the permission checker was looking for `is_active = 1`
- This caused a mismatch where subscriptions appeared inactive

Additionally:
- Wrong JOIN column: Used `plan_id` instead of `subscription_plan_id`
- Multiple active subscriptions per user (one Free, one Pro)

## ✅ Fixes Applied

### 1. Updated Permission Query (`lib/permissions.ts`)
```typescript
// OLD - Only checked is_active
WHERE us.user_id = ? AND us.is_active = 1

// NEW - Checks both status and is_active
WHERE us.user_id = ? AND (us.status = 'active' OR us.is_active = 1)
```

Also fixed the JOIN column from `plan_id` to `subscription_plan_id`.

### 2. Updated Subscription Creation Routes
All routes now set **BOTH** fields:

**Files Updated:**
- ✅ `app/api/auth/register/route.ts`
- ✅ `app/api/auth/google/callback/route.ts`
- ✅ `app/api/subscriptions/change/route.ts`

**Change:**
```sql
-- OLD
INSERT INTO user_subscriptions (..., status, ...)
VALUES (..., 'active', ...)

-- NEW (sets both fields)
INSERT INTO user_subscriptions (..., status, is_active, ...)
VALUES (..., 'active', 1, ...)
```

### 3. Created Database Fix Scripts

#### `database/fix_subscription_status.sql`
Comprehensive script that:
- ✅ Syncs `status` and `is_active` columns
- ✅ Ensures only ONE active subscription per user
- ✅ Deactivates duplicate subscriptions
- ✅ Shows verification query at the end

#### `database/activate_pro_subscription.sql`
Quick script to manually activate Pro subscription for a specific user.

## 🚀 How to Fix Your Database

### Option 1: Run Comprehensive Fix (Recommended)

**Run in phpMyAdmin:**
```sql
-- Copy and paste the entire content of:
database/fix_subscription_status.sql
```

This will:
1. Fix all existing subscriptions
2. Ensure only one active subscription per user
3. Sync both status columns
4. Show you the results

### Option 2: Manual Fix for Your User

**Step-by-step in phpMyAdmin:**

```sql
-- 1. Find your user ID
SELECT id, email FROM users WHERE email = 'your@email.com';

-- 2. Find Pro plan ID
SELECT id, name FROM subscription_plans WHERE slug = 'pro';

-- 3. Cancel all your current subscriptions
UPDATE user_subscriptions 
SET status = 'cancelled', is_active = 0, ends_at = NOW()
WHERE user_id = YOUR_USER_ID;

-- 4. Create new Pro subscription
INSERT INTO user_subscriptions 
  (user_id, subscription_plan_id, status, is_active, starts_at, created_at, updated_at)
VALUES 
  (YOUR_USER_ID, PRO_PLAN_ID, 'active', 1, NOW(), NOW(), NOW());

-- 5. Verify
SELECT * FROM user_subscriptions WHERE user_id = YOUR_USER_ID;
```

### Option 3: Quick Fix (If you know your user ID)

```sql
-- Assuming your user_id is 1 and Pro plan id is 2
UPDATE user_subscriptions 
SET status = 'cancelled', is_active = 0 
WHERE user_id = 1;

INSERT INTO user_subscriptions 
  (user_id, subscription_plan_id, status, is_active, starts_at, created_at, updated_at)
VALUES 
  (1, 2, 'active', 1, NOW(), NOW(), NOW());
```

## 🔍 How to Verify the Fix

### Check Your Subscription via API
```bash
GET /api/subscription/permissions
Authorization: Bearer YOUR_TOKEN
```

Should return:
```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan_name": "Pro",
      "plan_slug": "pro",
      "is_active": true
    },
    "limits": {
      "max_locations": 3,
      "max_menus_per_location": 5,
      ...
    }
  }
}
```

### Check Database Directly
```sql
SELECT 
    us.id,
    u.email,
    sp.name as plan_name,
    us.status,
    us.is_active,
    us.created_at
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
WHERE u.email = 'your@email.com'
ORDER BY us.created_at DESC;
```

Should show:
- ✅ One row with `status = 'active'` AND `is_active = 1`
- ✅ `plan_name = 'Pro'`

## 📝 What Changed in Code

| File | Change |
|------|--------|
| `lib/permissions.ts` | Fixed JOIN column + checks both status fields |
| `app/api/auth/register/route.ts` | Sets both `status='active'` and `is_active=1` |
| `app/api/auth/google/callback/route.ts` | Sets both `status='active'` and `is_active=1` |
| `app/api/subscriptions/change/route.ts` | Sets both fields on create, clears both on cancel |

## 🎯 Prevention

All future subscriptions will now:
1. ✅ Set `status = 'active'` AND `is_active = 1` when active
2. ✅ Set `status = 'cancelled'` AND `is_active = 0` when cancelled
3. ✅ Permission checker accepts either field as valid

## 🧪 Test After Fixing

1. **Run the fix script** in phpMyAdmin
2. **Try creating a location** - should work now!
3. **Check quota** via `/api/subscription/permissions`
4. **Verify** you can create up to 3 locations (Pro limit)

## 💡 Why This Happened

The database schema has redundant columns (`status` and `is_active`). The code wasn't consistent about which one to use:
- **Register/Login:** Only set `status`
- **Permission Check:** Only checked `is_active`
- **Result:** Subscriptions appeared inactive even though they were active

**The fix ensures both columns are always in sync.**

## 📚 Additional Notes

- The permission system now tolerates either column being set
- Future code should set both for consistency
- Consider normalizing the database to use only one column
- The fix script handles all edge cases (multiple active subs, etc.)

---

**Next Step:** Run `database/fix_subscription_status.sql` in phpMyAdmin and try creating a location again!
