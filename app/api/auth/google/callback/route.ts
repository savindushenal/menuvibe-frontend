import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import jwt from 'jsonwebtoken';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${FRONTEND_URL}/auth/login?error=google_auth_failed`);
    }

    if (!code) {
      return NextResponse.redirect(`${FRONTEND_URL}/auth/login?error=no_code`);
    }

    // Build redirect URI dynamically from current host
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || new URL(FRONTEND_URL).host;
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${FRONTEND_URL}/auth/login?error=token_exchange_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('User info fetch failed:', await userInfoResponse.text());
      return NextResponse.redirect(`${FRONTEND_URL}/auth/login?error=user_info_failed`);
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    // Check if user exists
    let user = await queryOne<any>(
      'SELECT * FROM users WHERE email = ? OR google_id = ?',
      [googleUser.email, googleUser.id]
    );

    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;
      const result: any = await query(
        'INSERT INTO users (name, email, google_id, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())',
        [googleUser.name, googleUser.email, googleUser.id]
      );

      const userId = result[0].insertId;

      // Create default location with proper fields
      await query(
        `INSERT INTO locations 
        (user_id, name, description, address_line_1, city, state, postal_code, country, is_default, is_active, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [userId, 'Main Location', 'Default location', 'Address not set', 'City', 'State', '00000', 'US']
      );

      // Create user settings
      await query(
        'INSERT INTO user_settings (user_id, theme, language, currency, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [userId, 'light', 'en', 'USD']
      );

      // Assign free subscription
      const freePlan = await queryOne<any>(
        'SELECT id FROM subscription_plans WHERE name = ? LIMIT 1',
        ['Free']
      );

      if (freePlan) {
        await query(
          'INSERT INTO user_subscriptions (user_id, subscription_plan_id, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [userId, freePlan.id, 'active']
        );
      }

      // Get newly created user
      user = await queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    } else if (!user.google_id) {
      // Update existing user with Google ID
      await query(
        'UPDATE users SET google_id = ?, email_verified_at = NOW(), updated_at = NOW() WHERE id = ?',
        [googleUser.id, user.id]
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const redirectUrl = new URL('/auth/google/callback', FRONTEND_URL);
    redirectUrl.searchParams.append('token', token);
    redirectUrl.searchParams.append('user', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
    
    // Add flag for new users to trigger onboarding
    if (isNewUser) {
      redirectUrl.searchParams.append('new_user', 'true');
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${FRONTEND_URL}/auth/login?error=auth_failed`);
  }
}
