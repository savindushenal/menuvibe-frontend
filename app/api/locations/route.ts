import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { getRemainingQuota } from '@/lib/permissions';

// GET /api/locations - Get all locations for the authenticated user
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const locations = await query<any>(
      'SELECT * FROM locations WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [user.id]
    );

    // Get dynamic quota from subscription
    const quota = await getRemainingQuota(user.id, 'locations');

    return NextResponse.json({
      success: true,
      data: locations,
      meta: {
        can_add_location: quota.unlimited || quota.remaining > 0,
        remaining_quota: quota.remaining,
        max_locations: quota.limit,
        current_count: quota.current,
        unlimited: quota.unlimited
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { 
      name, 
      description,
      phone, 
      email, 
      website,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      cuisine_type,
      seating_capacity,
      operating_hours,
      services,
      logo_url,
      primary_color,
      secondary_color,
      social_media,
      latitude,
      longitude,
      is_active,
      is_default 
    } = body;

    // Validate required fields
    if (!name || !address_line_1 || !city || !state || !postal_code || !country) {
      return NextResponse.json(
        { success: false, message: 'Name, address line 1, city, state, postal code, and country are required' },
        { status: 400 }
      );
    }

    // DYNAMIC PERMISSION CHECK - Check subscription limits from database
    const { canCreateLocation } = await import('@/lib/permissions');
    const permissionCheck = await canCreateLocation(user.id);
    
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          message: permissionCheck.reason,
          subscription_limit: true,
          current_count: permissionCheck.current_count,
          limit: permissionCheck.limit
        },
        { status: 403 }
      );
    }

    // If setting as default, remove default from others
    if (is_default) {
      await query(
        'UPDATE locations SET is_default = 0 WHERE user_id = ?',
        [user.id]
      );
    }

    // Insert location
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO locations (
        user_id, name, description, phone, email, website,
        address_line_1, address_line_2, city, state, postal_code, country,
        cuisine_type, seating_capacity, operating_hours, services,
        logo_url, primary_color, secondary_color, social_media,
        latitude, longitude, is_active, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        user.id, 
        name, 
        description || null,
        phone || null, 
        email || null, 
        website || null,
        address_line_1,
        address_line_2 || null,
        city,
        state,
        postal_code,
        country,
        cuisine_type || null,
        seating_capacity || null,
        operating_hours ? JSON.stringify(operating_hours) : null,
        services ? JSON.stringify(services) : null,
        logo_url || null,
        primary_color || null,
        secondary_color || null,
        social_media ? JSON.stringify(social_media) : null,
        latitude || null,
        longitude || null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        is_default ? 1 : 0
      ]
    );

    // Get created location
    const [location] = await query<any>(
      'SELECT * FROM locations WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Location created successfully',
      data: location,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create location' },
      { status: 500 }
    );
  }
}
