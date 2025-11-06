import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

/**
 * GET /api/subscription/check
 * Check if user has active subscription, create Free plan if not
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Check for active subscription
    const activeSubscription = await queryOne<any>(
      `SELECT 
        us.id,
        us.status,
        us.is_active,
        sp.name as plan_name,
        sp.slug as plan_slug
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.user_id = ? 
         AND (us.is_active = 1 OR us.status = 'active')
       ORDER BY us.created_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (activeSubscription) {
      return NextResponse.json({
        success: true,
        message: 'User has active subscription',
        data: {
          has_subscription: true,
          subscription: activeSubscription,
        },
      });
    }

    // No active subscription found - create Free plan
    console.log(`No active subscription for user ${user.id}, creating Free plan...`);

    // Get Free plan
    const freePlan = await queryOne<any>(
      'SELECT id, name FROM subscription_plans WHERE slug = ? AND is_active = 1 LIMIT 1',
      ['free']
    );

    if (!freePlan) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Free plan not found in database. Please contact support.',
          data: { has_subscription: false }
        },
        { status: 500 }
      );
    }

    // Deactivate any old subscriptions
    await query(
      'UPDATE user_subscriptions SET is_active = 0, status = ? WHERE user_id = ?',
      ['cancelled', user.id]
    );

    // Create new Free subscription
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO user_subscriptions 
       (user_id, subscription_plan_id, status, is_active, starts_at, created_at, updated_at) 
       VALUES (?, ?, 'active', 1, NOW(), NOW(), NOW())`,
      [user.id, freePlan.id]
    );

    // Get newly created subscription
    const newSubscription = await queryOne<any>(
      `SELECT 
        us.id,
        us.status,
        us.is_active,
        sp.name as plan_name,
        sp.slug as plan_slug
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Free subscription created successfully',
      data: {
        has_subscription: true,
        subscription: newSubscription,
        auto_created: true,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error checking/creating subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription/check
 * Manually activate a specific subscription plan for user (admin/debug)
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { plan_slug } = body;

    if (!plan_slug) {
      return NextResponse.json(
        { success: false, message: 'plan_slug is required' },
        { status: 400 }
      );
    }

    // Get the plan
    const plan = await queryOne<any>(
      'SELECT id, name, slug FROM subscription_plans WHERE slug = ? AND is_active = 1',
      [plan_slug]
    );

    if (!plan) {
      return NextResponse.json(
        { success: false, message: `Plan '${plan_slug}' not found` },
        { status: 404 }
      );
    }

    // Deactivate old subscriptions
    await query(
      'UPDATE user_subscriptions SET is_active = 0, status = ?, ends_at = NOW() WHERE user_id = ?',
      ['cancelled', user.id]
    );

    // Create new subscription
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO user_subscriptions 
       (user_id, subscription_plan_id, status, is_active, starts_at, created_at, updated_at) 
       VALUES (?, ?, 'active', 1, NOW(), NOW(), NOW())`,
      [user.id, plan.id]
    );

    // Get newly created subscription
    const newSubscription = await queryOne<any>(
      `SELECT 
        us.*,
        sp.name as plan_name,
        sp.slug as plan_slug,
        sp.limits,
        sp.features
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: `${plan.name} subscription activated successfully`,
      data: { subscription: newSubscription },
    }, { status: 201 });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}
