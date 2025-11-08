import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { isValidSlug } from '@/lib/slug-utils';

// GET /api/public/menu/[id] - Public menu view (supports both slug and numeric ID)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const identifier = params.id;
    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get('table');

    console.log('=== Public Menu API ===');
    console.log('Identifier:', identifier);
    console.log('Is valid slug?', isValidSlug(identifier));
    console.log('Is numeric?', /^\d+$/.test(identifier));

    let menu;

    // Check if identifier is a slug or numeric ID
    if (isValidSlug(identifier)) {
      console.log('Looking up by SLUG:', identifier);
      // It's a slug - lookup by slug
      menu = await queryOne<any>(
        `SELECT m.id, m.location_id, m.name as menu_name, m.description, m.style, m.currency, m.is_active, m.slug,
                COALESCE(bp.business_name, l.name, 'Restaurant') as restaurant_name,
                COALESCE(l.logo_url, bp.logo_url) as logo_url,
                l.name as location_name,
                l.primary_color,
                l.secondary_color,
                l.phone,
                l.email,
                l.website,
                l.settings as location_settings,
                l.order_form_config
         FROM menus m
         LEFT JOIN locations l ON m.location_id = l.id
         LEFT JOIN business_profiles bp ON l.user_id = bp.user_id
         WHERE m.slug = ?`,
        [identifier]
      );
    } else if (/^\d+$/.test(identifier)) {
      console.log('Looking up by NUMERIC ID:', identifier);
      // It's a numeric ID - lookup by ID (backward compatibility)
      menu = await queryOne<any>(
        `SELECT m.id, m.location_id, m.name as menu_name, m.description, m.style, m.currency, m.is_active, m.slug,
                COALESCE(bp.business_name, l.name, 'Restaurant') as restaurant_name,
                COALESCE(l.logo_url, bp.logo_url) as logo_url,
                l.name as location_name,
                l.primary_color,
                l.secondary_color,
                l.phone,
                l.email,
                l.website,
                l.settings as location_settings,
                l.order_form_config
         FROM menus m
         LEFT JOIN locations l ON m.location_id = l.id
         LEFT JOIN business_profiles bp ON l.user_id = bp.user_id
         WHERE m.id = ?`,
        [identifier]
      );
    } else {
      console.log('INVALID identifier format:', identifier);
      return NextResponse.json(
        { success: false, message: 'Invalid menu identifier' },
        { status: 400 }
      );
    }

    if (!menu) {
      console.log(`Menu ${identifier} not found in database`);
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    console.log(`Found menu ${identifier}:`, menu.menu_name, 'Restaurant:', menu.restaurant_name, 'is_active:', menu.is_active);

    const menuId = menu.id; // Use the resolved menu ID for subsequent queries

    // Track analytics
    try {
      // Get client information
      const clientIp = request.headers.get('x-forwarded-for') 
        || request.headers.get('x-real-ip') 
        || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const referer = request.headers.get('referer') || null;
      
      // Generate session ID from IP + User Agent (simple approach)
      const sessionId = Buffer.from(`${clientIp}-${userAgent.substring(0, 50)}`).toString('base64').substring(0, 64);
      
      // Track QR scan if table number provided, otherwise track menu view
      const eventType = tableNumber ? 'qr_scan' : 'menu_view';
      
      await pool.execute(
        `INSERT INTO analytics_events 
         (event_type, menu_id, table_number, ip_address, user_agent, referrer, session_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          eventType,
          menuId,
          tableNumber || null,
          clientIp,
          userAgent,
          referer,
          sessionId
        ]
      );
      
      console.log(`Tracked ${eventType} for menu ${menuId}${tableNumber ? ` at table ${tableNumber}` : ''}`);
    } catch (analyticsError) {
      // Don't fail the request if analytics fails
      console.error('Error tracking analytics:', analyticsError);
    }

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

    // Parse location settings
    let parsedLocationSettings = {};
    let parsedOrderFormConfig = {};
    try {
      if (menu.location_settings) {
        parsedLocationSettings = typeof menu.location_settings === 'string' 
          ? JSON.parse(menu.location_settings) 
          : menu.location_settings;
      }
      if (menu.order_form_config) {
        parsedOrderFormConfig = typeof menu.order_form_config === 'string' 
          ? JSON.parse(menu.order_form_config) 
          : menu.order_form_config;
      }
    } catch (e) {
      console.error('Error parsing location settings:', e);
    }

    // Add parsed settings to menu object
    const menuWithSettings = {
      ...menu,
      location_settings: parsedLocationSettings,
      order_form_config: parsedOrderFormConfig
    };

    return NextResponse.json({
      success: true,
      data: {
        menu: menuWithSettings,
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
    const loyaltyNumber = formData.get('loyaltyNumber') as string;
    const items = JSON.parse(formData.get('items') as string);
    const totalAmount = parseFloat(formData.get('totalAmount') as string);
    const notes = formData.get('notes') as string;
    const tableNumber = formData.get('tableNumber') as string;
    const customFields = formData.get('customFields') ? JSON.parse(formData.get('customFields') as string) : null;

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
        total_amount, notes, status, order_date, loyalty_number, table_number, custom_fields
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), ?, ?, ?)`,
      [
        menuId, 
        menu.location_id, 
        customerName, 
        customerPhone, 
        customerEmail || null, 
        totalAmount, 
        notes || null,
        loyaltyNumber || null,
        tableNumber || null,
        customFields ? JSON.stringify(customFields) : null
      ]
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
