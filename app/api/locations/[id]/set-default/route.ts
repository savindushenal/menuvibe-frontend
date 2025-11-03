import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function POST(
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

    // Remove default from all locations
    await query(
      'UPDATE locations SET is_default = 0 WHERE user_id = ?',
      [user.id]
    );

    // Set this location as default
    await query(
      'UPDATE locations SET is_default = 1, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [params.id, user.id]
    );

    const updatedLocation = await queryOne<any>(
      'SELECT * FROM locations WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Default location updated successfully',
      data: { location: updatedLocation }
    });
  } catch (error) {
    console.error('Error setting default location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set default location' },
      { status: 500 }
    );
  }
}
