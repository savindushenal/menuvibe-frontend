import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/menus/[id]/items/[itemId] - Get a specific menu item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const item = await prisma.menu_items.findFirst({
      where: {
        id: BigInt(params.itemId),
        menu_id: BigInt(params.id),
        menus: {
          locations: {
            user_id: BigInt(user.id),
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { 
        menu_item: {
          ...item,
          id: item.id.toString(),
          menu_id: item.menu_id.toString(),
          category_id: item.category_id?.toString() || null,
        }
      },
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
    const item = await prisma.menu_items.findFirst({
      where: {
        id: BigInt(params.itemId),
        menu_id: BigInt(params.id),
        menus: {
          locations: {
            user_id: BigInt(user.id),
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    
    // Parse FormData instead of JSON
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceValue = formData.get('price') as string;
    const price = priceValue ? parseFloat(priceValue) : undefined;
    const currency = formData.get('currency') as string;
    const categoryIdValue = formData.get('category_id') as string;
    const category_id = categoryIdValue ? BigInt(parseInt(categoryIdValue)) : undefined;
    const is_available = formData.get('is_available') ? formData.get('is_available') === '1' : undefined;
    const is_featured = formData.get('is_featured') ? formData.get('is_featured') === '1' : undefined;
    const image_url = formData.get('image_url') as string;
    const card_color = formData.get('card_color') as string;
    const heading_color = formData.get('heading_color') as string;
    const text_color = formData.get('text_color') as string;
    const sortOrderValue = formData.get('sort_order') as string;
    const sort_order = sortOrderValue ? parseInt(sortOrderValue) : undefined;
    
    // Handle arrays - these might come as JSON strings
    let allergens = undefined;
    let dietary_info = undefined;
    
    const allergensValue = formData.get('allergens') as string;
    if (allergensValue) {
      try {
        allergens = JSON.parse(allergensValue);
      } catch {
        allergens = [allergensValue];
      }
    }
    
    const dietaryInfoValue = formData.get('dietary_info') as string;
    if (dietaryInfoValue) {
      try {
        dietary_info = JSON.parse(dietaryInfoValue);
      } catch {
        dietary_info = [dietaryInfoValue];
      }
    }

    // Build update data object
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (is_available !== undefined) updateData.is_available = is_available;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (allergens !== undefined) updateData.allergens = allergens ? JSON.stringify(allergens) : null;
    if (dietary_info !== undefined) updateData.dietary_info = dietary_info ? JSON.stringify(dietary_info) : null;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (card_color !== undefined) updateData.card_color = card_color;
    if (heading_color !== undefined) updateData.heading_color = heading_color;
    if (text_color !== undefined) updateData.text_color = text_color;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Update menu item
    const updatedItem = await prisma.menu_items.update({
      where: { id: BigInt(params.itemId) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { 
        menu_item: {
          ...updatedItem,
          id: updatedItem.id.toString(),
          menu_id: updatedItem.menu_id.toString(),
          category_id: updatedItem.category_id?.toString() || null,
        }
      },
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
    const item = await prisma.menu_items.findFirst({
      where: {
        id: BigInt(params.itemId),
        menu_id: BigInt(params.id),
        menus: {
          locations: {
            user_id: BigInt(user.id),
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found' },
        { status: 404 }
      );
    }

    await prisma.menu_items.delete({
      where: { id: BigInt(params.itemId) },
    });

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
