import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { queryOne } from '@/lib/db';

// GET /api/subscription/current - Get current user's subscription
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const subscription = await queryOne<any>(
      `SELECT us.*, sp.name, sp.price, sp.billing_period, sp.features, sp.limits
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.user_id = ? AND us.status = 'active'
       ORDER BY us.created_at DESC LIMIT 1`,
      [user.id]
    );

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: { subscription: null },
      });
    }

    // Parse JSON fields
    try {
      subscription.features = typeof subscription.features === 'string' 
        ? JSON.parse(subscription.features) 
        : subscription.features;
      subscription.limits = typeof subscription.limits === 'string' 
        ? JSON.parse(subscription.limits) 
        : subscription.limits;
    } catch (e) {
      console.error('Error parsing subscription JSON:', e);
    }

    return NextResponse.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
