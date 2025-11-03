import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const location = await queryOne<any>(
      'SELECT * FROM locations WHERE id = ? AND user_id = ?',
      [params.id, user.id]
    );

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if location exists and belongs to user
    const location = await queryOne<any>(
      'SELECT * FROM locations WHERE id = ? AND user_id = ?',
      [params.id, user.id]
    );

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    // If setting as default, remove default from others
    if (is_default) {
      await query(
        'UPDATE locations SET is_default = 0 WHERE user_id = ? AND id != ?',
        [user.id, params.id]
      );
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone || null); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }
    if (website !== undefined) { updates.push('website = ?'); values.push(website || null); }
    if (address_line_1 !== undefined) { updates.push('address_line_1 = ?'); values.push(address_line_1); }
    if (address_line_2 !== undefined) { updates.push('address_line_2 = ?'); values.push(address_line_2 || null); }
    if (city !== undefined) { updates.push('city = ?'); values.push(city); }
    if (state !== undefined) { updates.push('state = ?'); values.push(state); }
    if (postal_code !== undefined) { updates.push('postal_code = ?'); values.push(postal_code); }
    if (country !== undefined) { updates.push('country = ?'); values.push(country); }
    if (cuisine_type !== undefined) { updates.push('cuisine_type = ?'); values.push(cuisine_type || null); }
    if (seating_capacity !== undefined) { updates.push('seating_capacity = ?'); values.push(seating_capacity || null); }
    if (operating_hours !== undefined) { updates.push('operating_hours = ?'); values.push(operating_hours ? JSON.stringify(operating_hours) : null); }
    if (services !== undefined) { updates.push('services = ?'); values.push(services ? JSON.stringify(services) : null); }
    if (logo_url !== undefined) { updates.push('logo_url = ?'); values.push(logo_url || null); }
    if (primary_color !== undefined) { updates.push('primary_color = ?'); values.push(primary_color || null); }
    if (secondary_color !== undefined) { updates.push('secondary_color = ?'); values.push(secondary_color || null); }
    if (social_media !== undefined) { updates.push('social_media = ?'); values.push(social_media ? JSON.stringify(social_media) : null); }
    if (latitude !== undefined) { updates.push('latitude = ?'); values.push(latitude || null); }
    if (longitude !== undefined) { updates.push('longitude = ?'); values.push(longitude || null); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (is_default !== undefined) { updates.push('is_default = ?'); values.push(is_default ? 1 : 0); }

    updates.push('updated_at = NOW()');
    values.push(params.id, user.id);

    // Update location
    await query(
      `UPDATE locations SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    // Get updated location
    const updatedLocation = await queryOne<any>(
      'SELECT * FROM locations WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      data: updatedLocation
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Check if location exists and belongs to user
    const location = await queryOne<any>(
      'SELECT * FROM locations WHERE id = ? AND user_id = ?',
      [params.id, user.id]
    );

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if it's the default location
    if (location.is_default) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete default location' },
        { status: 400 }
      );
    }

    // Delete location
    await query(
      'DELETE FROM locations WHERE id = ? AND user_id = ?',
      [params.id, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
