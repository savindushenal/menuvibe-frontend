import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// PUT /api/menus/[id]/categories/[categoryId] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify category belongs to user
    const category = await queryOne<any>(
      `SELECT mc.* FROM menu_categories mc
       JOIN menus m ON mc.menu_id = m.id
       JOIN locations l ON m.location_id = l.id
       WHERE mc.id = ? AND mc.menu_id = ? AND l.user_id = ?`,
      [params.categoryId, params.id, user.id]
    );

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, sort_order } = body;

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
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }

    updates.push('updated_at = NOW()');
    values.push(params.categoryId);

    await query(
      `UPDATE menu_categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated category
    const updatedCategory = await queryOne<any>(
      'SELECT * FROM menu_categories WHERE id = ?',
      [params.categoryId]
    );

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: updatedCategory },
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/menus/[id]/categories/[categoryId] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify category belongs to user
    const category = await queryOne<any>(
      `SELECT mc.* FROM menu_categories mc
       JOIN menus m ON mc.menu_id = m.id
       JOIN locations l ON m.location_id = l.id
       WHERE mc.id = ? AND mc.menu_id = ? AND l.user_id = ?`,
      [params.categoryId, params.id, user.id]
    );

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has menu items
    const items = await query<any>(
      'SELECT id FROM menu_items WHERE category_id = ? LIMIT 1',
      [params.categoryId]
    );

    if (items.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete category with existing menu items' },
        { status: 400 }
      );
    }

    await query('DELETE FROM menu_categories WHERE id = ?', [params.categoryId]);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
