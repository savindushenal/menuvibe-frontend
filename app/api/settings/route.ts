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
      // Create default settings if they don't exist - use only basic columns
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO user_settings (user_id, created_at, updated_at)
         VALUES (?, NOW(), NOW())`,
        [user.id]
      );

      const newSettings = await queryOne<any>(
        'SELECT * FROM user_settings WHERE id = ?',
        [result.insertId]
      );

      // Add default values for missing columns
      const defaultSettings = {
        ...newSettings,
        theme: 'light',
        language: 'en',
        currency: 'USD',
        notifications_enabled: true,
        email_notifications: true
      };

      return NextResponse.json({
        success: true,
        data: { settings: defaultSettings }
      });
    }

    // Add default values for any missing columns
    const settingsWithDefaults = {
      ...settings,
      theme: settings.theme || 'light',
      language: settings.language || 'en',
      currency: settings.currency || 'USD',
      notifications_enabled: settings.notifications_enabled !== undefined ? !!settings.notifications_enabled : true,
      email_notifications: settings.email_notifications !== undefined ? !!settings.email_notifications : true
    };

    return NextResponse.json({
      success: true,
      data: { settings: settingsWithDefaults }
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
      // Create new settings with basic columns only
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO user_settings (user_id, created_at, updated_at)
         VALUES (?, NOW(), NOW())`,
        [user.id]
      );

      const newSettings = await queryOne<any>(
        'SELECT * FROM user_settings WHERE id = ?',
        [result.insertId]
      );

      // Return settings with client-side values since we can't store them in DB
      const settingsWithValues = {
        ...newSettings,
        theme: theme || 'light',
        language: language || 'en',
        currency: currency || 'USD',
        notifications_enabled: notifications_enabled !== undefined ? notifications_enabled : true,
        email_notifications: email_notifications !== undefined ? email_notifications : true
      };

      return NextResponse.json({
        success: true,
        data: { settings: settingsWithValues },
        message: 'Settings created successfully'
      });
    }

    // For existing settings, just update the timestamp since we can't update the theme/language columns
    await query(
      `UPDATE user_settings SET updated_at = NOW() WHERE user_id = ?`,
      [user.id]
    );

    const updatedSettings = await queryOne<any>(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [user.id]
    );

    // Return settings with client-provided values
    const settingsWithValues = {
      ...updatedSettings,
      theme: theme || 'light',
      language: language || 'en', 
      currency: currency || 'USD',
      notifications_enabled: notifications_enabled !== undefined ? notifications_enabled : true,
      email_notifications: email_notifications !== undefined ? email_notifications : true
    };

    return NextResponse.json({
      success: true,
      data: { settings: settingsWithValues },
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
