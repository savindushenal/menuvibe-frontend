import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/menus/[id] - Get a specific menu
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
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

    // Get menu items
    const items = await query<any>(
      'SELECT * FROM menu_items WHERE menu_id = ? ORDER BY sort_order ASC',
      [menu.id]
    );

    return NextResponse.json({
      success: true,
      data: { menu: { ...menu, items } },
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

// PUT /api/menus/[id] - Update a menu
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Parse FormData instead of JSON
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const style = formData.get('style') as string;
    const currency = formData.get('currency') as string;
    // Only parse is_active if it's explicitly provided
    const is_active = formData.has('is_active') ? formData.get('is_active') === '1' : undefined;
    const is_featured = formData.has('is_featured') ? formData.get('is_featured') === '1' : undefined;
    const sortOrderValue = formData.get('sort_order') as string;
    const sort_order = sortOrderValue ? parseInt(sortOrderValue) : undefined;

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

    // Build update query dynamically
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
    if (style !== undefined) {
      updates.push('style = ?');
      values.push(style);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      values.push(currency);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    if (is_featured !== undefined) {
      updates.push('is_featured = ?');
      values.push(is_featured);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }

    updates.push('updated_at = NOW()');
    values.push(params.id);

    await query(
      `UPDATE menus SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated menu
    const updatedMenu = await queryOne<any>(
      'SELECT * FROM menus WHERE id = ?',
      [params.id]
    );

    // Get menu items
    const items = await query<any>(
      'SELECT * FROM menu_items WHERE menu_id = ? ORDER BY sort_order ASC',
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Menu updated successfully',
      data: { menu: { ...updatedMenu, items } },
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update menu' },
      { status: 500 }
    );
  }
}

// DELETE /api/menus/[id] - Delete a menu
export async function DELETE(
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

    // Delete menu items first
    await query('DELETE FROM menu_items WHERE menu_id = ?', [params.id]);

    // Delete menu categories
    await query('DELETE FROM menu_categories WHERE menu_id = ?', [params.id]);

    // Delete menu
    await query('DELETE FROM menus WHERE id = ?', [params.id]);

    return NextResponse.json({
      success: true,
      message: 'Menu deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete menu' },
      { status: 500 }
    );
  }
}
