import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

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
