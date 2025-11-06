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
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    
    const user = await queryOne<AuthUser>(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
      [decoded.userId]
    );

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
