import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/subscription/current - Get current user's subscription
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: BigInt(user.id),
        status: 'active'
      },
      include: {
        subscription_plans: {
          select: {
            name: true,
            price: true,
            billing_period: true,
            features: true,
            limits: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: { subscription: null },
      });
    }

    // Parse JSON fields and format response
    const formattedSubscription = {
      ...subscription,
      id: subscription.id.toString(),
      user_id: subscription.user_id.toString(),
      subscription_plan_id: subscription.subscription_plan_id.toString(),
      name: subscription.subscription_plans.name,
      price: subscription.subscription_plans.price,
      billing_period: subscription.subscription_plans.billing_period,
      features: typeof subscription.subscription_plans.features === 'string'
        ? JSON.parse(subscription.subscription_plans.features)
        : subscription.subscription_plans.features,
      limits: typeof subscription.subscription_plans.limits === 'string'
        ? JSON.parse(subscription.subscription_plans.limits)
        : subscription.subscription_plans.limits
    };

    return NextResponse.json({
      success: true,
      data: { subscription: formattedSubscription },
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
