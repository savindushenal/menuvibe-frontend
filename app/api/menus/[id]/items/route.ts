import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/menus/[id]/items - Get all items for a menu
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify menu belongs to user
    const menu = await queryOne<any>(
      `SELECT m.* FROM menus m
       JOIN locations l ON m.location_id = l.id
       WHERE m.id = ? AND l.user_id = ?`,
      [params.id, user.id]
    );

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    // Get all menu items
    const items = await query<any>(
      'SELECT * FROM menu_items WHERE menu_id = ? ORDER BY sort_order ASC, created_at DESC',
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: { menu_items: items },
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

// POST /api/menus/[id]/items - Create a new menu item
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify menu belongs to user
    const menu = await queryOne<any>(
      `SELECT m.* FROM menus m
       JOIN locations l ON m.location_id = l.id
       WHERE m.id = ? AND l.user_id = ?`,
      [params.id, user.id]
    );

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      currency,
      category_id,
      is_available,
      is_featured,
      allergens,
      dietary_info,
      image_url,
      card_color,
      heading_color,
      text_color,
      sort_order,
    } = body;

    // Insert menu item
    const [result]: any = await query(
      `INSERT INTO menu_items (
        menu_id, name, description, price, currency, category_id,
        is_available, is_featured, allergens, dietary_info,
        image_url, card_color, heading_color, text_color,
        sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        params.id,
        name,
        description || null,
        price,
        currency || menu.currency || 'USD',
        category_id,
        is_available !== undefined ? is_available : true,
        is_featured !== undefined ? is_featured : false,
        allergens ? JSON.stringify(allergens) : null,
        dietary_info ? JSON.stringify(dietary_info) : null,
        image_url || null,
        card_color || null,
        heading_color || null,
        text_color || null,
        sort_order || 0,
      ]
    );

    // Get created item
    const item = await queryOne<any>(
      'SELECT * FROM menu_items WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Menu item created successfully',
      data: { menu_item: item },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
