-- Quick Script to Activate Pro Subscription for a User
-- Replace USER_EMAIL with the actual user email

-- Step 1: Find the user
SELECT id, email, name FROM users WHERE email = 'YOUR_EMAIL_HERE';
-- Copy the user ID from the result

-- Step 2: Find the Pro plan ID
SELECT id, name, slug, price FROM subscription_plans WHERE slug = 'pro';
-- Copy the plan ID from the result

-- Step 3: Deactivate all current subscriptions for this user
-- Replace USER_ID with the actual user ID from Step 1
UPDATE user_subscriptions 
SET status = 'cancelled', is_active = 0, ends_at = NOW()
WHERE user_id = USER_ID;

-- Step 4: Create new Pro subscription
-- Replace USER_ID and PRO_PLAN_ID with actual values from Steps 1 and 2
INSERT INTO user_subscriptions 
  (user_id, subscription_plan_id, status, is_active, starts_at, created_at, updated_at)
VALUES 
  (USER_ID, PRO_PLAN_ID, 'active', 1, NOW(), NOW(), NOW());

-- Step 5: Verify the subscription
SELECT 
    us.id,
    us.user_id,
    u.email,
    sp.name as plan_name,
    sp.slug,
    us.status,
    us.is_active,
    us.starts_at
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
WHERE us.user_id = USER_ID
ORDER BY us.created_at DESC;

-- EXAMPLE USAGE:
-- If user ID is 5 and Pro plan ID is 2:
/*
UPDATE user_subscriptions 
SET status = 'cancelled', is_active = 0, ends_at = NOW()
WHERE user_id = 5;

INSERT INTO user_subscriptions 
  (user_id, subscription_plan_id, status, is_active, starts_at, created_at, updated_at)
VALUES 
  (5, 2, 'active', 1, NOW(), NOW(), NOW());
*/
