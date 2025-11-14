import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getRemainingQuota } from '@/lib/permissions';

// GET /api/locations - Get all locations for the authenticated user
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const locations = await prisma.locations.findMany({
      where: { user_id: BigInt(user.id) },
      orderBy: [
        { is_default: 'desc' },
        { created_at: 'desc' },
      ],
    });

    // Convert BigInt to string and parse JSON fields
    const serializedLocations = locations.map(location => ({
      ...location,
      id: location.id.toString(),
      user_id: location.user_id.toString(),
      operating_hours: location.operating_hours ? JSON.parse(location.operating_hours as string) : null,
      services: location.services ? JSON.parse(location.services as string) : null,
      social_media: location.social_media ? JSON.parse(location.social_media as string) : null,
    }));

    // Get dynamic quota from subscription
    const quota = await getRemainingQuota(user.id, 'locations');

    return NextResponse.json({
      success: true,
      data: serializedLocations,
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
      await prisma.locations.updateMany({
        where: { user_id: BigInt(user.id) },
        data: { is_default: false },
      });
    }

    // Insert location
    const location = await prisma.locations.create({
      data: {
        user_id: BigInt(user.id),
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
        operating_hours: operating_hours ? JSON.stringify(operating_hours) : null,
        services: services ? JSON.stringify(services) : null,
        logo_url,
        primary_color,
        secondary_color,
        social_media: social_media ? JSON.stringify(social_media) : null,
        latitude,
        longitude,
        is_active: is_active !== undefined ? is_active : true,
        is_default: is_default ? true : false,
      },
    });

    // Convert BigInt to string and parse JSON fields
    const serializedLocation = {
      ...location,
      id: location.id.toString(),
      user_id: location.user_id.toString(),
      operating_hours: location.operating_hours ? JSON.parse(location.operating_hours as string) : null,
      services: location.services ? JSON.parse(location.services as string) : null,
      social_media: location.social_media ? JSON.parse(location.social_media as string) : null,
    };

    return NextResponse.json({
      success: true,
      message: 'Location created successfully',
      data: serializedLocation,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create location' },
      { status: 500 }
    );
  }
}
