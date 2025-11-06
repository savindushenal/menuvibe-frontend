import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// POST /api/subscriptions/change - Upgrade or downgrade subscription
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { plan_id } = body;

    if (!plan_id) {
      return NextResponse.json(
        { success: false, message: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get the new plan
    const newPlan = await queryOne<any>(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1',
      [plan_id]
    );

    if (!newPlan) {
      return NextResponse.json(
        { success: false, message: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Get current subscription
    const currentSubscription = await queryOne<any>(
      `SELECT us.*, sp.name as current_plan_name, sp.slug as current_plan_slug, sp.price as current_price
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.user_id = ? AND us.status = 'active'
       ORDER BY us.created_at DESC LIMIT 1`,
      [user.id]
    );

    // Determine if upgrade or downgrade
    const isUpgrade = currentSubscription 
      ? newPlan.price > currentSubscription.current_price 
      : true;

    const changeType = isUpgrade ? 'upgrade' : 'downgrade';

    // Deactivate current subscription (set both status and is_active)
    if (currentSubscription) {
      await query(
        'UPDATE user_subscriptions SET status = ?, is_active = 0, ends_at = NOW(), updated_at = NOW() WHERE id = ?',
        ['cancelled', currentSubscription.id]
      );
    }

    // Create new subscription (set both status='active' AND is_active=1)
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO user_subscriptions 
       (user_id, subscription_plan_id, status, starts_at, is_active, created_at, updated_at) 
       VALUES (?, ?, 'active', NOW(), 1, NOW(), NOW())`,
      [user.id, plan_id]
    );

    // Get the newly created subscription with plan details
    const newSubscription = await queryOne<any>(
      `SELECT us.*, sp.name, sp.slug, sp.price, sp.billing_period, sp.features, sp.limits
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.id = ?`,
      [result.insertId]
    );

    // Parse JSON fields
    if (newSubscription) {
      newSubscription.features = newSubscription.features 
        ? JSON.parse(newSubscription.features) 
        : {};
      newSubscription.limits = newSubscription.limits 
        ? JSON.parse(newSubscription.limits) 
        : {};
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${changeType}d to ${newPlan.name} plan`,
      data: {
        subscription: newSubscription,
        change_type: changeType,
        previous_plan: currentSubscription?.current_plan_name || 'None',
        new_plan: newPlan.name
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error changing subscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to change subscription',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
