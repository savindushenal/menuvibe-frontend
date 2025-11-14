import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/subscriptions/plans - Get all subscription plans
export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.subscription_plans.findMany({
      orderBy: { price: 'asc' },
    });

    // Format response (JSON fields are already parsed by Prisma)
    const formattedPlans = plans.map(plan => ({
      ...plan,
      id: plan.id.toString(),
      features: plan.features || {},
      limits: plan.limits || {},
    }));

    return NextResponse.json({
      success: true,
      data: { plans: formattedPlans },
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
