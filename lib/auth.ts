import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { queryOne } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
}

export async function getUserFromToken(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid auth header found');
    return null;
  }

  const token = authHeader.substring(7);
  console.log('Attempting to verify token...');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    console.log('Token verified successfully for user:', decoded.userId);
    
    const user = await queryOne<AuthUser>(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (user) {
      console.log('User found from token:', user.id);
    } else {
      console.log('User not found for token userId:', decoded.userId);
    }

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json(
    { success: false, message: 'Unauthenticated' },
    { status: 401 }
  );
}
