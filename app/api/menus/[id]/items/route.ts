import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canCreateMenuItem, canAccessFeature } from '@/lib/permissions';

// GET /api/menus/[id]/items - Get all items for a menu
export async function GET(
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

    // Get all menu items
    const items = await prisma.menu_items.findMany({
      where: { menu_id: BigInt(params.id) },
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: { 
        menu_items: items.map(item => ({
          ...item,
          id: item.id.toString(),
          menu_id: item.menu_id.toString(),
          category_id: item.category_id?.toString() || null,
        }))
      },
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

    // DYNAMIC PERMISSION CHECK - Check subscription limits from database
    const permissionCheck = await canCreateMenuItem(user.id);
    
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          message: permissionCheck.reason,
          subscription_limit: true,
          current_count: permissionCheck.current_count,
          limit: permissionCheck.limit
        },
        { status: 403 }
      );
    }

    // Parse FormData instead of JSON
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceValue = formData.get('price') as string;
    const price = priceValue ? parseFloat(priceValue) : 0;
    const currency = formData.get('currency') as string;
    const categoryIdValue = formData.get('category_id') as string;
    const category_id = categoryIdValue ? BigInt(parseInt(categoryIdValue)) : null;
    const is_available = formData.get('is_available') === '1';
    const is_featured = formData.get('is_featured') === '1';
    const is_spicy = formData.get('is_spicy') === '1';
    const image_url = formData.get('image_url') as string;
    
    // Check photo upload permission if image is provided
    if (image_url && image_url.trim() !== '') {
      const photoPermission = await canAccessFeature(user.id, 'photo_uploads');
      
      if (!photoPermission.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Photo uploads require a higher subscription plan.',
            subscription_limit: true
          },
          { status: 403 }
        );
      }
    }
    
    const card_color = formData.get('card_color') as string;
    const heading_color = formData.get('heading_color') as string;
    const text_color = formData.get('text_color') as string;
    const sortOrderValue = formData.get('sort_order') as string;
    const sort_order = sortOrderValue ? parseInt(sortOrderValue) : 0;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Item name is required' },
        { status: 400 }
      );
    }

    if (!priceValue || isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: 'Valid price is required' },
        { status: 400 }
      );
    }

    if (!categoryIdValue || isNaN(parseInt(categoryIdValue)) || category_id === null) {
      return NextResponse.json(
        { success: false, message: 'Valid category is required' },
        { status: 400 }
      );
    }
    
    // Handle arrays - these might come as JSON strings or individual entries
    let allergens = null;
    let dietary_info = null;
    
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

    // Log menu item data for debugging
    console.log('Creating menu item:', { name, price, category_id: category_id?.toString() });

    // Insert menu item
    const item = await prisma.menu_items.create({
      data: {
        menu_id: BigInt(params.id),
        name,
        description: description || null,
        price,
        currency: currency || menu.currency || 'USD',
        category_id,
        is_available: is_available !== undefined ? is_available : true,
        is_featured: is_featured !== undefined ? is_featured : false,
        allergens: allergens ? JSON.stringify(allergens) : null,
        dietary_info: dietary_info ? JSON.stringify(dietary_info) : null,
        image_url: image_url || null,
        card_color: card_color || null,
        heading_color: heading_color || null,
        text_color: text_color || null,
        sort_order: sort_order || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Menu item created successfully',
      data: { 
        menu_item: {
          ...item,
          id: item.id.toString(),
          menu_id: item.menu_id.toString(),
          category_id: item.category_id?.toString() || null,
        }
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
