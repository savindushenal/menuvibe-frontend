import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const user = await prisma.users.findUnique({
      where: { id: BigInt(authUser.id) },
      select: {
        id: true,
        name: true,
        email: true,
        email_verified_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's subscription with plan details
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: user.id,
        status: 'active',
      },
      include: {
        subscription_plans: {
          select: {
            name: true,
            price: true,
            billing_period: true,
            features: true,
            limits: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Format subscription data
    const formattedSubscription = subscription ? {
      id: subscription.id.toString(),
      status: subscription.status,
      starts_at: subscription.starts_at,
      ends_at: subscription.ends_at,
      plan_name: subscription.subscription_plans.name,
      price: subscription.subscription_plans.price,
      billing_period: subscription.subscription_plans.billing_period,
      features: subscription.subscription_plans.features,
      limits: subscription.subscription_plans.limits,
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          id: user.id.toString(),
        },
        subscription: formattedSubscription
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
