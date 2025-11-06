-- Add slug and public_id columns to menus table for unique, SEO-friendly URLs
-- Run this in phpMyAdmin

-- Step 1: Add new columns (skip if already exists)
-- Check if columns exist first - if you get error "Duplicate column name", skip to Step 2
-- ALTER TABLE menus 
-- ADD COLUMN slug VARCHAR(255) NULL AFTER name,
-- ADD COLUMN public_id VARCHAR(12) NULL AFTER slug;

-- Step 2: Generate public_id for existing menus (unique 8-char hash)
UPDATE menus 
SET public_id = LOWER(SUBSTRING(MD5(CONCAT(id, name, RAND(), NOW())), 1, 8))
WHERE public_id IS NULL;

-- Step 3: Generate slugs for existing menus
-- Format: restaurant-name-menu-name
UPDATE menus m
JOIN locations l ON m.location_id = l.id
SET m.slug = CONCAT(
  LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    l.name, ' ', '-'), '&', 'and'), ',', ''), '.', ''), '''', '')
  ),
  '-',
  LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    m.name, ' ', '-'), '&', 'and'), ',', ''), '.', ''), '''', '')
  ),
  '-',
  m.public_id
)
WHERE m.slug IS NULL;

-- Step 4: Make columns NOT NULL and add unique constraints
-- If constraints already exist, you'll get error - that's OK, skip to Step 5
ALTER TABLE menus 
MODIFY COLUMN slug VARCHAR(255) NOT NULL,
MODIFY COLUMN public_id VARCHAR(12) NOT NULL;

-- Add unique constraints (comment out if already exist)
-- ALTER TABLE menus ADD UNIQUE KEY unique_slug (slug);
-- ALTER TABLE menus ADD UNIQUE KEY unique_public_id (public_id);
-- ALTER TABLE menus ADD INDEX idx_public_id (public_id);

-- Step 5: Verify the migration
SELECT 
  id,
  name,
  slug,
  public_id,
  location_id
FROM menus
ORDER BY id
LIMIT 10;

-- Step 6: Update QR codes to use new slug URLs
UPDATE qr_codes qr
JOIN menus m ON qr.menu_id = m.id
SET qr.qr_url = REPLACE(qr.qr_url, CONCAT('/menu/', qr.menu_id), CONCAT('/menu/', m.slug))
WHERE qr.qr_url LIKE '%/menu/%';

-- Verify QR code updates
SELECT 
  qr.id,
  qr.name,
  qr.qr_url,
  m.slug as menu_slug
FROM qr_codes qr
JOIN menus m ON qr.menu_id = m.id
LIMIT 10;
