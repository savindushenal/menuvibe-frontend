import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function GET(request: NextRequest) {
  const authUser = await getUserFromToken(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const profile = await prisma.business_profiles.findFirst({
      where: { user_id: BigInt(authUser.id) },
    });

    if (!profile) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No business profile found'
      });
    }

    // Parse JSON fields for frontend
    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        id: profile.id.toString(),
        user_id: profile.user_id.toString(),
        operating_hours: profile.operating_hours ? JSON.parse(profile.operating_hours as string) : null,
        services: profile.services ? JSON.parse(profile.services as string) : null,
        social_media: profile.social_media ? JSON.parse(profile.social_media as string) : null,
      }
    });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch business profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getUserFromToken(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if profile already exists
    const existing = await prisma.business_profiles.findFirst({
      where: { user_id: BigInt(authUser.id) },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Business profile already exists' },
        { status: 400 }
      );
    }

    // Parse FormData or JSON
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    let logoFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      logoFile = formData.get('logo') as File | null;
      
      // Parse all other fields
      formData.forEach((value, key) => {
        if (key !== 'logo') {
          try {
            body[key] = JSON.parse(value as string);
          } catch {
            body[key] = value;
          }
        }
      });
    } else {
      body = await request.json();
    }

    const {
      business_name,
      business_type,
      description,
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      postal_code,
      phone,
      email,
      website,
      cuisine_type,
      seating_capacity,
      operating_hours,
      services,
      social_media
    } = body;

    // Handle logo upload if file provided
    let logo_url = body.logo_url || null;
    if (logoFile && logoFile.size > 0) {
      try {
        console.log('Logo file received for new profile:', logoFile.name, 'Size:', logoFile.size);
        
        // Upload to Vercel Blob
        const filename = `logos/logo-${authUser.id}-${Date.now()}.${logoFile.name.split('.').pop()}`;
        
        const blob = await put(filename, logoFile, {
          access: 'public',
          addRandomSuffix: false,
        });
        
        logo_url = blob.url;
        console.log('Logo uploaded to Vercel Blob:', logo_url);
      } catch (error) {
        console.error('Error uploading logo for new profile:', error);
        // Continue without logo
        console.warn('Continuing profile creation without logo');
      }
    }

    // Create new profile
    const profile = await prisma.business_profiles.create({
      data: {
        user_id: BigInt(authUser.id),
        business_name: business_name || null,
        business_type: business_type || null,
        description: description || null,
        address_line_1: address_line_1 || null,
        address_line_2: address_line_2 || null,
        city: city || null,
        state: state || null,
        country: country || 'US',
        postal_code: postal_code || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        logo_url: logo_url || null,
        cuisine_type: cuisine_type || null,
        seating_capacity: seating_capacity || null,
        operating_hours: operating_hours ? JSON.stringify(operating_hours) : null,
        services: services ? JSON.stringify(services) : null,
        social_media: social_media ? JSON.stringify(social_media) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        id: profile.id.toString(),
        user_id: profile.user_id.toString(),
        operating_hours: profile.operating_hours ? JSON.parse(profile.operating_hours as string) : null,
        services: profile.services ? JSON.parse(profile.services as string) : null,
        social_media: profile.social_media ? JSON.parse(profile.social_media as string) : null,
      },
      message: 'Business profile created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating business profile:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create business profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authUser = await getUserFromToken(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    
    // Extract form fields
    const business_name = formData.get('business_name') as string;
    const business_type = formData.get('business_type') as string | null;
    const description = formData.get('description') as string | null;
    const address_line_1 = formData.get('address_line_1') as string | null;
    const address_line_2 = formData.get('address_line_2') as string | null;
    const city = formData.get('city') as string | null;
    const state = formData.get('state') as string | null;
    const country = formData.get('country') as string | null;
    const postal_code = formData.get('postal_code') as string | null;
    const phone = formData.get('phone') as string | null;
    const email = formData.get('email') as string | null;
    const website = formData.get('website') as string | null;
    const primary_color = formData.get('primary_color') as string | null;
    const secondary_color = formData.get('secondary_color') as string | null;
    const cuisine_type = formData.get('cuisine_type') as string | null;
    const seating_capacity = formData.get('seating_capacity') ? parseInt(formData.get('seating_capacity') as string) : null;
    const operating_hours = formData.get('operating_hours') as string | null;
    const services = formData.get('services') as string | null;
    const social_media = formData.get('social_media') as string | null;
    
    const logoFile = formData.get('logo') as File | null;
    let logo_url = formData.get('logo_url') as string | null;

    // Check if profile exists
    const existing = await prisma.business_profiles.findFirst({
      where: { user_id: BigInt(authUser.id) },
      select: { id: true, logo_url: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Handle logo file upload
    // Using Vercel Blob for production file storage
    if (logoFile && logoFile.size > 0) {
      try {
        console.log('Logo file received:', logoFile.name, 'Size:', logoFile.size);
        
        // Upload to Vercel Blob
        const filename = `logos/logo-${authUser.id}-${Date.now()}.${logoFile.name.split('.').pop()}`;
        
        const blob = await put(filename, logoFile, {
          access: 'public',
          addRandomSuffix: false,
        });
        
        logo_url = blob.url;
        console.log('Logo uploaded to Vercel Blob:', logo_url);
      } catch (error) {
        console.error('Error uploading logo:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        // Don't fail the entire update if logo processing fails
        console.warn('Continuing without logo update');
      }
    }

    // If no new logo uploaded, keep existing logo
    if (!logo_url && existing.logo_url) {
      logo_url = existing.logo_url;
    }

    // Update profile
    const profile = await prisma.business_profiles.update({
      where: { id: existing.id },
      data: {
        business_name: business_name || null,
        business_type: business_type || null,
        description: description || null,
        address_line_1: address_line_1 || null,
        address_line_2: address_line_2 || null,
        city: city || null,
        state: state || null,
        country: country || 'US',
        postal_code: postal_code || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        logo_url: logo_url || null,
        primary_color: primary_color || null,
        secondary_color: secondary_color || null,
        cuisine_type: cuisine_type || null,
        seating_capacity: seating_capacity || null,
        operating_hours: operating_hours ? JSON.stringify(operating_hours) : null,
        services: services ? JSON.stringify(services) : null,
        social_media: social_media ? JSON.stringify(social_media) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        id: profile.id.toString(),
        user_id: profile.user_id.toString(),
        operating_hours: profile.operating_hours ? JSON.parse(profile.operating_hours as string) : null,
        services: profile.services ? JSON.parse(profile.services as string) : null,
        social_media: profile.social_media ? JSON.parse(profile.social_media as string) : null,
      },
      message: 'Business profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating business profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update business profile' },
      { status: 500 }
    );
  }
}
