import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function POST() {
  try {
    console.log('Starting database migration...');

    // Orders table
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        menu_id INT NOT NULL,
        location_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(255),
        total_amount DECIMAL(10,2) NOT NULL,
        notes TEXT,
        status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP NULL,
        ready_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_menu_id (menu_id),
        INDEX idx_location_id (location_id),
        INDEX idx_status (status),
        INDEX idx_order_date (order_date),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
      )
    `;

    // Order Items table
    const createOrderItemsTable = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        menu_item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_menu_item_id (menu_item_id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
      )
    `;

    // Analytics Events table
    const createAnalyticsEventsTable = `
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        menu_id INT,
        location_id INT,
        event_type VARCHAR(50) NOT NULL,
        event_data JSON,
        session_id VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_menu_id (menu_id),
        INDEX idx_location_id (location_id),
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at),
        INDEX idx_session_id (session_id),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
      )
    `;

    const migrations = [
      { name: 'Create orders table', sql: createOrdersTable },
      { name: 'Create order_items table', sql: createOrderItemsTable },
      { name: 'Create analytics_events table', sql: createAnalyticsEventsTable }
    ];

    const results = [];

    for (const migration of migrations) {
      try {
        console.log(`Running migration: ${migration.name}`);
        await pool.execute(migration.sql);
        results.push({
          migration: migration.name,
          status: 'success',
          message: 'Table created successfully'
        });
        console.log(`✅ ${migration.name} completed`);
      } catch (error: any) {
        console.error(`❌ ${migration.name} failed:`, error.message);
        results.push({
          migration: migration.name,
          status: 'error',
          message: error.message
        });
      }
    }

    // Check if all migrations were successful
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    console.log(`Migration completed: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: failed === 0,
      message: failed === 0 
        ? 'All database migrations completed successfully' 
        : `Migration completed with ${failed} errors`,
      results,
      summary: {
        total: migrations.length,
        successful,
        failed
      }
    });

  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database migration failed',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if tables exist
    const tables = ['orders', 'order_items', 'analytics_events'];
    const results = [];

    for (const table of tables) {
      try {
        const [rows] = await pool.execute(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
          [process.env.DB_DATABASE, table]
        );
        const exists = (rows as any)[0].count > 0;
        results.push({
          table,
          exists,
          status: exists ? 'ready' : 'missing'
        });
      } catch (error: any) {
        results.push({
          table,
          exists: false,
          status: 'error',
          error: error.message
        });
      }
    }

    const allExist = results.every(r => r.exists);

    return NextResponse.json({
      success: true,
      message: allExist ? 'All required tables exist' : 'Some tables are missing',
      ready: allExist,
      tables: results
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Failed to check database status',
      error: error.message
    }, { status: 500 });
  }
}