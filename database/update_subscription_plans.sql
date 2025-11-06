-- Update Subscription Plans with Recommended Structure
-- Run this SQL to update your subscription plans

-- Update FREE Plan
UPDATE subscription_plans 
SET 
  description = 'Perfect for trying out MenuVibe',
  features = JSON_ARRAY(
    '1 location',
    '1 menu per location',
    'Up to 30 menu items',
    'Basic QR codes (1 per location)',
    'Mobile responsive design',
    'Community support'
  ),
  limits = JSON_OBJECT(
    'max_locations', 1,
    'max_menus_per_location', 1,
    'max_menu_items_total', 30,
    'max_qr_codes', 1,
    'photo_uploads', false,
    'custom_qr_codes', false,
    'table_specific_qr', false,
    'analytics', false,
    'online_ordering', false,
    'priority_support', false
  )
WHERE slug = 'free';

-- Update PRO Plan
UPDATE subscription_plans 
SET 
  description = 'Best for single restaurants',
  price = 29.00,
  features = JSON_ARRAY(
    'Up to 3 locations',
    'Up to 5 menus per location',
    'Unlimited menu items',
    'Unlimited QR codes with table numbers',
    'Photo uploads for menu items',
    'Custom QR code designs',
    'Real-time analytics dashboard',
    'Menu customization (colors, themes)',
    'Online ordering (basic)',
    'Priority email support'
  ),
  limits = JSON_OBJECT(
    'max_locations', 3,
    'max_menus_per_location', 5,
    'max_menu_items_total', -1,
    'max_qr_codes', -1,
    'photo_uploads', true,
    'custom_qr_codes', true,
    'table_specific_qr', true,
    'analytics', true,
    'online_ordering', true,
    'priority_support', true
  )
WHERE slug = 'pro';

-- Update ENTERPRISE Plan
UPDATE subscription_plans 
SET 
  description = 'For restaurant chains and multi-location businesses',
  price = 99.00,
  features = JSON_ARRAY(
    'Up to 10 locations',
    'Unlimited menus per location',
    'Unlimited menu items',
    'Unlimited QR codes',
    'Everything in Pro',
    'Advanced analytics & reports',
    'API access',
    'White-label options',
    'Custom integrations',
    'Dedicated account manager',
    'Phone & chat support',
    'Custom training'
  ),
  limits = JSON_OBJECT(
    'max_locations', 10,
    'max_menus_per_location', -1,
    'max_menu_items_total', -1,
    'max_qr_codes', -1,
    'photo_uploads', true,
    'custom_qr_codes', true,
    'table_specific_qr', true,
    'analytics', true,
    'advanced_analytics', true,
    'online_ordering', true,
    'api_access', true,
    'white_label', true,
    'priority_support', true,
    'dedicated_support', true
  )
WHERE slug = 'enterprise';

-- Update CUSTOM ENTERPRISE Plan
UPDATE subscription_plans 
SET 
  description = 'Tailored solution for large restaurant chains and franchises',
  price = 0.00,
  billing_period = 'custom',
  contract_months = 12,
  features = JSON_ARRAY(
    'Unlimited locations',
    'Unlimited menus and items',
    'Unlimited QR codes',
    'Full white-label branding',
    'Custom integrations',
    'SLA guarantee (99.9% uptime)',
    'Dedicated infrastructure',
    'Custom development',
    '24/7 priority support',
    'On-site training',
    'API access',
    'Advanced analytics'
  ),
  limits = JSON_OBJECT(
    'max_locations', -1,
    'max_menus_per_location', -1,
    'max_menu_items_total', -1,
    'max_qr_codes', -1,
    'photo_uploads', true,
    'custom_qr_codes', true,
    'table_specific_qr', true,
    'analytics', true,
    'advanced_analytics', true,
    'online_ordering', true,
    'api_access', true,
    'white_label', true,
    'priority_support', true,
    'dedicated_support', true,
    'sla_guarantee', true,
    'custom_integrations', true
  ),
  custom_features = 'Fully customizable solution with dedicated support team',
  custom_limits = JSON_OBJECT(
    'custom_pricing', true,
    'volume_discounts', true,
    'flexible_billing', true
  )
WHERE slug = 'custom-enterprise';

-- Verify the updates
SELECT 
  id, 
  name, 
  slug, 
  price, 
  billing_period,
  description,
  features,
  limits,
  is_active
FROM subscription_plans
ORDER BY sort_order;
