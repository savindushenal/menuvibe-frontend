import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromToken, unauthorized } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return unauthorized();
    }

    // Get user's location
    const location = await prisma.locations.findFirst({
      where: { user_id: BigInt(user.id) },
      select: { id: true, settings: true }
    });

    if (!location) {
      return NextResponse.json({ success: false, message: 'No location found' }, { status: 404 });
    }

    let settings = {
      ordering: {
        enabled: true,
        requiresApproval: false
      },
      loyalty: {
        enabled: false,
        required: false,
        label: 'Loyalty Number',
        placeholder: 'Enter your loyalty number',
        helpText: ''
      }
    };

    // Parse existing settings
    if (location.settings) {
      try {
        const parsed = typeof location.settings === 'string' 
          ? JSON.parse(location.settings) 
          : location.settings;
        settings = { ...settings, ...parsed };
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return unauthorized();
    }

    const settings = await request.json();

    // Validate settings structure
    if (!settings.ordering || !settings.loyalty) {
      return NextResponse.json(
        { success: false, message: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // Update location settings
    await prisma.locations.updateMany({
      where: { user_id: BigInt(user.id) },
      data: { settings: JSON.stringify(settings) }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
