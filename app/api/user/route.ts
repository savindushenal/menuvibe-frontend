import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Get user from token
  const authUser = await getUserFromToken(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get user details
    const user = await queryOne<any>(
      'SELECT id, name, email, email_verified_at, created_at, updated_at FROM users WHERE id = ?',
      [authUser.id]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's subscription
    const subscription = await queryOne<any>(
      `SELECT 
        us.id,
        us.status,
        us.starts_at,
        us.ends_at,
        sp.name as plan_name,
        sp.price,
        sp.billing_period,
        sp.features,
        sp.limits
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
      WHERE us.user_id = ? AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1`,
      [user.id]
    );

    // Parse JSON fields in subscription
    if (subscription) {
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
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        subscription: subscription || null
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
