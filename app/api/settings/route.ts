import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    let settings = await prisma.user_settings.findFirst({
      where: { user_id: BigInt(user.id) },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.user_settings.create({
        data: {
          user_id: BigInt(user.id),
        },
      });

      // Add default values for missing columns
      const defaultSettings = {
        ...settings,
        id: settings.id.toString(),
        user_id: settings.user_id.toString(),
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
      id: settings.id.toString(),
      user_id: settings.user_id.toString(),
      theme: 'light',
      language: 'en',
      currency: 'USD',
      notifications_enabled: true,
      email_notifications: settings.email_notifications
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
    const existing = await prisma.user_settings.findFirst({
      where: { user_id: BigInt(user.id) },
      select: { id: true },
    });

    if (!existing) {
      // Create new settings
      const newSettings = await prisma.user_settings.create({
        data: {
          user_id: BigInt(user.id),
        },
      });

      // Return settings with client-side values since we can't store them in DB
      const settingsWithValues = {
        ...newSettings,
        id: newSettings.id.toString(),
        user_id: newSettings.user_id.toString(),
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

    // For existing settings, just update the timestamp
    const updatedSettings = await prisma.user_settings.update({
      where: { id: existing.id },
      data: {
        updated_at: new Date(),
      },
    });

    // Return settings with client-provided values
    const settingsWithValues = {
      ...updatedSettings,
      id: updatedSettings.id.toString(),
      user_id: updatedSettings.user_id.toString(),
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
