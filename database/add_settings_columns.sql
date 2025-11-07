-- Add settings columns for restaurant customization
-- Stores JSON configuration for ordering, loyalty, and other features

-- Add settings column to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS settings JSON NULL AFTER website;

-- Add settings column to menus table  
ALTER TABLE menus
ADD COLUMN IF NOT EXISTS settings JSON NULL AFTER image_url;

-- Example settings structure for locations:
-- {
--   "ordering": {
--     "enabled": true,
--     "requiresApproval": false
--   },
--   "loyalty": {
--     "enabled": true,
--     "required": false,
--     "label": "Member Number",
--     "placeholder": "Enter your member number",
--     "helpText": "Earn points with every order"
--   },
--   "branding": {
--     "showLogo": true,
--     "showTableNumber": true
--   }
-- }

-- Example: Configure loyalty for a specific location
UPDATE locations 
SET settings = JSON_OBJECT(
  'ordering', JSON_OBJECT('enabled', true),
  'loyalty', JSON_OBJECT(
    'enabled', true,
    'required', false,
    'label', 'Loyalty Card Number',
    'placeholder', 'Enter your card number',
    'helpText', 'Earn 10 points for every $1 spent'
  )
)
WHERE id = 1;  -- Replace with your location ID

-- Verify settings
SELECT id, name, settings FROM locations WHERE settings IS NOT NULL LIMIT 5;
SELECT id, name, settings FROM menus WHERE settings IS NOT NULL LIMIT 5;
