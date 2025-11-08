import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/analytics/stats - Get analytics statistics for a user's menus
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menu_id');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, 1y
    const timeZone = searchParams.get('timezone') || 'UTC';

    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = 'AND ae.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        dateFilter = 'AND ae.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case '90d':
        dateFilter = 'AND ae.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        break;
      case '1y':
        dateFilter = 'AND ae.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
    }

    // Base query to get user's menus
    let menuFilter = '';
    if (menuId) {
      // Verify menu belongs to user
      const menu = await queryOne<any>(
        `SELECT m.id FROM menus m 
         JOIN locations l ON m.location_id = l.id 
         WHERE m.id = ? AND l.user_id = ?`,
        [menuId, user.id]
      );
      if (!menu) {
        return NextResponse.json(
          { success: false, message: 'Menu not found or access denied' },
          { status: 404 }
        );
      }
      menuFilter = `AND ae.menu_id = ${menuId}`;
    } else {
      // Get all user's menus
      const userMenuIds = await query<any>(
        `SELECT m.id FROM menus m 
         JOIN locations l ON m.location_id = l.id 
         WHERE l.user_id = ?`,
        [user.id]
      );
      const menuIds = userMenuIds.map(m => m.id).join(',');
      if (menuIds) {
        menuFilter = `AND ae.menu_id IN (${menuIds})`;
      } else {
        // No menus found, return empty stats
        return NextResponse.json({
          success: true,
          data: {
            overview: { total_scans: 0, total_views: 0, total_orders: 0, unique_visitors: 0 },
            timeline: [],
            popular_items: [],
            popular_tables: [],
            devices: [],
            hourly_pattern: []
          }
        });
      }
    }

    // Overview stats
    const overview = await queryOne<any>(
      `SELECT 
        COUNT(CASE WHEN event_type = 'qr_scan' THEN 1 END) as total_scans,
        COUNT(CASE WHEN event_type = 'menu_view' THEN 1 END) as total_views,
        COUNT(CASE WHEN event_type = 'order_placed' THEN 1 END) as total_orders,
        COUNT(DISTINCT session_id) as unique_visitors
       FROM analytics_events ae 
       WHERE 1=1 ${dateFilter} ${menuFilter}`
    );

    // Timeline data (daily breakdown)
    const timeline = await query<any>(
      `SELECT 
        DATE(ae.created_at) as date,
        COUNT(CASE WHEN event_type = 'qr_scan' THEN 1 END) as scans,
        COUNT(CASE WHEN event_type = 'menu_view' THEN 1 END) as views,
        COUNT(CASE WHEN event_type = 'order_placed' THEN 1 END) as orders
       FROM analytics_events ae 
       WHERE 1=1 ${dateFilter} ${menuFilter}
       GROUP BY DATE(ae.created_at) 
       ORDER BY date DESC`
    );

    // Popular items
    const popularItems = await query<any>(
      `SELECT 
        mi.name,
        COUNT(*) as interactions,
        COUNT(CASE WHEN ae.event_type = 'item_view' THEN 1 END) as views,
        COUNT(CASE WHEN ae.event_type = 'order_placed' THEN 1 END) as orders
       FROM analytics_events ae
       JOIN menu_items mi ON ae.item_id = mi.id
       WHERE ae.item_id IS NOT NULL ${dateFilter} ${menuFilter}
       GROUP BY ae.item_id, mi.name
       ORDER BY interactions DESC
       LIMIT 10`
    );

    // Popular tables
    const popularTables = await query<any>(
      `SELECT 
        table_number,
        COUNT(*) as scans
       FROM analytics_events ae
       WHERE table_number IS NOT NULL AND event_type = 'qr_scan' ${dateFilter} ${menuFilter}
       GROUP BY table_number
       ORDER BY scans DESC
       LIMIT 10`
    );

    // Device breakdown (simplified)
    const devices = await query<any>(
      `SELECT 
        CASE 
          WHEN user_agent LIKE '%Mobile%' OR user_agent LIKE '%Android%' THEN 'Mobile'
          WHEN user_agent LIKE '%iPad%' OR user_agent LIKE '%Tablet%' THEN 'Tablet'
          ELSE 'Desktop'
        END as device_type,
        COUNT(*) as count
       FROM analytics_events ae
       WHERE 1=1 ${dateFilter} ${menuFilter}
       GROUP BY device_type`
    );

    // Hourly pattern
    const hourlyPattern = await query<any>(
      `SELECT 
        HOUR(ae.created_at) as hour,
        COUNT(*) as activity
       FROM analytics_events ae
       WHERE 1=1 ${dateFilter} ${menuFilter}
       GROUP BY HOUR(ae.created_at)
       ORDER BY hour`
    );

    // Category distribution (based on menu items in user's menus)
    const categoryDistribution = await query<any>(
      `SELECT 
        mc.name as category_name,
        COUNT(mi.id) as item_count,
        COUNT(CASE WHEN ae.id IS NOT NULL THEN 1 END) as interactions
       FROM menu_categories mc
       JOIN menus m ON mc.menu_id = m.id
       JOIN locations l ON m.location_id = l.id
       LEFT JOIN menu_items mi ON mc.id = mi.category_id
       LEFT JOIN analytics_events ae ON mi.id = ae.item_id ${dateFilter}
       WHERE l.user_id = ?
       GROUP BY mc.id, mc.name
       HAVING item_count > 0
       ORDER BY interactions DESC, item_count DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: overview || { total_scans: 0, total_views: 0, total_orders: 0, unique_visitors: 0 },
        timeline,
        popular_items: popularItems,
        popular_tables: popularTables,
        devices,
        hourly_pattern: hourlyPattern,
        category_distribution: categoryDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}