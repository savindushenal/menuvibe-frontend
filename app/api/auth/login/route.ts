import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await queryOne<any>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User found, verifying password...');

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('Password valid, creating token...');

    // Get user's default location
    const location = await queryOne<any>(
      'SELECT * FROM locations WHERE user_id = ? AND is_default = 1 LIMIT 1',
      [user.id]
    );

    // Get user settings
    const settings = await queryOne<any>(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [user.id]
    );

    // Get subscription
    const subscription = await queryOne<any>(
      `SELECT us.*, sp.name, sp.price, sp.billing_cycle, sp.features, sp.limits
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.user_id = ? AND us.status = 'active'
       ORDER BY us.created_at DESC LIMIT 1`,
      [user.id]
    );

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Token created successfully for user:', user.id);

    // Remove password from response
    delete user.password;

    console.log('Sending successful login response');

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          ...user,
          default_location: location,
          settings,
        },
        subscription,
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
