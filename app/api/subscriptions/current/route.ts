import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { queryOne } from '@/lib/db';

// GET /api/subscriptions/current - Get current user's subscription
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const subscription = await queryOne<any>(
      `SELECT us.*, sp.name, sp.slug, sp.price, sp.billing_period, sp.features, sp.limits
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.user_id = ? 
         AND us.status = 'active'
         AND (us.ends_at IS NULL OR us.ends_at > NOW())
       ORDER BY 
         CASE WHEN sp.slug = 'enterprise' THEN 1
              WHEN sp.slug = 'pro' THEN 2
              WHEN sp.slug = 'free' THEN 3
              ELSE 4
         END,
         us.created_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (!subscription) {
      console.log(`No active subscription found for user ${user.id}`);
      return NextResponse.json({
        success: true,
        data: { subscription: null },
      });
    }

    console.log(`Found subscription for user ${user.id}: ${subscription.name} (${subscription.slug})`);

    // Parse JSON fields
    const parsedSubscription = {
      ...subscription,
      features: subscription.features ? JSON.parse(subscription.features) : {},
      limits: subscription.limits ? JSON.parse(subscription.limits) : {},
    };

    return NextResponse.json({
      success: true,
      data: { subscription: parsedSubscription },
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
