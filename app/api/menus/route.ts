import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// GET /api/menus - Get all menus for the authenticated user's location
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Get location_id from query parameter or use default
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');

    let location;
    
    if (locationId) {
      // Get specific location
      location = await queryOne<any>(
        'SELECT * FROM locations WHERE id = ? AND user_id = ?',
        [locationId, user.id]
      );
    } else {
      // Get user's default location
      location = await queryOne<any>(
        'SELECT * FROM locations WHERE user_id = ? AND is_default = 1 LIMIT 1',
        [user.id]
      );
    }

    if (!location) {
      // Return empty menus array instead of error
      return NextResponse.json({
        success: true,
        data: { menus: [] },
        message: 'No location found. Please create a location first.'
      });
    }

    // Get menus with their items
    const menus = await query<any>(
      `SELECT m.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', mi.id,
            'name', mi.name,
            'description', mi.description,
            'price', mi.price,
            'currency', mi.currency,
            'image_url', mi.image_url,
            'is_available', mi.is_available,
            'is_featured', mi.is_featured,
            'category_id', mi.category_id,
            'allergens', mi.allergens,
            'dietary_info', mi.dietary_info,
            'card_color', mi.card_color,
            'text_color', mi.text_color,
            'heading_color', mi.heading_color,
            'sort_order', mi.sort_order
          )
        ) FROM menu_items mi WHERE mi.menu_id = m.id) as items
       FROM menus m
       WHERE m.location_id = ?
       ORDER BY m.sort_order ASC, m.created_at DESC`,
      [location.id]
    );

    // Parse JSON items
    const menusWithItems = menus.map(menu => ({
      ...menu,
      items: menu.items ? JSON.parse(menu.items) : [],
    }));

    return NextResponse.json({
      success: true,
      data: { menus: menusWithItems },
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}

// POST /api/menus - Create a new menu
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Parse FormData instead of JSON
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const style = formData.get('style') as string;
    const currency = formData.get('currency') as string;
    const is_active = formData.get('is_active') === '1';
    const is_featured = formData.get('is_featured') === '1';
    const sortOrderValue = formData.get('sort_order') as string;
    const sort_order = sortOrderValue ? parseInt(sortOrderValue) : 0;

    // Get user's default location
    const location = await queryOne<any>(
      'SELECT * FROM locations WHERE user_id = ? AND is_default = 1 LIMIT 1',
      [user.id]
    );

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'No location found. Please create a location first.' },
        { status: 404 }
      );
    }

    // Check subscription limits (simplified - expand as needed)
    const menuCount = await queryOne<any>(
      'SELECT COUNT(*) as count FROM menus WHERE location_id = ?',
      [location.id]
    );

    // Insert menu
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO menus (location_id, name, description, style, currency, is_active, is_featured, sort_order, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        location.id,
        name,
        description || null,
        style || 'modern',
        currency || 'USD',
        is_active !== undefined ? is_active : true,
        is_featured !== undefined ? is_featured : false,
        sort_order || 0,
      ]
    );

    const menuId = result.insertId;

    // Get created menu
    const menu = await queryOne<any>(
      'SELECT * FROM menus WHERE id = ?',
      [menuId]
    );

    return NextResponse.json({
      success: true,
      message: 'Menu created successfully',
      data: { menu: { ...menu, items: [] } },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create menu' },
      { status: 500 }
    );
  }
}
