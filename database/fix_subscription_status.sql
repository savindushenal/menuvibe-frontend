-- Fix Subscription Status Inconsistencies
-- This script ensures user_subscriptions table has consistent status values

-- Step 1: Update all subscriptions that have status='active' but is_active is NULL or 0
UPDATE user_subscriptions 
SET is_active = 1 
WHERE status = 'active' AND (is_active IS NULL OR is_active = 0);

-- Step 2: Update all subscriptions that have is_active=1 but status is not 'active'
UPDATE user_subscriptions 
SET status = 'active' 
WHERE is_active = 1 AND (status IS NULL OR status != 'active');

-- Step 3: Ensure cancelled/inactive subscriptions are consistent
UPDATE user_subscriptions 
SET is_active = 0 
WHERE status = 'cancelled' AND is_active = 1;

-- Step 4: For each user, ensure only ONE subscription is active
-- First, create a temporary table with the latest active subscription per user
CREATE TEMPORARY TABLE IF NOT EXISTS latest_active_subs AS
SELECT 
    user_id,
    MAX(id) as latest_sub_id
FROM user_subscriptions
WHERE status = 'active' OR is_active = 1
GROUP BY user_id;

-- Deactivate all but the latest subscription for each user
UPDATE user_subscriptions us
LEFT JOIN latest_active_subs las ON us.id = las.latest_sub_id
SET 
    us.status = 'cancelled',
    us.is_active = 0,
    us.ends_at = NOW()
WHERE 
    (us.status = 'active' OR us.is_active = 1)
    AND las.latest_sub_id IS NULL;

-- Drop temporary table
DROP TEMPORARY TABLE IF EXISTS latest_active_subs;

-- Step 5: Verify the fixes - show active subscriptions
SELECT 
    us.id,
    us.user_id,
    u.email,
    sp.name as plan_name,
    sp.slug as plan_slug,
    us.status,
    us.is_active,
    us.created_at,
    us.starts_at,
    us.ends_at
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
WHERE us.status = 'active' OR us.is_active = 1
ORDER BY us.user_id, us.created_at DESC;
