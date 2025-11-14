import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    });

    // Always return success to prevent email enumeration
    // In a real app, you would send an email here
    if (user) {
      // TODO: Generate reset token and send email
      // For now, we'll just log it
      console.log(`Password reset requested for: ${email}`);
      
      // In production, you would:
      // 1. Generate a unique reset token
      // 2. Store it in database with expiration
      // 3. Send email with reset link
      // Example: https://yourapp.com/auth/reset-password?token=xyz
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
