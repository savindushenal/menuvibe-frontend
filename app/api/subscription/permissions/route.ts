import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { 
  getUserSubscription, 
  getUserUsage, 
  getRemainingQuota,
  canAccessFeature 
} from '@/lib/permissions';

/**
 * GET /api/subscription/permissions
 * Get comprehensive subscription permissions and usage for the authenticated user
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Get subscription info
    const subscription = await getUserSubscription(user.id);
    
    if (!subscription) {
      return NextResponse.json({
        success: false,
        message: 'No active subscription found',
      }, { status: 404 });
    }

    // Get current usage
    const usage = await getUserUsage(user.id);

    // Get remaining quotas
    const [
      locationsQuota,
      menusQuota,
      menuItemsQuota,
      qrCodesQuota
    ] = await Promise.all([
      getRemainingQuota(user.id, 'locations'),
      getRemainingQuota(user.id, 'menus'),
      getRemainingQuota(user.id, 'menu_items'),
      getRemainingQuota(user.id, 'qr_codes')
    ]);

    // Check feature access
    const featureAccess = {
      photo_uploads: await canAccessFeature(user.id, 'photo_uploads'),
      custom_qr_codes: await canAccessFeature(user.id, 'custom_qr_codes'),
      table_specific_qr: await canAccessFeature(user.id, 'table_specific_qr'),
      analytics: await canAccessFeature(user.id, 'analytics'),
      advanced_analytics: await canAccessFeature(user.id, 'advanced_analytics'),
      online_ordering: await canAccessFeature(user.id, 'online_ordering'),
      api_access: await canAccessFeature(user.id, 'api_access'),
      white_label: await canAccessFeature(user.id, 'white_label'),
      priority_support: await canAccessFeature(user.id, 'priority_support'),
      dedicated_support: await canAccessFeature(user.id, 'dedicated_support'),
    };

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          plan_name: subscription.plan_name,
          plan_slug: subscription.plan_slug,
          is_active: subscription.is_active,
        },
        limits: subscription.limits,
        usage: {
          locations: usage.locations_count,
          menus: usage.menus_count,
          menu_items: usage.menu_items_count,
          qr_codes: usage.qr_codes_count,
        },
        quotas: {
          locations: {
            current: locationsQuota.current,
            limit: locationsQuota.limit,
            remaining: locationsQuota.remaining,
            unlimited: locationsQuota.unlimited,
            can_create: locationsQuota.unlimited || locationsQuota.remaining > 0,
          },
          menus: {
            current: menusQuota.current,
            limit: menusQuota.limit,
            remaining: menusQuota.remaining,
            unlimited: menusQuota.unlimited,
            can_create: menusQuota.unlimited || menusQuota.remaining > 0,
          },
          menu_items: {
            current: menuItemsQuota.current,
            limit: menuItemsQuota.limit,
            remaining: menuItemsQuota.remaining,
            unlimited: menuItemsQuota.unlimited,
            can_create: menuItemsQuota.unlimited || menuItemsQuota.remaining > 0,
          },
          qr_codes: {
            current: qrCodesQuota.current,
            limit: qrCodesQuota.limit,
            remaining: qrCodesQuota.remaining,
            unlimited: qrCodesQuota.unlimited,
            can_create: qrCodesQuota.unlimited || qrCodesQuota.remaining > 0,
          },
        },
        features: {
          photo_uploads: featureAccess.photo_uploads.allowed,
          custom_qr_codes: featureAccess.custom_qr_codes.allowed,
          table_specific_qr: featureAccess.table_specific_qr.allowed,
          analytics: featureAccess.analytics.allowed,
          advanced_analytics: featureAccess.advanced_analytics.allowed,
          online_ordering: featureAccess.online_ordering.allowed,
          api_access: featureAccess.api_access.allowed,
          white_label: featureAccess.white_label.allowed,
          priority_support: featureAccess.priority_support.allowed,
          dedicated_support: featureAccess.dedicated_support.allowed,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching subscription permissions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscription permissions' },
      { status: 500 }
    );
  }
}
