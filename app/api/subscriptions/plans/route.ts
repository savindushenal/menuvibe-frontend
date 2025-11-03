import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/subscriptions/plans - Get all subscription plans
export async function GET(request: NextRequest) {
  try {
    const plans = await query<any>(
      'SELECT * FROM subscription_plans ORDER BY price ASC'
    );

    // Parse JSON fields
    const parsedPlans = plans.map(plan => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : {},
      limits: plan.limits ? JSON.parse(plan.limits) : {},
    }));

    return NextResponse.json({
      success: true,
      data: { plans: parsedPlans },
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
