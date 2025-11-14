import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful (Prisma)'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    }, { status: 500 });
  }
}
