import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Simply return success - JWT tokens are stateless
  // Client will remove the token from localStorage
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}
