import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/dashboard/stats - Get dashboard overview statistics
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Get user's menus
    const userMenus = await query<any>(
      `SELECT m.id FROM menus m 
       JOIN locations l ON m.location_id = l.id 
       WHERE l.user_id = ?`,
      [user.id]
    );
    const menuIds = userMenus.map(m => m.id);
    const menuFilter = menuIds.length > 0 ? `AND ae.menu_id IN (${menuIds.join(',')})` : 'AND 1=0';

    // Get current period stats (last 30 days)
    const currentPeriodStats = await queryOne<any>(
      `SELECT 
        COUNT(CASE WHEN event_type = 'menu_view' THEN 1 END) as total_views,
        COUNT(CASE WHEN event_type = 'qr_scan' THEN 1 END) as total_scans,
        COUNT(DISTINCT session_id) as unique_visitors
       FROM analytics_events ae 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ${menuFilter}`
    ) || { total_views: 0, total_scans: 0, unique_visitors: 0 };

    // Get previous period stats (30-60 days ago) for comparison
    const previousPeriodStats = await queryOne<any>(
      `SELECT 
        COUNT(CASE WHEN event_type = 'menu_view' THEN 1 END) as total_views,
        COUNT(CASE WHEN event_type = 'qr_scan' THEN 1 END) as total_scans,
        COUNT(DISTINCT session_id) as unique_visitors
       FROM analytics_events ae 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) 
       AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) ${menuFilter}`
    ) || { total_views: 0, total_scans: 0, unique_visitors: 0 };

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): { value: number; trend: 'up' | 'down' } => {
      if (previous === 0) {
        return { value: current > 0 ? 100 : 0, trend: 'up' };
      }
      const change = ((current - previous) / previous) * 100;
      return { 
        value: Math.abs(Math.round(change * 10) / 10), 
        trend: change >= 0 ? 'up' : 'down' 
      };
    };

    const viewsChange = calculateChange(currentPeriodStats.total_views, previousPeriodStats.total_views);
    const scansChange = calculateChange(currentPeriodStats.total_scans, previousPeriodStats.total_scans);
    const visitorsChange = calculateChange(currentPeriodStats.unique_visitors, previousPeriodStats.unique_visitors);

    // Get total menu items count
    const menuItemsCount = await queryOne<any>(
      `SELECT COUNT(*) as count 
       FROM menu_items mi 
       JOIN menus m ON mi.menu_id = m.id
       JOIN locations l ON m.location_id = l.id
       WHERE l.user_id = ?`,
      [user.id]
    );

    // Get previous menu items count (rough estimate based on items created more than 30 days ago)
    const previousMenuItemsCount = await queryOne<any>(
      `SELECT COUNT(*) as count 
       FROM menu_items mi 
       JOIN menus m ON mi.menu_id = m.id
       JOIN locations l ON m.location_id = l.id
       WHERE l.user_id = ? AND mi.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [user.id]
    );

    const itemsAdded = menuItemsCount.count - previousMenuItemsCount.count;

    // Get recent activity (last 10 events)
    const recentActivity = await query<any>(
      `SELECT 
        ae.event_type,
        ae.created_at,
        m.name as menu_name,
        mi.name as item_name,
        ae.table_number
       FROM analytics_events ae
       LEFT JOIN menus m ON ae.menu_id = m.id
       LEFT JOIN menu_items mi ON ae.item_id = mi.id
       WHERE ae.menu_id IN (${menuIds.length > 0 ? menuIds.join(',') : '0'})
       ORDER BY ae.created_at DESC
       LIMIT 10`
    );

    // Get popular items (most viewed in last 30 days)
    const popularItems = await query<any>(
      `SELECT 
        mi.id,
        mi.name,
        COUNT(*) as view_count
       FROM analytics_events ae
       JOIN menu_items mi ON ae.item_id = mi.id
       WHERE ae.event_type IN ('item_view', 'order_placed')
       AND ae.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ${menuFilter}
       GROUP BY mi.id, mi.name
       ORDER BY view_count DESC
       LIMIT 5`
    );

    // Format stats for frontend
    const stats = {
      totalViews: {
        value: currentPeriodStats.total_views,
        change: viewsChange.value,
        trend: viewsChange.trend,
        formatted: currentPeriodStats.total_views.toLocaleString()
      },
      qrScans: {
        value: currentPeriodStats.total_scans,
        change: scansChange.value,
        trend: scansChange.trend,
        formatted: currentPeriodStats.total_scans.toLocaleString()
      },
      menuItems: {
        value: menuItemsCount.count,
        change: itemsAdded,
        trend: itemsAdded >= 0 ? 'up' : 'down',
        formatted: menuItemsCount.count.toLocaleString()
      },
      activeCustomers: {
        value: currentPeriodStats.unique_visitors,
        change: visitorsChange.value,
        trend: visitorsChange.trend,
        formatted: currentPeriodStats.unique_visitors.toLocaleString()
      }
    };

    // Format recent activity
    const formattedActivity = recentActivity.map((activity: any) => {
      let description = '';
      switch (activity.event_type) {
        case 'qr_scan':
          description = `QR code scanned${activity.table_number ? ` at Table ${activity.table_number}` : ''}`;
          break;
        case 'menu_view':
          description = `Menu viewed${activity.menu_name ? `: ${activity.menu_name}` : ''}`;
          break;
        case 'item_view':
          description = `Item viewed${activity.item_name ? `: ${activity.item_name}` : ''}`;
          break;
        case 'order_placed':
          description = `Order placed${activity.table_number ? ` at Table ${activity.table_number}` : ''}`;
          break;
        default:
          description = activity.event_type;
      }

      // Calculate time ago
      const now = new Date();
      const eventTime = new Date(activity.created_at);
      const diffMs = now.getTime() - eventTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo = '';
      if (diffDays > 0) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMins > 0) {
        timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = 'Just now';
      }

      return {
        description,
        timeAgo,
        type: activity.event_type
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentActivity: formattedActivity,
        popularItems: popularItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          viewCount: item.view_count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
