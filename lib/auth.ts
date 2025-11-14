import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

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
    
    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.userId) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user) return null;

    return {
      id: Number(user.id),
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
    };
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
