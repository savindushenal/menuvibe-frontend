import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
    let user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: googleUser.email },
          { google_id: googleUser.id },
        ],
      },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user with all related records in a transaction
      isNewUser = true;

      // Get the Free subscription plan
      const freePlan = await prisma.subscription_plans.findFirst({
        where: { name: 'Free' },
        select: { id: true },
      });

      user = await prisma.$transaction(async (tx) => {
        // Create new user
        const newUser = await tx.users.create({
          data: {
            name: googleUser.name,
            email: googleUser.email,
            google_id: googleUser.id,
            email_verified_at: new Date(),
          },
        });

        // Create default location with proper fields
        await tx.locations.create({
          data: {
            user_id: newUser.id,
            name: 'Main Location',
            description: 'Default location',
            address_line_1: 'Address not set',
            city: 'City',
            state: 'State',
            postal_code: '00000',
            country: 'US',
            is_default: true,
            is_active: true,
          },
        });

        // Create empty business profile for onboarding
        await tx.business_profiles.create({
          data: {
            user_id: newUser.id,
            business_name: googleUser.name || 'My Business',
            business_type: 'restaurant',
            address_line_1: 'Not set',
            city: 'Not set',
            state: 'Not set',
            postal_code: '00000',
            country: 'US',
            onboarding_completed: false,
          },
        });

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
    } else if (!user.google_id) {
      // Update existing user with Google ID
      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          google_id: googleUser.id,
          email_verified_at: new Date(),
        },
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const redirectUrl = new URL('/auth/google/callback', FRONTEND_URL);
    redirectUrl.searchParams.append('token', token);
    redirectUrl.searchParams.append('user', JSON.stringify({
      id: user.id.toString(),
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
