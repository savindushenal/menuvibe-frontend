import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// DELETE /api/qr-codes/[id] - Delete a QR code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify QR code belongs to user
    const qrCode = await queryOne<any>(
      `SELECT qr.* FROM qr_codes qr
       JOIN locations l ON qr.location_id = l.id
       WHERE qr.id = ? AND l.user_id = ?`,
      [params.id, user.id]
    );

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR code not found' },
        { status: 404 }
      );
    }

    await query('DELETE FROM qr_codes WHERE id = ?', [params.id]);

    return NextResponse.json({
      success: true,
      message: 'QR code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete QR code' },
      { status: 500 }
    );
  }
}

// GET /api/qr-codes/[id] - Get a specific QR code
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const qrCode = await queryOne<any>(
      `SELECT qr.*, m.name as menu_name, l.name as location_name
       FROM qr_codes qr
       JOIN locations l ON qr.location_id = l.id
       LEFT JOIN menus m ON qr.menu_id = m.id
       WHERE qr.id = ? AND l.user_id = ?`,
      [params.id, user.id]
    );

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { qr_code: qrCode }
    });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch QR code' },
      { status: 500 }
    );
  }
}
