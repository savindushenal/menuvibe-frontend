import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password || '');
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get user's default location
    const location = await prisma.locations.findFirst({
      where: {
        user_id: user.id,
        is_default: true,
      },
    });

    // Get user settings
    const settings = await prisma.user_settings.findFirst({
      where: { user_id: user.id },
    });

    // Get subscription with plan details
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

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Format subscription data to match old structure
    const formattedSubscription = subscription ? {
      ...subscription,
      name: subscription.subscription_plans.name,
      price: subscription.subscription_plans.price,
      billing_period: subscription.subscription_plans.billing_period,
      features: subscription.subscription_plans.features,
      limits: subscription.subscription_plans.limits,
    } : null;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          ...userWithoutPassword,
          id: userWithoutPassword.id.toString(),
          default_location: location ? {
            ...location,
            id: location.id.toString(),
            user_id: location.user_id.toString(),
          } : null,
          settings: settings ? {
            ...settings,
            id: settings.id.toString(),
            user_id: settings.user_id.toString(),
          } : null,
        },
        subscription: formattedSubscription ? {
          ...formattedSubscription,
          id: formattedSubscription.id.toString(),
          user_id: formattedSubscription.user_id.toString(),
          subscription_plan_id: formattedSubscription.subscription_plan_id.toString(),
        } : null,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
