import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import QRCode from 'qrcode';
import { canCreateQRCode, canAccessFeature } from '@/lib/permissions';

// GET /api/qr-codes - Get all QR codes for user's location
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');

    let location;
    
    if (locationId) {
      location = await prisma.locations.findFirst({
        where: {
          id: BigInt(locationId),
          user_id: BigInt(user.id),
        },
      });
    } else {
      location = await prisma.locations.findFirst({
        where: {
          user_id: BigInt(user.id),
          is_default: true,
        },
      });
    }

    if (!location) {
      return NextResponse.json({
        success: true,
        data: { qr_codes: [] },
        message: 'No location found'
      });
    }

    // Get all QR codes for this location with menu name
    const qrCodes = await prisma.qr_codes.findMany({
      where: { location_id: location.id },
      include: {
        menus: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Format response
    const formattedQrCodes = qrCodes.map(qr => ({
      ...qr,
      id: qr.id.toString(),
      location_id: qr.location_id.toString(),
      menu_id: qr.menu_id?.toString() || null,
      menu_name: qr.menus?.name || null,
    }));

    return NextResponse.json({
      success: true,
      data: { qr_codes: formattedQrCodes }
    });
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch QR codes' },
      { status: 500 }
    );
  }
}

// POST /api/qr-codes - Create a new QR code
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { name, menu_id, table_number, location_id } = body;

    // Get location
    let location;
    if (location_id) {
      location = await prisma.locations.findFirst({
        where: {
          id: BigInt(location_id),
          user_id: BigInt(user.id),
        },
      });
    } else {
      location = await prisma.locations.findFirst({
        where: {
          user_id: BigInt(user.id),
          is_default: true,
        },
      });
    }

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'No location found' },
        { status: 404 }
      );
    }

    // Get user's subscription
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: BigInt(user.id),
        status: 'active',
        OR: [
          { ends_at: null },
          { ends_at: { gt: new Date() } },
        ],
      },
      include: {
        subscription_plans: {
          select: {
            name: true,
            slug: true,
            limits: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Determine plan type (Free, Pro, or Enterprise)
    const planSlug = subscription?.subscription_plans.slug || 'free';
    const isFree = planSlug === 'free';
    const isPro = planSlug === 'pro';
    const isEnterprise = planSlug === 'enterprise';

    // Menu ID is required for all plans
    if (!menu_id) {
      return NextResponse.json(
        { success: false, message: 'Menu selection is required to create a QR code.' },
        { status: 400 }
      );
    }

    // Verify menu belongs to user
    const menu = await prisma.menus.findFirst({
      where: {
        id: BigInt(menu_id),
        location_id: location.id,
      },
    });

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    // DYNAMIC PERMISSION CHECK - Check subscription limits from database
    const permissionCheck = await canCreateQRCode(user.id, { 
      table_specific: !!table_number 
    });
    
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

    // Get menu with slug for URL generation
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

    // Generate QR code URL using slug instead of ID
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    let qrUrl = `${baseUrl}/menu/${menuWithSlug.slug}`;
    
    if (table_number) {
      qrUrl += `?table=${table_number}`;
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Insert QR code record
    const qrCode = await prisma.qr_codes.create({
      data: {
        location_id: location.id,
        menu_id: menu_id ? BigInt(menu_id) : null,
        name,
        table_number: table_number || null,
        qr_url: qrUrl,
        qr_image: qrDataUrl,
        scan_count: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'QR code created successfully',
      data: { 
        qr_code: {
          ...qrCode,
          id: qrCode.id.toString(),
          location_id: qrCode.location_id.toString(),
          menu_id: qrCode.menu_id?.toString() || null,
        }
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating QR code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create QR code', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
