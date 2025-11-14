import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, restaurantName } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the Free subscription plan
    const freePlan = await prisma.subscription_plans.findFirst({
      where: { name: 'Free' },
      select: { id: true },
    });

    // Create user with related records in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.users.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          created_at: true,
        },
      });

      // Create default location
      await tx.locations.create({
        data: {
          user_id: newUser.id,
          name: restaurantName || 'Main Location',
          address_line_1: 'Not set',
          city: 'Not set',
          state: 'Not set',
          postal_code: '00000',
          country: 'US',
          is_default: true,
        },
      });

      // Create business profile with restaurant name if provided
      if (restaurantName) {
        await tx.business_profiles.create({
          data: {
            user_id: newUser.id,
            business_name: restaurantName,
            business_type: 'restaurant',
            address_line_1: 'Not set',
            city: 'Not set',
            state: 'Not set',
            postal_code: '00000',
            country: 'US',
          },
        });
      }

      // Create user settings
      await tx.user_settings.create({
        data: {
          user_id: newUser.id,
        },
      });

      // Assign free subscription if available
      if (freePlan) {
        await tx.user_subscriptions.create({
          data: {
            user_id: newUser.id,
            subscription_plan_id: freePlan.id,
            status: 'active',
            starts_at: new Date(),
          },
        });
      }

      return newUser;
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          ...user,
          id: user.id.toString(),
        },
        token,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
