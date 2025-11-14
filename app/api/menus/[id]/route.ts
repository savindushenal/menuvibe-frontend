import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/menus/[id] - Get a specific menu
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const menu = await prisma.menus.findFirst({
      where: {
        id: BigInt(params.id),
        locations: {
          user_id: BigInt(user.id),
        },
      },
      include: {
        menu_items: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { 
        menu: {
          ...menu,
          id: menu.id.toString(),
          location_id: menu.location_id.toString(),
          items: menu.menu_items.map(item => ({
            ...item,
            id: item.id.toString(),
            menu_id: item.menu_id.toString(),
          })),
        } 
      },
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
    const is_active = formData.get('is_active') === '1';
    const is_featured = formData.get('is_featured') === '1';
    const sortOrderValue = formData.get('sort_order') as string;
    const sort_order = sortOrderValue ? parseInt(sortOrderValue) : undefined;

    // Verify menu belongs to user
    const menu = await prisma.menus.findFirst({
      where: {
        id: BigInt(params.id),
        locations: {
          user_id: BigInt(user.id),
        },
      },
    });

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    // Build update data object
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (style !== undefined) updateData.style = style;
    if (currency !== undefined) updateData.currency = currency;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Update menu
    const updatedMenu = await prisma.menus.update({
      where: { id: BigInt(params.id) },
      data: updateData,
      include: {
        menu_items: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Menu updated successfully',
      data: { 
        menu: {
          ...updatedMenu,
          id: updatedMenu.id.toString(),
          location_id: updatedMenu.location_id.toString(),
          items: updatedMenu.menu_items.map(item => ({
            ...item,
            id: item.id.toString(),
            menu_id: item.menu_id.toString(),
          })),
        } 
      },
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
    const menu = await prisma.menus.findFirst({
      where: {
        id: BigInt(params.id),
        locations: {
          user_id: BigInt(user.id),
        },
      },
    });

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    // Delete menu (cascade delete will handle menu_items and menu_categories)
    await prisma.menus.delete({
      where: { id: BigInt(params.id) },
    });

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
