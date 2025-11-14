import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
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

    return NextResponse.json({
      success: true,
      data: {
        ...location,
        id: location.id.toString(),
        user_id: location.user_id.toString(),
        operating_hours: location.operating_hours ? JSON.parse(location.operating_hours as string) : null,
        services: location.services ? JSON.parse(location.services as string) : null,
        social_media: location.social_media ? JSON.parse(location.social_media as string) : null,
      }
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { 
      name, 
      description,
      phone, 
      email, 
      website,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      cuisine_type,
      seating_capacity,
      operating_hours,
      services,
      logo_url,
      primary_color,
      secondary_color,
      social_media,
      latitude,
      longitude,
      is_active,
      is_default 
    } = body;

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

    // If setting as default, remove default from others
    if (is_default) {
      await prisma.locations.updateMany({
        where: {
          user_id: BigInt(user.id),
          id: { not: BigInt(params.id) },
        },
        data: { is_default: false },
      });
    }

    // Build update data object
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (website !== undefined) updateData.website = website || null;
    if (address_line_1 !== undefined) updateData.address_line_1 = address_line_1;
    if (address_line_2 !== undefined) updateData.address_line_2 = address_line_2 || null;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (country !== undefined) updateData.country = country;
    if (cuisine_type !== undefined) updateData.cuisine_type = cuisine_type || null;
    if (seating_capacity !== undefined) updateData.seating_capacity = seating_capacity || null;
    if (operating_hours !== undefined) updateData.operating_hours = operating_hours ? JSON.stringify(operating_hours) : null;
    if (services !== undefined) updateData.services = services ? JSON.stringify(services) : null;
    if (logo_url !== undefined) updateData.logo_url = logo_url || null;
    if (primary_color !== undefined) updateData.primary_color = primary_color || null;
    if (secondary_color !== undefined) updateData.secondary_color = secondary_color || null;
    if (social_media !== undefined) updateData.social_media = social_media ? JSON.stringify(social_media) : null;
    if (latitude !== undefined) updateData.latitude = latitude || null;
    if (longitude !== undefined) updateData.longitude = longitude || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_default !== undefined) updateData.is_default = is_default;

    // Update location
    const updatedLocation = await prisma.locations.update({
      where: { id: BigInt(params.id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        ...updatedLocation,
        id: updatedLocation.id.toString(),
        user_id: updatedLocation.user_id.toString(),
        operating_hours: updatedLocation.operating_hours ? JSON.parse(updatedLocation.operating_hours as string) : null,
        services: updatedLocation.services ? JSON.parse(updatedLocation.services as string) : null,
        social_media: updatedLocation.social_media ? JSON.parse(updatedLocation.social_media as string) : null,
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if it's the default location
    if (location.is_default) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete default location' },
        { status: 400 }
      );
    }

    // Delete location
    await prisma.locations.delete({
      where: { id: BigInt(params.id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
