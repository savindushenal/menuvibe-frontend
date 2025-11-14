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
      select: { id: true, order_form_config: true }
    });

    if (!location) {
      return NextResponse.json({ success: false, message: 'No location found' }, { status: 404 });
    }

    let config = {
      fields: [],
      defaultFields: {
        customerName: { enabled: true, required: true, label: 'Full Name', placeholder: 'Enter your name' },
        customerPhone: { enabled: true, required: true, label: 'Phone Number', placeholder: 'Enter your phone number' },
        customerEmail: { enabled: true, required: false, label: 'Email Address', placeholder: 'Enter your email' }
      }
    };

    // Parse existing config
    if (location.order_form_config) {
      try {
        const parsed = typeof location.order_form_config === 'string' 
          ? JSON.parse(location.order_form_config) 
          : location.order_form_config;
        config = { ...config, ...parsed };
      } catch (e) {
        console.error('Error parsing order_form_config:', e);
      }
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error loading order form config:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load configuration' },
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

    const config = await request.json();

    // Validate config structure
    if (!config.fields || !config.defaultFields) {
      return NextResponse.json(
        { success: false, message: 'Invalid configuration format' },
        { status: 400 }
      );
    }

    // Update location order form config
    await prisma.locations.updateMany({
      where: { user_id: BigInt(user.id) },
      data: { order_form_config: JSON.stringify(config) }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Order form configuration updated successfully',
      config 
    });
  } catch (error) {
    console.error('Error saving order form config:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
