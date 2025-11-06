-- Orders, QR Codes, and Order Items tables for online ordering functionality
-- Compatible with existing MenuVibe database structure

-- QR Codes table (note: this table already exists in the database)
-- CREATE TABLE IF NOT EXISTS qr_codes (
--   id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
--   location_id bigint(20) UNSIGNED NOT NULL,
--   menu_id bigint(20) UNSIGNED,
--   name varchar(255) NOT NULL,
--   table_number varchar(50),
--   qr_url text NOT NULL,
--   qr_image longtext,
--   scan_count int(11) DEFAULT 0,
--   last_scanned_at timestamp NULL DEFAULT NULL,
--   created_at timestamp NULL DEFAULT NULL,
--   updated_at timestamp NULL DEFAULT NULL,
--   PRIMARY KEY (id),
--   KEY idx_location_id (location_id),
--   KEY idx_menu_id (menu_id),
--   KEY idx_table_number (table_number),
--   KEY idx_scan_count (scan_count),
--   CONSTRAINT fk_qr_codes_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
--   CONSTRAINT fk_qr_codes_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_id bigint(20) UNSIGNED NOT NULL,
  location_id bigint(20) UNSIGNED NOT NULL,
  qr_code_id bigint(20) UNSIGNED DEFAULT NULL,
  customer_name varchar(255) NOT NULL,
  customer_phone varchar(50) NOT NULL,
  customer_email varchar(255) DEFAULT NULL,
  table_number varchar(50) DEFAULT NULL,
  session_id varchar(255) DEFAULT NULL,
  total_amount decimal(10,2) NOT NULL,
  notes text DEFAULT NULL,
  status enum('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
  order_date timestamp DEFAULT CURRENT_TIMESTAMP,
  confirmed_at timestamp NULL DEFAULT NULL,
  ready_at timestamp NULL DEFAULT NULL,
  completed_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_menu_id (menu_id),
  KEY idx_location_id (location_id),
  KEY idx_qr_code_id (qr_code_id),
  KEY idx_status (status),
  KEY idx_order_date (order_date),
  KEY idx_session_id (session_id),
  KEY idx_table_number (table_number),
  CONSTRAINT fk_orders_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_qr_code FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id bigint(20) UNSIGNED NOT NULL,
  menu_item_id bigint(20) UNSIGNED NOT NULL,
  quantity int(11) NOT NULL DEFAULT 1,
  price decimal(10,2) NOT NULL,
  item_name varchar(255) NOT NULL,
  special_instructions text DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_order_id (order_id),
  KEY idx_menu_item_id (menu_item_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics Events table (enhanced for QR tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_id bigint(20) UNSIGNED DEFAULT NULL,
  location_id bigint(20) UNSIGNED DEFAULT NULL,
  qr_code_id bigint(20) UNSIGNED DEFAULT NULL,
  item_id bigint(20) UNSIGNED DEFAULT NULL,
  table_number varchar(50) DEFAULT NULL,
  event_type varchar(50) NOT NULL,
  event_data json DEFAULT NULL,
  session_id varchar(255) DEFAULT NULL,
  ip_address varchar(45) DEFAULT NULL,
  user_agent text DEFAULT NULL,
  referrer text DEFAULT NULL,
  additional_data json DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_menu_id (menu_id),
  KEY idx_location_id (location_id),
  KEY idx_qr_code_id (qr_code_id),
  KEY idx_item_id (item_id),
  KEY idx_event_type (event_type),
  KEY idx_created_at (created_at),
  KEY idx_session_id (session_id),
  KEY idx_table_number (table_number),
  CONSTRAINT fk_analytics_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  CONSTRAINT fk_analytics_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  CONSTRAINT fk_analytics_qr_code FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
  CONSTRAINT fk_analytics_menu_item FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;