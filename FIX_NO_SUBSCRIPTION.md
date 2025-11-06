# 🔧 Fix "No Active Subscription Found" Error

## Problem
You see: **"No active subscription found"** when trying to create a location.

## Cause
Your user has multiple subscription records in the database, but **none have `is_active = 1`**.

```
user_subscriptions table:
- Free plan (is_active = 0, status = 'canceled') ❌
- Pro plan  (is_active = 0, status = 'canceled') ❌

System needs: ONE subscription with is_active = 1 ✓
```

## 🚀 Quick Fix (Run in phpMyAdmin)

### Step 1: Open the SQL file
Use: `database/activate_pro_subscription.sql`

### Step 2: Replace YOUR email
Change `'your.email@example.com'` to your actual email address

### Step 3: Run these 3 queries in order:

**Query 1: Deactivate all old subscriptions**
```sql
UPDATE user_subscriptions us
JOIN users u ON us.user_id = u.id
SET 
  us.is_active = 0,
  us.status = 'canceled',
  us.updated_at = NOW()
WHERE u.email = 'YOUR_EMAIL_HERE';
```

**Query 2: Activate Pro subscription**
```sql
UPDATE user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.plan_id = sp.id
SET 
  us.is_active = 1,
  us.status = 'active',
  us.start_date = NOW(),
  us.updated_at = NOW()
WHERE u.email = 'YOUR_EMAIL_HERE'
  AND sp.slug = 'pro';
```

**Query 3: Verify it worked**
```sql
SELECT 
  u.email,
  sp.name as active_plan,
  us.status,
  us.is_active
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE u.email = 'YOUR_EMAIL_HERE'
  AND us.is_active = 1;
```

You should see:
```
active_plan: Pro
status: active
is_active: 1
```

## ✅ Done!

Now try creating a location again - it should work!

## 🔍 Troubleshooting

### If Query 2 updated 0 rows:
It means you don't have a Pro subscription record yet. Create one:

```sql
INSERT INTO user_subscriptions (user_id, plan_id, status, is_active, start_date, created_at, updated_at)
SELECT 
  u.id,
  (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1),
  'active',
  1,
  NOW(),
  NOW(),
  NOW()
FROM users u
WHERE u.email = 'YOUR_EMAIL_HERE';
```

### Check what subscriptions you have:
```sql
SELECT 
  us.id,
  sp.name as plan,
  us.status,
  us.is_active,
  CASE WHEN us.is_active = 1 THEN '✓ ACTIVE' ELSE '✗ Inactive' END
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE u.email = 'YOUR_EMAIL_HERE'
ORDER BY us.created_at DESC;
```

## 💡 How It Works

The permission system looks for:
```sql
SELECT * FROM user_subscriptions 
WHERE user_id = ? AND is_active = 1
```

**Only ONE subscription** should have `is_active = 1` at a time.

When you change plans:
1. Old plan: `is_active = 0, status = 'canceled'`
2. New plan: `is_active = 1, status = 'active'`

## 📁 Related Files

- `database/activate_pro_subscription.sql` - Easy email-based fix
- `database/fix_subscription_status.sql` - Detailed diagnostics
- `lib/permissions.ts` - Permission checker (will log the user_id with issue)

## 🎯 Remember

**Each user should have EXACTLY ONE active subscription at a time!**
