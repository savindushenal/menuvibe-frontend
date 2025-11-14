import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/dashboard/stats - Get dashboard overview statistics
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Get menu items count
    const menuItemsCount = await prisma.menu_items.count({
      where: {
        menus: {
          locations: {
            user_id: BigInt(user.id)
          }
        }
      }
    });

    // Return simplified stats (analytics requires separate table)
    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalViews: { value: 0, change: 0, trend: 'up', formatted: '0' },
          qrScans: { value: 0, change: 0, trend: 'up', formatted: '0' },
          menuItems: { value: menuItemsCount, change: 0, trend: 'up', formatted: menuItemsCount.toString() },
          activeCustomers: { value: 0, change: 0, trend: 'up', formatted: '0' }
        },
        recentActivity: [],
        popularItems: []
      },
      message: 'Full analytics requires analytics_events table'
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
