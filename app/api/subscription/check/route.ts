import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/subscription/check
 * Check if user has active subscription, create Free plan if not
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Check for active subscription
    const activeSubscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: BigInt(user.id),
        OR: [
          { is_active: true },
          { status: 'active' }
        ]
      },
      include: {
        subscription_plans: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    if (activeSubscription) {
      return NextResponse.json({
        success: true,
        message: 'User has active subscription',
        data: {
          has_subscription: true,
          subscription: {
            id: activeSubscription.id.toString(),
            status: activeSubscription.status,
            is_active: activeSubscription.is_active,
            plan_name: activeSubscription.subscription_plans.name,
            plan_slug: activeSubscription.subscription_plans.slug
          },
        },
      });
    }

    // No active subscription found - create Free plan
    console.log(`No active subscription for user ${user.id}, creating Free plan...`);

    // Get Free plan
    const freePlan = await prisma.subscription_plans.findFirst({
      where: {
        slug: 'free',
        is_active: true
      },
      select: { id: true, name: true }
    });

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
    await prisma.user_subscriptions.updateMany({
      where: { user_id: BigInt(user.id) },
      data: {
        is_active: false,
        status: 'cancelled'
      }
    });

    // Create new Free subscription
    const newSubscription = await prisma.user_subscriptions.create({
      data: {
        user_id: BigInt(user.id),
        subscription_plan_id: freePlan.id,
        status: 'active',
        is_active: true,
        starts_at: new Date()
      },
      include: {
        subscription_plans: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Free subscription created successfully',
      data: {
        has_subscription: true,
        subscription: {
          id: newSubscription.id.toString(),
          status: newSubscription.status,
          is_active: newSubscription.is_active,
          plan_name: newSubscription.subscription_plans.name,
          plan_slug: newSubscription.subscription_plans.slug
        },
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
    const plan = await prisma.subscription_plans.findFirst({
      where: {
        slug: plan_slug,
        is_active: true
      },
      select: { id: true, name: true, slug: true, limits: true, features: true }
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, message: `Plan '${plan_slug}' not found` },
        { status: 404 }
      );
    }

    // Deactivate old subscriptions
    await prisma.user_subscriptions.updateMany({
      where: { user_id: BigInt(user.id) },
      data: {
        is_active: false,
        status: 'cancelled',
        ends_at: new Date()
      }
    });

    // Create new subscription
    const newSubscription = await prisma.user_subscriptions.create({
      data: {
        user_id: BigInt(user.id),
        subscription_plan_id: plan.id,
        status: 'active',
        is_active: true,
        starts_at: new Date()
      },
      include: {
        subscription_plans: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `${plan.name} subscription activated successfully`,
      data: {
        subscription: {
          ...newSubscription,
          id: newSubscription.id.toString(),
          user_id: newSubscription.user_id.toString(),
          subscription_plan_id: newSubscription.subscription_plan_id.toString()
        }
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}
