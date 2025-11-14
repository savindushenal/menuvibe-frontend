import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Check if location exists and belongs to user
    const location = await prisma.locations.findFirst({
      where: {
        id: BigInt(params.id),
        user_id: BigInt(user.id),
      },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    // Remove default from all locations
    await prisma.locations.updateMany({
      where: { user_id: BigInt(user.id) },
      data: { is_default: false },
    });

    // Set this location as default
    const updatedLocation = await prisma.locations.update({
      where: { id: BigInt(params.id) },
      data: { is_default: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Default location updated successfully',
      data: { 
        location: {
          ...updatedLocation,
          id: updatedLocation.id.toString(),
          user_id: updatedLocation.user_id.toString(),
        }
      }
    });
  } catch (error) {
    console.error('Error setting default location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set default location' },
      { status: 500 }
    );
  }
}
