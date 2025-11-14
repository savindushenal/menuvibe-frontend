import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const authUser = await getUserFromToken(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if profile exists
    const profile = await prisma.business_profiles.findFirst({
      where: { user_id: BigInt(authUser.id) }
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Business profile not found. Please create a profile first.' },
        { status: 404 }
      );
    }

    // Check if user already has locations
    const existingLocations = await prisma.locations.findMany({
      where: { user_id: BigInt(authUser.id) },
      select: { id: true }
    });

    // If no locations exist, create a default location from business profile data
    if (existingLocations.length === 0) {
      console.log('Creating default location from business profile data...');
      
      // Validate that we have required fields for location creation
      if (!profile.business_name || !profile.address_line_1 || !profile.city || !profile.state || !profile.postal_code) {
        console.warn('Missing required fields for location creation:', {
          business_name: !!profile.business_name,
          address_line_1: !!profile.address_line_1,
          city: !!profile.city,
          state: !!profile.state,
          postal_code: !!profile.postal_code
        });
        // Continue without creating location - user can create it manually later
      } else {
        // Parse JSON fields
        let operating_hours = null;
        let services = null;
        let social_media = null;
        
        try {
          if (profile.operating_hours) {
            operating_hours = typeof profile.operating_hours === 'string' 
              ? JSON.parse(profile.operating_hours) 
              : profile.operating_hours;
          }
          if (profile.services) {
            services = typeof profile.services === 'string' 
              ? JSON.parse(profile.services) 
              : profile.services;
          }
          if (profile.social_media) {
            social_media = typeof profile.social_media === 'string' 
              ? JSON.parse(profile.social_media) 
              : profile.social_media;
          }
        } catch (e) {
          console.error('Error parsing JSON fields:', e);
        }

        try {
          // Create default location
          const newLocation = await prisma.locations.create({
            data: {
              user_id: BigInt(authUser.id),
              name: profile.business_name,
              description: profile.description,
              phone: profile.phone,
              email: profile.email,
              website: profile.website,
              address_line_1: profile.address_line_1,
              address_line_2: profile.address_line_2,
              city: profile.city,
              state: profile.state,
              postal_code: profile.postal_code,
              country: profile.country || 'US',
              cuisine_type: profile.cuisine_type,
              seating_capacity: profile.seating_capacity,
              operating_hours: operating_hours ? JSON.stringify(operating_hours) : null,
              services: services ? JSON.stringify(services) : null,
              logo_url: profile.logo_url,
              primary_color: profile.primary_color,
              secondary_color: profile.secondary_color,
              social_media: social_media ? JSON.stringify(social_media) : null,
              is_active: true,
              is_default: true,
            }
          });

          console.log('Default location created with ID:', newLocation.id.toString());
        } catch (locationError) {
          console.error('Error creating default location:', locationError);
          // Don't fail the entire onboarding if location creation fails
          console.warn('Continuing onboarding without creating default location');
        }
      }
    }

    // Mark onboarding as complete
    await prisma.business_profiles.update({
      where: { id: profile.id },
      data: {
        onboarding_completed: true,
        onboarding_completed_at: new Date(),
      }
    });

    const updatedProfile = await prisma.business_profiles.findFirst({
      where: { user_id: BigInt(authUser.id) }
    });

    return NextResponse.json({
      success: true,
      data: updatedProfile ? {
        ...updatedProfile,
        id: updatedProfile.id.toString(),
        user_id: updatedProfile.user_id.toString(),
      } : null,
      message: 'Onboarding completed successfully and default location created'
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
