# Subscription System Fixes - Summary

## 🐛 Issues Fixed

### 1. **Database Column Name Mismatch**
**Error:** `Unknown column 'us.plan_id' in 'ON'`

**Root Cause:** The permissions system was using `plan_id` but the actual database column is `subscription_plan_id`

**Fix:** Updated `lib/permissions.ts` to use correct column name:
```sql
-- Before (WRONG)
JOIN subscription_plans sp ON us.plan_id = sp.id

-- After (CORRECT)
JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
```

### 2. **"No Active Subscription Found" Error**
**Root Cause:** Multiple issues:
- User had canceled subscription but no active one
- Subscription status checking logic wasn't comprehensive
- No auto-fallback to Free plan

**Fix:** Implemented comprehensive solution:
1. **Check both `is_active` AND `status` fields**:
   ```sql
   WHERE (us.is_active = 1 OR us.status = 'active')
   ```

2. **Auto-create Free subscription** if none exists:
   - When permission check fails, automatically assigns Free plan
   - Deactivates old/cancelled subscriptions
   - Ensures every user always has an active subscription

### 3. **Status Field Confusion**
**Root Cause:** Database has both `status` (varchar) and `is_active` (tinyint) columns

**Fix:** Permission system now checks both:
```typescript
if (subscription.is_active !== 1 && subscription.status !== 'active') {
  return null; // Not active
}
```

## 📁 New Files Created

### 1. `/app/api/subscription/check/route.ts`
**Purpose:** Manually check/create subscriptions

**Endpoints:**
- `GET /api/subscription/check` - Check if user has subscription, auto-create Free if not
- `POST /api/subscription/check` - Manually activate a subscription plan

**Usage:**
```bash
# Check current subscription (auto-creates Free if none)
GET /api/subscription/check

# Manually activate a plan
POST /api/subscription/check
Body: { "plan_slug": "pro" }
```

## 🔧 Files Updated

### 1. `lib/permissions.ts`
**Changes:**
- ✅ Fixed database column name (`subscription_plan_id`)
- ✅ Added `getUserSubscriptionOrCreateFree()` function
- ✅ All permission checks now auto-create Free plan if needed
- ✅ Check both `is_active` and `status` fields
- ✅ Comprehensive error logging

**Key Functions:**
```typescript
// Now auto-creates Free plan if no subscription
canCreateLocation(userId)
canCreateMenu(userId, locationId)
canCreateMenuItem(userId)
canCreateQRCode(userId)
canAccessFeature(userId, feature)
```

## 🚀 How It Works Now

### Scenario 1: User Upgrades from Free to Pro
```
1. User clicks "Upgrade to Pro"
2. POST /api/subscriptions/change with plan_id
3. System:
   - Deactivates Free subscription (status = 'cancelled', is_active = 0)
   - Creates new Pro subscription (status = 'active', is_active = 1)
4. Next permission check uses new Pro subscription
```

### Scenario 2: User with Cancelled Subscription
```
1. User tries to create location
2. Permission check: canCreateLocation(userId)
3. No active subscription found
4. System auto-creates Free subscription
5. Permission check succeeds with Free limits
```

### Scenario 3: New User (No Subscription Yet)
```
1. User registers
2. No subscription created initially
3. User tries to create location
4. canCreateLocation() auto-creates Free subscription
5. User can proceed with Free plan limits
```

## 📊 Database Subscription States

### Valid Active Subscription
```sql
is_active = 1 AND status = 'active'
```

### Cancelled/Inactive Subscription  
```sql
is_active = 0 OR status IN ('cancelled', 'expired', 'suspended')
```

## 🧪 Testing

### Test 1: Check Current Subscription
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/subscription/check
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User has active subscription",
  "data": {
    "has_subscription": true,
    "subscription": {
      "plan_name": "Free",
      "plan_slug": "free"
    }
  }
}
```

### Test 2: Manually Activate Pro Plan
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan_slug": "pro"}' \
  http://localhost:3000/api/subscription/check
```

### Test 3: Create Location (Auto-creates Free if needed)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Location", "address_line_1": "123 Main", ...}' \
  http://localhost:3000/api/locations
```

## 🎯 What This Fixes

✅ **"No active subscription found"** error when creating locations
✅ **Column name mismatch** errors in production logs
✅ **Users with cancelled subscriptions** now get Free plan automatically
✅ **New users** automatically get Free plan on first action
✅ **Subscription upgrades** properly deactivate old plans

## 🔍 Debugging

### Check User's Active Subscription
```sql
SELECT 
  us.id,
  us.status,
  us.is_active,
  us.starts_at,
  us.ends_at,
  sp.name as plan_name,
  sp.slug as plan_slug
FROM user_subscriptions us
JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
WHERE us.user_id = YOUR_USER_ID
ORDER BY us.created_at DESC;
```

### Manually Fix User Subscription
```sql
-- Deactivate all old subscriptions
UPDATE user_subscriptions 
SET is_active = 0, status = 'cancelled'
WHERE user_id = YOUR_USER_ID;

-- Create new Free subscription
INSERT INTO user_subscriptions 
(user_id, subscription_plan_id, status, is_active, starts_at, created_at, updated_at)
SELECT 
  YOUR_USER_ID,
  sp.id,
  'active',
  1,
  NOW(),
  NOW(),
  NOW()
FROM subscription_plans sp
WHERE sp.slug = 'free';
```

## 📝 Summary

The subscription system is now **robust and self-healing**:

1. ✅ Automatically creates Free plan if none exists
2. ✅ Handles both `is_active` and `status` fields correctly
3. ✅ Uses correct database column names
4. ✅ Provides manual override endpoint for debugging
5. ✅ Comprehensive error logging

**You should no longer see "No active subscription found" errors!**
