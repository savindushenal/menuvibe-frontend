import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import QRCode from 'qrcode';

// GET /api/qr-codes - Get all QR codes for user's location
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');

    let location;
    
    if (locationId) {
      location = await queryOne<any>(
        'SELECT * FROM locations WHERE id = ? AND user_id = ?',
        [locationId, user.id]
      );
    } else {
      location = await queryOne<any>(
        'SELECT * FROM locations WHERE user_id = ? AND is_default = 1 LIMIT 1',
        [user.id]
      );
    }

    if (!location) {
      return NextResponse.json({
        success: true,
        data: { qr_codes: [] },
        message: 'No location found'
      });
    }

    // Get all QR codes for this location
    const qrCodes = await query<any>(
      `SELECT qr.*, m.name as menu_name 
       FROM qr_codes qr
       LEFT JOIN menus m ON qr.menu_id = m.id
       WHERE qr.location_id = ?
       ORDER BY qr.created_at DESC`,
      [location.id]
    );

    return NextResponse.json({
      success: true,
      data: { qr_codes: qrCodes }
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
      location = await queryOne<any>(
        'SELECT * FROM locations WHERE id = ? AND user_id = ?',
        [location_id, user.id]
      );
    } else {
      location = await queryOne<any>(
        'SELECT * FROM locations WHERE user_id = ? AND is_default = 1 LIMIT 1',
        [user.id]
      );
    }

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'No location found' },
        { status: 404 }
      );
    }

    // Get user's subscription
    const subscription = await queryOne<any>(
      `SELECT us.*, sp.name as plan_name, sp.slug as plan_slug, sp.limits
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.user_id = ? AND (us.ends_at IS NULL OR us.ends_at > NOW())
       ORDER BY us.created_at DESC
       LIMIT 1`,
      [user.id]
    );

    // Determine plan type (Free, Pro, or Enterprise)
    const planSlug = subscription?.plan_slug || 'free';
    const isFree = planSlug === 'free';
    const isPro = planSlug === 'pro';
    const isEnterprise = planSlug === 'enterprise';

    // Check subscription limits based on plan
    if (isFree) {
      // Free plan: only 1 general QR code (no menu/table specificity)
      const existingCount = await queryOne<any>(
        'SELECT COUNT(*) as count FROM qr_codes WHERE location_id = ?',
        [location.id]
      );

      if (existingCount && existingCount.count > 0) {
        return NextResponse.json(
          { success: false, message: 'Free plan allows only 1 QR code. Upgrade to Pro or Enterprise for unlimited QR codes with menu and table-specific features.' },
          { status: 403 }
        );
      }

      // Free plan cannot have custom QR codes (menu or table specific)
      if (menu_id || table_number) {
        return NextResponse.json(
          { success: false, message: 'Menu-specific and table-specific QR codes require Pro or Enterprise subscription.' },
          { status: 403 }
        );
      }
    }
    // Pro and Enterprise plans have unlimited QR codes with custom features
    // No additional restrictions needed for Pro/Enterprise

    // Verify menu belongs to user if menu_id is provided
    if (menu_id) {
      const menu = await queryOne<any>(
        `SELECT m.* FROM menus m
         WHERE m.id = ? AND m.location_id = ?`,
        [menu_id, location.id]
      );

      if (!menu) {
        return NextResponse.json(
          { success: false, message: 'Menu not found' },
          { status: 404 }
        );
      }
    }

    // Generate QR code URL
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    let qrUrl = `${baseUrl}/menu/${location.id}`;
    
    if (menu_id) {
      qrUrl += `?menu=${menu_id}`;
    }
    if (table_number) {
      qrUrl += menu_id ? `&table=${table_number}` : `?table=${table_number}`;
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
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO qr_codes (location_id, menu_id, name, table_number, qr_url, qr_image, scan_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [location.id, menu_id || null, name, table_number || null, qrUrl, qrDataUrl]
    );

    const qrCode = await queryOne<any>(
      'SELECT * FROM qr_codes WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'QR code created successfully',
      data: { qr_code: qrCode }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating QR code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create QR code', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
