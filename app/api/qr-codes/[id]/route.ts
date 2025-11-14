import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';

// DELETE /api/qr-codes/[id] - Delete a QR code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify QR code belongs to user
    const qrCode = await prisma.qr_codes.findFirst({
      where: {
        id: BigInt(params.id),
        locations: {
          user_id: BigInt(user.id),
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR code not found' },
        { status: 404 }
      );
    }

    await prisma.qr_codes.delete({
      where: { id: BigInt(params.id) },
    });

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
    const qrCode = await prisma.qr_codes.findFirst({
      where: {
        id: BigInt(params.id),
        locations: {
          user_id: BigInt(user.id),
        },
      },
      include: {
        menus: {
          select: {
            name: true,
          },
        },
        locations: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { 
        qr_code: {
          ...qrCode,
          id: qrCode.id.toString(),
          location_id: qrCode.location_id.toString(),
          menu_id: qrCode.menu_id?.toString() || null,
          menu_name: qrCode.menus?.name || null,
          location_name: qrCode.locations.name,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch QR code' },
      { status: 500 }
    );
  }
}

// PUT /api/qr-codes/[id] - Update a QR code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { name, menu_id, table_number } = body;

    // Verify QR code belongs to user
    const existingQrCode = await prisma.qr_codes.findFirst({
      where: {
        id: BigInt(params.id),
        locations: {
          user_id: BigInt(user.id),
        },
      },
    });

    if (!existingQrCode) {
      return NextResponse.json(
        { success: false, message: 'QR code not found' },
        { status: 404 }
      );
    }

    // Get menu with slug for QR URL generation
    const menuWithSlug = await prisma.menus.findUnique({
      where: { id: BigInt(menu_id) },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    if (!menuWithSlug || !menuWithSlug.slug) {
      return NextResponse.json(
        { success: false, message: 'Menu slug not found. Please regenerate menu slugs.' },
        { status: 404 }
      );
    }

    // Generate updated QR code URL using slug
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    let qrUrl = `${baseUrl}/menu/${menuWithSlug.slug}`;
    
    if (table_number) {
      qrUrl += `?table=${table_number}`;
    }

    // Generate new QR code image
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update QR code record
    const updatedQrCode = await prisma.qr_codes.update({
      where: { id: BigInt(params.id) },
      data: {
        menu_id: BigInt(menu_id),
        name,
        table_number: table_number || null,
        qr_url: qrUrl,
        qr_image: qrDataUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'QR code updated successfully',
      data: {
        qr_code: {
          ...updatedQrCode,
          id: updatedQrCode.id.toString(),
          location_id: updatedQrCode.location_id.toString(),
          menu_id: updatedQrCode.menu_id?.toString() || null,
        }
      }
    });
  } catch (error) {
    console.error('Error updating QR code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update QR code', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
