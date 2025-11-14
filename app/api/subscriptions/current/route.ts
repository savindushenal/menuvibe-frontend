import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/subscriptions/current - Get current user's subscription
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: BigInt(user.id),
        status: 'active',
        OR: [
          { ends_at: null },
          { ends_at: { gt: new Date() } },
        ],
      },
      include: {
        subscription_plans: {
          select: {
            name: true,
            slug: true,
            price: true,
            billing_period: true,
            features: true,
            limits: true,
          },
        },
      },
      orderBy: [
        // Custom ordering would need to be done after fetching
        { created_at: 'desc' },
      ],
    });

    if (!subscription) {
      console.log(`No active subscription found for user ${user.id}`);
      return NextResponse.json({
        success: true,
        data: {
          plan: null,
          usage: {
            menus_count: 0,
            menu_items_count: 0,
            locations_count: 0
          },
          limits: {},
          can_upgrade: true
        },
      });
    }

    console.log(`Found subscription for user ${user.id}: ${subscription.subscription_plans.name} (${subscription.subscription_plans.slug})`);

    // Parse JSON fields if they're strings
    const limits = subscription.subscription_plans.limits;
    const features = subscription.subscription_plans.features;

    // Format response to match expected structure
    const formattedResponse = {
      plan: {
        id: subscription.subscription_plan_id.toString(),
        name: subscription.subscription_plans.name,
        slug: subscription.subscription_plans.slug,
        price: subscription.subscription_plans.price,
        billing_period: subscription.subscription_plans.billing_period,
        limits: limits,
        features: features,
        formatted_price: `$${subscription.subscription_plans.price || 0}`
      },
      usage: {
        // These will be populated by the frontend when needed
        menus_count: 0,
        menu_items_count: 0,
        locations_count: 0
      },
      limits: limits,
      can_upgrade: subscription.subscription_plans.slug !== 'enterprise' && subscription.subscription_plans.slug !== 'custom-enterprise'
    };

    return NextResponse.json({
      success: true,
      data: formattedResponse,
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
