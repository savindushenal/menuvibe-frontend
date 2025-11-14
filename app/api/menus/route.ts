import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canCreateMenu } from '@/lib/permissions';
import { generateMenuSlug } from '@/lib/slug';

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
      location = await prisma.locations.findFirst({
        where: {
          id: BigInt(locationId),
          user_id: BigInt(user.id),
        },
      });
    } else {
      // Get user's default location
      location = await prisma.locations.findFirst({
        where: {
          user_id: BigInt(user.id),
          is_default: true,
        },
      });
    }

    if (!location) {
      // Return empty menus array instead of error
      return NextResponse.json({
        success: true,
        data: { menus: [] },
        message: 'No location found. Please create a location first.'
      });
    }

    // Get menus with their items using Prisma
    const menus = await prisma.menus.findMany({
      where: { location_id: location.id },
      include: {
        menu_items: {
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'desc' },
      ],
    });

    // Format the response and convert BigInt to strings
    const menusWithItems = menus.map((menu: any) => {
      const { menu_items, ...menuData } = menu;
      return {
        ...menuData,
        id: menu.id.toString(),
        location_id: menu.location_id.toString(),
        items: menu_items.map((item: any) => ({
          ...item,
          id: item.id.toString(),
          menu_id: item.menu_id.toString(),
          category_id: item.category_id?.toString() || null,
        })),
      };
    });

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
    const location = await prisma.locations.findFirst({
      where: {
        user_id: BigInt(user.id),
        is_default: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'No location found. Please create a location first.' },
        { status: 404 }
      );
    }

    // DYNAMIC PERMISSION CHECK - Check subscription limits from database
    const permissionCheck = await canCreateMenu(user.id, Number(location.id));
    
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

    // Generate unique slug for menu
    const { slug, publicId } = await generateMenuSlug(
      name,
      location.name
    );

    // Insert menu using Prisma
    const menu = await prisma.menus.create({
      data: {
        location_id: location.id,
        name,
        slug,
        public_id: publicId,
        description: description || null,
        style: style || 'modern',
        currency: currency || 'USD',
        is_active: is_active !== undefined ? is_active : true,
        is_featured: is_featured !== undefined ? is_featured : false,
        sort_order: sort_order || 0,
      },
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializedMenu = {
      ...menu,
      id: menu.id.toString(),
      location_id: menu.location_id.toString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Menu created successfully',
      data: { menu: { ...serializedMenu, items: [] } },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create menu' },
      { status: 500 }
    );
  }
}
