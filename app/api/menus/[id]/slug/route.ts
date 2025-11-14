import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/menus/[id]/slug
 * Get menu slug by numeric ID (for backward compatibility redirects)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menuId = params.id;

    // Validate it's a numeric ID
    if (!/^\d+$/.test(menuId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid menu ID' },
        { status: 400 }
      );
    }

    // Get menu slug
    const menu = await prisma.menus.findUnique({
      where: { id: BigInt(menuId) },
      select: { id: true, slug: true, name: true },
    });

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    if (!menu.slug) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Menu does not have a slug. Please run database migration.' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      slug: menu.slug,
      name: menu.name,
    });
  } catch (error) {
    console.error('Error fetching menu slug:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menu slug' },
      { status: 500 }
    );
  }
}
