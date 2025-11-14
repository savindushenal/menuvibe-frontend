import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/menus/[id]/categories - Get all categories for a menu
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

    // Get all categories
    const categories = await prisma.menu_categories.findMany({
      where: { menu_id: BigInt(params.id) },
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: { 
        categories: categories.map(cat => ({
          ...cat,
          id: cat.id.toString(),
          menu_id: cat.menu_id.toString(),
        }))
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/menus/[id]/categories - Create a new category
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

    const body = await request.json();
    const { name, description, sort_order } = body;

    // Insert category
    const category = await prisma.menu_categories.create({
      data: {
        menu_id: BigInt(params.id),
        name,
        description: description || null,
        sort_order: sort_order || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: { 
        category: {
          ...category,
          id: category.id.toString(),
          menu_id: category.menu_id.toString(),
        }
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
