/**
 * Dynamic Subscription Permission System
 * 
 * This module provides centralized subscription limit checking based on
 * database subscription plans. All limits are pulled from the database
 * dynamically, avoiding hardcoded restrictions in the codebase.
 */

import { query, queryOne } from './db';
import pool from './db';
import { ResultSetHeader } from 'mysql2';

export interface SubscriptionLimits {
  max_locations: number;
  max_menus_per_location: number;
  max_menu_items_total: number;
  max_qr_codes: number;
  photo_uploads: boolean;
  custom_qr_codes: boolean;
  table_specific_qr: boolean;
  analytics: boolean;
  advanced_analytics: boolean;
  online_ordering: boolean;
  api_access: boolean;
  white_label: boolean;
  priority_support: boolean;
  dedicated_support: boolean;
  sla_guarantee: boolean;
  custom_integrations: boolean;
  [key: string]: number | boolean; // Allow dynamic access
}

export interface UserSubscriptionInfo {
  plan_name: string;
  plan_slug: string;
  limits: SubscriptionLimits;
  subscription_id: number;
  is_active: boolean;
}

/**
 * Get user's current subscription with limits from database
 * If no subscription found, automatically assigns Free plan
 */
export async function getUserSubscription(userId: number): Promise<UserSubscriptionInfo | null> {
  try {
    const subscription = await queryOne<any>(
      `SELECT 
        us.id as subscription_id,
        us.is_active,
        us.status,
        sp.name as plan_name,
        sp.slug as plan_slug,
        sp.limits
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.user_id = ? 
         AND (us.is_active = 1 OR us.status = 'active')
       ORDER BY us.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!subscription) {
      // If no subscription found, check if user exists and create free subscription
      console.log(`No active subscription found for user ${userId}`);
      return null;
    }

    // Ensure subscription is actually active
    if (subscription.is_active !== 1 && subscription.status !== 'active') {
      console.log(`User ${userId} has subscription but it's not active: is_active=${subscription.is_active}, status=${subscription.status}`);
      return null;
    }

    // Parse JSON limits from database
    const limits: SubscriptionLimits = typeof subscription.limits === 'string'
      ? JSON.parse(subscription.limits)
      : subscription.limits;

    return {
      plan_name: subscription.plan_name,
      plan_slug: subscription.plan_slug,
      limits,
      subscription_id: subscription.subscription_id,
      is_active: subscription.is_active === 1 || subscription.status === 'active',
    };
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

/**
 * Get user subscription or auto-assign Free plan if none exists
 */
async function getUserSubscriptionOrCreateFree(userId: number): Promise<UserSubscriptionInfo | null> {
  let subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    // Try to auto-create Free subscription
    try {
      // Get Free plan
      const freePlan = await queryOne<any>(
        'SELECT id, name, slug, limits FROM subscription_plans WHERE slug = ? AND is_active = 1 LIMIT 1',
        ['free']
      );

      if (freePlan) {
        // Deactivate old subscriptions
        await query(
          'UPDATE user_subscriptions SET is_active = 0, status = ? WHERE user_id = ?',
          ['cancelled', userId]
        );

        // Create Free subscription
        const [result] = await pool.execute<ResultSetHeader>(
          `INSERT INTO user_subscriptions 
           (user_id, subscription_plan_id, status, is_active, starts_at, created_at, updated_at) 
           VALUES (?, ?, 'active', 1, NOW(), NOW(), NOW())`,
          [userId, freePlan.id]
        );

        console.log(`Auto-created Free subscription for user ${userId}`);
        
        // Return the newly created subscription
        const limits: SubscriptionLimits = typeof freePlan.limits === 'string'
          ? JSON.parse(freePlan.limits)
          : freePlan.limits;

        subscription = {
          plan_name: freePlan.name,
          plan_slug: freePlan.slug,
          limits,
          subscription_id: result.insertId,
          is_active: true,
        };
      }
    } catch (error) {
      console.error('Error auto-creating Free subscription:', error);
    }
  }
  
  return subscription;
}

/**
 * Get current usage counts for a user
 */
export async function getUserUsage(userId: number): Promise<{
  locations_count: number;
  menus_count: number;
  menu_items_count: number;
  qr_codes_count: number;
}> {
  try {
    const [locationsResult, menusResult, itemsResult, qrCodesResult] = await Promise.all([
      queryOne<any>('SELECT COUNT(*) as count FROM locations WHERE user_id = ?', [userId]),
      queryOne<any>('SELECT COUNT(*) as count FROM menus m JOIN locations l ON m.location_id = l.id WHERE l.user_id = ?', [userId]),
      queryOne<any>('SELECT COUNT(*) as count FROM menu_items mi JOIN menus m ON mi.menu_id = m.id JOIN locations l ON m.location_id = l.id WHERE l.user_id = ?', [userId]),
      queryOne<any>('SELECT COUNT(*) as count FROM qr_codes q JOIN locations l ON q.location_id = l.id WHERE l.user_id = ?', [userId]),
    ]);

    return {
      locations_count: locationsResult?.count || 0,
      menus_count: menusResult?.count || 0,
      menu_items_count: itemsResult?.count || 0,
      qr_codes_count: qrCodesResult?.count || 0,
    };
  } catch (error) {
    console.error('Error fetching user usage:', error);
    return {
      locations_count: 0,
      menus_count: 0,
      menu_items_count: 0,
      qr_codes_count: 0,
    };
  }
}

/**
 * Get menus count for a specific location
 */
export async function getLocationMenusCount(locationId: number): Promise<number> {
  try {
    const result = await queryOne<any>(
      'SELECT COUNT(*) as count FROM menus WHERE location_id = ?',
      [locationId]
    );
    return result?.count || 0;
  } catch (error) {
    console.error('Error fetching location menus count:', error);
    return 0;
  }
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  current_count?: number;
  limit?: number | boolean;
  upgrade_required?: boolean;
}

/**
 * Check if user can create a new location
 */
export async function canCreateLocation(userId: number): Promise<PermissionCheckResult> {
  const subscription = await getUserSubscriptionOrCreateFree(userId);
  
  if (!subscription) {
    return {
      allowed: false,
      reason: 'Unable to determine subscription status. Please contact support.',
      upgrade_required: true,
    };
  }

  const usage = await getUserUsage(userId);
  const limit = subscription.limits.max_locations;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true };
  }

  if (usage.locations_count >= limit) {
    return {
      allowed: false,
      reason: `You have reached your limit of ${limit} location(s). Upgrade to add more locations.`,
      current_count: usage.locations_count,
      limit,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    current_count: usage.locations_count,
    limit,
  };
}

/**
 * Check if user can create a new menu at a specific location
 */
export async function canCreateMenu(userId: number, locationId: number): Promise<PermissionCheckResult> {
  const subscription = await getUserSubscriptionOrCreateFree(userId);
  
  if (!subscription) {
    return {
      allowed: false,
      reason: 'Unable to determine subscription status. Please contact support.',
      upgrade_required: true,
    };
  }

  const menusCount = await getLocationMenusCount(locationId);
  const limit = subscription.limits.max_menus_per_location;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true };
  }

  if (menusCount >= limit) {
    return {
      allowed: false,
      reason: `You have reached your limit of ${limit} menu(s) per location. Upgrade to add more menus.`,
      current_count: menusCount,
      limit,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    current_count: menusCount,
    limit,
  };
}

/**
 * Check if user can create menu items
 */
export async function canCreateMenuItem(userId: number): Promise<PermissionCheckResult> {
  const subscription = await getUserSubscriptionOrCreateFree(userId);
  
  if (!subscription) {
    return {
      allowed: false,
      reason: 'Unable to determine subscription status. Please contact support.',
      upgrade_required: true,
    };
  }

  const usage = await getUserUsage(userId);
  const limit = subscription.limits.max_menu_items_total;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true };
  }

  if (usage.menu_items_count >= limit) {
    return {
      allowed: false,
      reason: `You have reached your limit of ${limit} menu items. Upgrade to add more items.`,
      current_count: usage.menu_items_count,
      limit,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    current_count: usage.menu_items_count,
    limit,
  };
}

/**
 * Check if user can create QR codes
 */
export async function canCreateQRCode(userId: number, options?: { table_specific?: boolean }): Promise<PermissionCheckResult> {
  const subscription = await getUserSubscriptionOrCreateFree(userId);
  
  if (!subscription) {
    return {
      allowed: false,
      reason: 'Unable to determine subscription status. Please contact support.',
      upgrade_required: true,
    };
  }

  // Check table-specific QR code permission
  if (options?.table_specific && !subscription.limits.table_specific_qr) {
    return {
      allowed: false,
      reason: 'Table-specific QR codes require a higher subscription plan.',
      upgrade_required: true,
    };
  }

  const usage = await getUserUsage(userId);
  const limit = subscription.limits.max_qr_codes;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true };
  }

  if (usage.qr_codes_count >= limit) {
    return {
      allowed: false,
      reason: `You have reached your limit of ${limit} QR code(s). Upgrade for unlimited QR codes.`,
      current_count: usage.qr_codes_count,
      limit,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    current_count: usage.qr_codes_count,
    limit,
  };
}

/**
 * Check if user has access to a specific feature
 */
export async function canAccessFeature(userId: number, feature: keyof SubscriptionLimits): Promise<PermissionCheckResult> {
  const subscription = await getUserSubscriptionOrCreateFree(userId);
  
  if (!subscription) {
    return {
      allowed: false,
      reason: 'Unable to determine subscription status. Please contact support.',
      upgrade_required: true,
    };
  }

  const hasAccess = subscription.limits[feature];

  if (typeof hasAccess === 'boolean') {
    if (!hasAccess) {
      return {
        allowed: false,
        reason: `This feature requires a higher subscription plan.`,
        upgrade_required: true,
      };
    }
    return { allowed: true };
  }

  // For numeric limits, just check if they exist
  if (typeof hasAccess === 'number' && hasAccess !== 0) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `This feature is not available in your current plan.`,
    upgrade_required: true,
  };
}

/**
 * Get user's remaining quota for a specific resource
 */
export async function getRemainingQuota(userId: number, resource: 'locations' | 'menus' | 'menu_items' | 'qr_codes'): Promise<{
  current: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}> {
  const subscription = await getUserSubscriptionOrCreateFree(userId);
  const usage = await getUserUsage(userId);

  if (!subscription) {
    return { current: 0, limit: 0, remaining: 0, unlimited: false };
  }

  let current = 0;
  let limit = 0;

  switch (resource) {
    case 'locations':
      current = usage.locations_count;
      limit = subscription.limits.max_locations;
      break;
    case 'menus':
      current = usage.menus_count;
      limit = subscription.limits.max_menus_per_location;
      break;
    case 'menu_items':
      current = usage.menu_items_count;
      limit = subscription.limits.max_menu_items_total;
      break;
    case 'qr_codes':
      current = usage.qr_codes_count;
      limit = subscription.limits.max_qr_codes;
      break;
  }

  const unlimited = limit === -1;
  const remaining = unlimited ? -1 : Math.max(0, limit - current);

  return {
    current,
    limit,
    remaining,
    unlimited,
  };
}
