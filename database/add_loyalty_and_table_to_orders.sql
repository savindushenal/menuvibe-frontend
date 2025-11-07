-- Add loyalty_number and table_number columns to orders table
-- For Enterprise customer tracking

-- Add columns if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS loyalty_number VARCHAR(50) NULL AFTER customer_email,
ADD COLUMN IF NOT EXISTS table_number VARCHAR(20) NULL AFTER loyalty_number;

-- Add index for loyalty number lookups (Enterprise feature)
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_loyalty_number (loyalty_number);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_table_number (table_number);

-- Verify changes
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'orders' 
AND TABLE_SCHEMA = DATABASE()
AND COLUMN_NAME IN ('loyalty_number', 'table_number');
