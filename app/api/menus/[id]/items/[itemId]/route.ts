import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/menus/[id]/items/[itemId] - Get a specific menu item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const item = await queryOne<any>(
      `SELECT mi.* FROM menu_items mi
       JOIN menus m ON mi.menu_id = m.id
       JOIN locations l ON m.location_id = l.id
       WHERE mi.id = ? AND mi.menu_id = ? AND l.user_id = ?`,
      [params.itemId, params.id, user.id]
    );

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { menu_item: item },
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}

// PUT /api/menus/[id]/items/[itemId] - Update a menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify item belongs to user
    const item = await queryOne<any>(
      `SELECT mi.* FROM menu_items mi
       JOIN menus m ON mi.menu_id = m.id
       JOIN locations l ON m.location_id = l.id
       WHERE mi.id = ? AND mi.menu_id = ? AND l.user_id = ?`,
      [params.itemId, params.id, user.id]
    );

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found' },
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
      dietary_tags,
      customization_options,
      background_color,
      text_color,
      border_color,
      sort_order,
    } = body;

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      values.push(currency);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      values.push(category_id);
    }
    if (is_available !== undefined) {
      updates.push('is_available = ?');
      values.push(is_available);
    }
    if (is_featured !== undefined) {
      updates.push('is_featured = ?');
      values.push(is_featured);
    }
    if (allergens !== undefined) {
      updates.push('allergens = ?');
      values.push(allergens ? JSON.stringify(allergens) : null);
    }
    if (dietary_tags !== undefined) {
      updates.push('dietary_tags = ?');
      values.push(dietary_tags ? JSON.stringify(dietary_tags) : null);
    }
    if (customization_options !== undefined) {
      updates.push('customization_options = ?');
      values.push(customization_options ? JSON.stringify(customization_options) : null);
    }
    if (background_color !== undefined) {
      updates.push('background_color = ?');
      values.push(background_color);
    }
    if (text_color !== undefined) {
      updates.push('text_color = ?');
      values.push(text_color);
    }
    if (border_color !== undefined) {
      updates.push('border_color = ?');
      values.push(border_color);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }

    updates.push('updated_at = NOW()');
    values.push(params.itemId);

    await query(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated item
    const updatedItem = await queryOne<any>(
      'SELECT * FROM menu_items WHERE id = ?',
      [params.itemId]
    );

    return NextResponse.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { menu_item: updatedItem },
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

// DELETE /api/menus/[id]/items/[itemId] - Delete a menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify item belongs to user
    const item = await queryOne<any>(
      `SELECT mi.* FROM menu_items mi
       JOIN menus m ON mi.menu_id = m.id
       JOIN locations l ON m.location_id = l.id
       WHERE mi.id = ? AND mi.menu_id = ? AND l.user_id = ?`,
      [params.itemId, params.id, user.id]
    );

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found' },
        { status: 404 }
      );
    }

    await query('DELETE FROM menu_items WHERE id = ?', [params.itemId]);

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
