import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createClient } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get user's location
    const locationResult = await query<any>(
      'SELECT id, settings FROM locations WHERE user_id = ? LIMIT 1',
      [user.id]
    );

    if (locationResult.length === 0) {
      return NextResponse.json({ success: false, message: 'No location found' }, { status: 404 });
    }

    const location = locationResult[0];
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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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
    await query(
      'UPDATE locations SET settings = ? WHERE user_id = ?',
      [JSON.stringify(settings), user.id]
    );

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
