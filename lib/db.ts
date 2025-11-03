import mysql from 'mysql2/promise';

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'uniform.de.hostns.io',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_DATABASE || 'menuVibe_staging',
  user: process.env.DB_USERNAME || 'menuVibe_user',
  password: process.env.DB_PASSWORD || 'menuVibe@2025',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default pool;

// Helper function to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

// Helper function for single row
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}
