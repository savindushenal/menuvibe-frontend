import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await query<any>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (name, email, password, phone, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [name, email, hashedPassword, phone || null]
    );

    const userId = result.insertId;

    // Create default location
    await query(
      'INSERT INTO locations (user_id, name, is_default, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())',
      [userId, 'Main Location']
    );

    // Create user settings
    await query(
      'INSERT INTO user_settings (user_id, theme, language, currency, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [userId, 'light', 'en', 'USD']
    );

    // Assign free subscription
    const freePlan = await query<any>(
      'SELECT id FROM subscription_plans WHERE name = ? LIMIT 1',
      ['Free']
    );

    if (freePlan.length > 0) {
      await query(
        'INSERT INTO user_subscriptions (user_id, subscription_plan_id, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [userId, freePlan[0].id, 'active']
      );
    }

    // Get newly created user
    const [user] = await query<any>(
      'SELECT id, name, email, phone, created_at FROM users WHERE id = ?',
      [userId]
    );

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        user,
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
