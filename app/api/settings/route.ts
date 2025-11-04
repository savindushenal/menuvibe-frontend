import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const settings = await queryOne<any>(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [user.id]
    );

    if (!settings) {
      // Create default settings if they don't exist
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO user_settings (user_id, theme, language, currency, created_at, updated_at)
         VALUES (?, 'light', 'en', 'USD', NOW(), NOW())`,
        [user.id]
      );

      const newSettings = await queryOne<any>(
        'SELECT * FROM user_settings WHERE id = ?',
        [result.insertId]
      );

      return NextResponse.json({
        success: true,
        data: { settings: newSettings }
      });
    }

    return NextResponse.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { theme, language, currency, notifications_enabled, email_notifications } = body;

    // Check if settings exist
    const existing = await queryOne<any>(
      'SELECT id FROM user_settings WHERE user_id = ?',
      [user.id]
    );

    if (!existing) {
      // Create new settings
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO user_settings (user_id, theme, language, currency, notifications_enabled, email_notifications, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [user.id, theme || 'light', language || 'en', currency || 'USD', notifications_enabled ? 1 : 0, email_notifications ? 1 : 0]
      );

      const newSettings = await queryOne<any>(
        'SELECT * FROM user_settings WHERE id = ?',
        [result.insertId]
      );

      return NextResponse.json({
        success: true,
        data: { settings: newSettings },
        message: 'Settings created successfully'
      });
    }

    // Update existing settings
    await query(
      `UPDATE user_settings 
       SET theme = ?, language = ?, currency = ?, notifications_enabled = ?, email_notifications = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [theme, language, currency, notifications_enabled ? 1 : 0, email_notifications ? 1 : 0, user.id]
    );

    const updatedSettings = await queryOne<any>(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [user.id]
    );

    return NextResponse.json({
      success: true,
      data: { settings: updatedSettings },
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
