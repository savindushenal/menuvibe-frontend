import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const newPlan = await prisma.subscription_plans.findUnique({
      where: { 
        id: BigInt(plan_id),
        is_active: true
      }
    });

    if (!newPlan) {
      return NextResponse.json(
        { success: false, message: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Get current subscription
    const currentSubscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: BigInt(user.id),
        status: 'active'
      },
      include: {
        subscription_plans: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Determine if upgrade or downgrade
    const isUpgrade = currentSubscription 
      ? Number(newPlan.price) > Number(currentSubscription.subscription_plans.price)
      : true;

    const changeType = isUpgrade ? 'upgrade' : 'downgrade';

    // Deactivate current subscription
    if (currentSubscription) {
      await prisma.user_subscriptions.update({
        where: { id: currentSubscription.id },
        data: {
          status: 'cancelled',
          ends_at: new Date()
        }
      });
    }

    // Create new subscription
    const newSubscription = await prisma.user_subscriptions.create({
      data: {
        user_id: BigInt(user.id),
        subscription_plan_id: newPlan.id,
        status: 'active',
        starts_at: new Date(),
        is_active: true
      },
      include: {
        subscription_plans: true
      }
    });

    // Parse JSON fields
    const formattedSubscription = {
      ...newSubscription,
      id: newSubscription.id.toString(),
      user_id: newSubscription.user_id.toString(),
      subscription_plan_id: newSubscription.subscription_plan_id.toString(),
      features: typeof newSubscription.subscription_plans.features === 'string'
        ? JSON.parse(newSubscription.subscription_plans.features)
        : newSubscription.subscription_plans.features,
      limits: typeof newSubscription.subscription_plans.limits === 'string'
        ? JSON.parse(newSubscription.subscription_plans.limits)
        : newSubscription.subscription_plans.limits
    };

    return NextResponse.json({
      success: true,
      message: `Successfully ${changeType}d to ${newPlan.name} plan`,
      data: {
        subscription: formattedSubscription,
        change_type: changeType,
        previous_plan: currentSubscription?.subscription_plans.name || 'None',
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
