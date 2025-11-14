import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT /api/menus/[id]/categories/[categoryId] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify category belongs to user
    const category = await prisma.menu_categories.findFirst({
      where: {
        id: BigInt(params.categoryId),
        menu_id: BigInt(params.id),
        menus: {
          locations: {
            user_id: BigInt(user.id),
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, sort_order } = body;

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Update category
    const updatedCategory = await prisma.menu_categories.update({
      where: { id: BigInt(params.categoryId) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: { 
        category: {
          ...updatedCategory,
          id: updatedCategory.id.toString(),
          menu_id: updatedCategory.menu_id.toString(),
        }
      },
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
    const category = await prisma.menu_categories.findFirst({
      where: {
        id: BigInt(params.categoryId),
        menu_id: BigInt(params.id),
        menus: {
          locations: {
            user_id: BigInt(user.id),
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has menu items
    const itemCount = await prisma.menu_items.count({
      where: { category_id: BigInt(params.categoryId) },
    });

    if (itemCount > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete category with existing menu items' },
        { status: 400 }
      );
    }

    await prisma.menu_categories.delete({
      where: { id: BigInt(params.categoryId) },
    });

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
