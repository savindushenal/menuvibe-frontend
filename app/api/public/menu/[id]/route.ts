import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// GET /api/public/menu/[id] - Public menu view (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menuId = params.id;

    // Get menu details with restaurant/location name and logo
    const menu = await queryOne<any>(
      `SELECT m.id, m.name as menu_name, m.description, m.style, m.currency, m.is_active,
              COALESCE(bp.business_name, l.name, 'Restaurant') as restaurant_name,
              COALESCE(l.logo_url, bp.logo_url) as logo_url
       FROM menus m
       LEFT JOIN locations l ON m.location_id = l.id
       LEFT JOIN business_profiles bp ON l.user_id = bp.user_id
       WHERE m.id = ?`,
      [menuId]
    );

    if (!menu) {
      console.log(`Menu ${menuId} not found in database`);
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    console.log(`Found menu ${menuId}:`, menu.menu_name, 'Restaurant:', menu.restaurant_name, 'is_active:', menu.is_active);

    // Get categories
    const categories = await query<any>(
      `SELECT id, name, description, background_color, text_color, heading_color, sort_order
       FROM menu_categories
       WHERE menu_id = ?
       ORDER BY sort_order ASC`,
      [menuId]
    );

    // Get menu items (only available ones for public view)
    const items = await query<any>(
      `SELECT mi.id, mi.name, mi.description, mi.price, mi.category_id, 
              mi.image_url, mi.is_available, mi.is_featured, mi.dietary_info,
              mi.card_color, mi.heading_color, mi.text_color,
              mc.name as category_name, mc.background_color as category_bg_color
       FROM menu_items mi
       LEFT JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE mi.menu_id = ? AND mi.is_available = 1
       ORDER BY mi.sort_order ASC`,
      [menuId]
    );

    // Parse dietary_info JSON and convert price to number
    const itemsWithDietary = items.map(item => ({
      ...item,
      price: parseFloat(item.price) || 0,
      dietary_info: item.dietary_info ? JSON.parse(item.dietary_info) : []
    }));

    return NextResponse.json({
      success: true,
      data: {
        menu,
        categories,
        items: itemsWithDietary
      }
    });
  } catch (error) {
    console.error('Error fetching public menu:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

// POST /api/public/menu/[id] - Place order (subscription-restricted)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menuId = params.id;
    const formData = await request.formData();
    
    const customerName = formData.get('customerName') as string;
    const customerPhone = formData.get('customerPhone') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const items = JSON.parse(formData.get('items') as string);
    const totalAmount = parseFloat(formData.get('totalAmount') as string);
    const notes = formData.get('notes') as string;

    // Get menu with location and user info
    const menu = await queryOne<any>(
      `SELECT m.id, m.location_id, l.user_id
       FROM menus m
       LEFT JOIN locations l ON m.location_id = l.id
       WHERE m.id = ?`,
      [menuId]
    );

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    // Check user's subscription plan - only Enterprise and Pro can accept orders
    const subscription = await queryOne<any>(
      `SELECT plan_type, features, status
       FROM subscriptions
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [menu.user_id]
    );

    let canAcceptOrders = false;

    if (subscription) {
      const features = subscription.features ? JSON.parse(subscription.features) : {};
      
      // Check if user has Enterprise or Pro plan
      if (subscription.plan_type === 'enterprise' || subscription.plan_type === 'pro') {
        canAcceptOrders = true;
      }
      
      // Also check if ordering feature is explicitly enabled in features
      if (features.online_ordering) {
        canAcceptOrders = true;
      }
    }

    if (!canAcceptOrders) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Online ordering is only available for Pro and Enterprise subscribers',
          requiresUpgrade: true,
          upgradeUrl: '/dashboard/settings?tab=subscription'
        },
        { status: 403 }
      );
    }

    // Validate order items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Validate required customer info
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, message: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    // Create order record
    const [orderResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO orders (
        menu_id, location_id, customer_name, customer_phone, customer_email,
        total_amount, notes, status, order_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [menuId, menu.location_id, customerName, customerPhone, customerEmail || null, totalAmount, notes || null]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const item of items) {
      await pool.execute<ResultSetHeader>(
        `INSERT INTO order_items (
          order_id, menu_item_id, quantity, price, item_name
        ) VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.id, item.quantity, item.price, item.name]
      );
    }

    // Track order placed event
    try {
      await pool.execute<ResultSetHeader>(
        `INSERT INTO analytics_events (
          menu_id, location_id, event_type, event_data, session_id, ip_address, user_agent, created_at
        ) VALUES (?, ?, 'order_placed', ?, ?, ?, ?, NOW())`,
        [
          menuId,
          menu.location_id,
          JSON.stringify({
            order_id: orderId,
            total_amount: totalAmount,
            item_count: items.length,
            customer_name: customerName
          }),
          formData.get('sessionId') || null,
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        ]
      );
    } catch (analyticsError) {
      console.error('Error tracking order event:', analyticsError);
      // Don't fail the order if analytics fails
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        message: 'Order placed successfully! The restaurant will contact you shortly.',
        estimatedTime: '20-30 minutes'
      }
    });

  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to place order. Please try again.' },
      { status: 500 }
    );
  }
}
