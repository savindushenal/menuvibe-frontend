-- Add custom order fields for POS integration
-- Allows restaurants to define custom form fields for orders

-- Add custom_fields column to orders table to store dynamic field values
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS custom_fields JSON NULL AFTER notes;

-- Add order_form_config to locations table for custom field definitions
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS order_form_config JSON NULL AFTER settings;

-- Example order form configuration:
-- {
--   "fields": [
--     {
--       "id": "delivery_address",
--       "type": "textarea",
--       "label": "Delivery Address",
--       "placeholder": "Enter full delivery address",
--       "required": true,
--       "enabled": true,
--       "order": 1
--     },
--     {
--       "id": "delivery_time",
--       "type": "select",
--       "label": "Preferred Delivery Time",
--       "options": ["ASAP", "30 minutes", "1 hour", "2 hours"],
--       "required": false,
--       "enabled": true,
--       "order": 2
--     },
--     {
--       "id": "payment_method",
--       "type": "radio",
--       "label": "Payment Method",
--       "options": ["Cash on Delivery", "Card on Delivery", "Online Payment"],
--       "required": true,
--       "enabled": true,
--       "order": 3
--     },
--     {
--       "id": "company_name",
--       "type": "text",
--       "label": "Company Name (Optional)",
--       "placeholder": "For corporate orders",
--       "required": false,
--       "enabled": true,
--       "order": 4
--     },
--     {
--       "id": "special_instructions",
--       "type": "textarea",
--       "label": "Special Instructions",
--       "placeholder": "Allergies, preferences, etc.",
--       "required": false,
--       "enabled": true,
--       "order": 5
--     },
--     {
--       "id": "pos_customer_id",
--       "type": "text",
--       "label": "Customer ID",
--       "placeholder": "Existing customer ID",
--       "required": false,
--       "enabled": false,
--       "hidden": true,
--       "order": 6
--     }
--   ],
--   "defaultFields": {
--     "customerName": {"enabled": true, "required": true, "label": "Full Name"},
--     "customerPhone": {"enabled": true, "required": true, "label": "Phone Number"},
--     "customerEmail": {"enabled": true, "required": false, "label": "Email Address"}
--   }
-- }

-- Example: Configure custom fields for a restaurant with delivery
UPDATE locations 
SET order_form_config = JSON_OBJECT(
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'id', 'delivery_address',
      'type', 'textarea',
      'label', 'Delivery Address',
      'placeholder', 'Street address, building, apartment',
      'required', true,
      'enabled', true,
      'order', 1
    ),
    JSON_OBJECT(
      'id', 'delivery_time',
      'type', 'select',
      'label', 'Delivery Time',
      'options', JSON_ARRAY('ASAP', 'In 30 minutes', 'In 1 hour', 'In 2 hours'),
      'required', true,
      'enabled', true,
      'order', 2
    ),
    JSON_OBJECT(
      'id', 'payment_method',
      'type', 'radio',
      'label', 'Payment Method',
      'options', JSON_ARRAY('Cash', 'Card on Delivery', 'UPI'),
      'required', true,
      'enabled', true,
      'order', 3
    )
  ),
  'defaultFields', JSON_OBJECT(
    'customerName', JSON_OBJECT('enabled', true, 'required', true, 'label', 'Full Name'),
    'customerPhone', JSON_OBJECT('enabled', true, 'required', true, 'label', 'Phone Number'),
    'customerEmail', JSON_OBJECT('enabled', true, 'required', false, 'label', 'Email Address')
  )
)
WHERE id = 1;  -- Replace with your location ID

-- Example: Hotel/Resort configuration with room service
UPDATE locations 
SET order_form_config = JSON_OBJECT(
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'id', 'room_number',
      'type', 'text',
      'label', 'Room Number',
      'placeholder', 'e.g., 305',
      'required', true,
      'enabled', true,
      'order', 1
    ),
    JSON_OBJECT(
      'id', 'guest_name',
      'type', 'text',
      'label', 'Guest Name',
      'placeholder', 'Name on reservation',
      'required', true,
      'enabled', true,
      'order', 2
    ),
    JSON_OBJECT(
      'id', 'delivery_preference',
      'type', 'radio',
      'label', 'Delivery Preference',
      'options', JSON_ARRAY('Deliver to room', 'Pickup from restaurant'),
      'required', true,
      'enabled', true,
      'order', 3
    )
  ),
  'defaultFields', JSON_OBJECT(
    'customerName', JSON_OBJECT('enabled', false, 'required', false),
    'customerPhone', JSON_OBJECT('enabled', true, 'required', true, 'label', 'Contact Number'),
    'customerEmail', JSON_OBJECT('enabled', false, 'required', false)
  )
)
WHERE name = 'Beach Resort Main Restaurant';

-- Example: Corporate cafeteria with employee ID
UPDATE locations 
SET order_form_config = JSON_OBJECT(
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'id', 'employee_id',
      'type', 'text',
      'label', 'Employee ID',
      'placeholder', 'Your employee number',
      'required', true,
      'enabled', true,
      'order', 1
    ),
    JSON_OBJECT(
      'id', 'department',
      'type', 'select',
      'label', 'Department',
      'options', JSON_ARRAY('Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'),
      'required', true,
      'enabled', true,
      'order', 2
    ),
    JSON_OBJECT(
      'id', 'pickup_time',
      'type', 'radio',
      'label', 'Pickup Time',
      'options', JSON_ARRAY('12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM'),
      'required', true,
      'enabled', true,
      'order', 3
    )
  ),
  'defaultFields', JSON_OBJECT(
    'customerName', JSON_OBJECT('enabled', true, 'required', true, 'label', 'Employee Name'),
    'customerPhone', JSON_OBJECT('enabled', true, 'required', false, 'label', 'Extension'),
    'customerEmail', JSON_OBJECT('enabled', false, 'required', false)
  )
)
WHERE name = 'Corporate Cafeteria';

-- Verify configurations
SELECT 
  id,
  name,
  order_form_config
FROM locations 
WHERE order_form_config IS NOT NULL
LIMIT 5;

-- Check orders with custom fields
SELECT 
  id,
  customer_name,
  custom_fields,
  created_at
FROM orders 
WHERE custom_fields IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
