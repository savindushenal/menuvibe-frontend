import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
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
    const profile = await queryOne<any>(
      'SELECT * FROM business_profiles WHERE user_id = ?',
      [authUser.id]
    );

    if (!profile) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No business profile found'
      });
    }

    // Parse JSON fields
    try {
      if (profile.operating_hours) {
        profile.operating_hours = typeof profile.operating_hours === 'string' 
          ? JSON.parse(profile.operating_hours) 
          : profile.operating_hours;
      }
      if (profile.services) {
        profile.services = typeof profile.services === 'string' 
          ? JSON.parse(profile.services) 
          : profile.services;
      }
      if (profile.social_media) {
        profile.social_media = typeof profile.social_media === 'string' 
          ? JSON.parse(profile.social_media) 
          : profile.social_media;
      }
    } catch (e) {
      console.error('Error parsing business profile JSON:', e);
    }

    return NextResponse.json({
      success: true,
      data: profile
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
    const existing = await queryOne<any>(
      'SELECT id FROM business_profiles WHERE user_id = ?',
      [authUser.id]
    );

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
    const result: any = await query(
      `INSERT INTO business_profiles 
      (user_id, business_name, business_type, description, address_line_1, address_line_2, city, state, country, postal_code, phone, email, website, logo_url, cuisine_type, seating_capacity, operating_hours, services, social_media, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        authUser.id, 
        business_name || null, 
        business_type || null, 
        description || null,
        address_line_1 || null, 
        address_line_2 || null,
        city || null, 
        state || null, 
        country || 'US', 
        postal_code || null, 
        phone || null, 
        email || null, 
        website || null, 
        logo_url || null,
        cuisine_type || null,
        seating_capacity || null,
        operating_hours ? JSON.stringify(operating_hours) : null,
        services ? JSON.stringify(services) : null,
        social_media ? JSON.stringify(social_media) : null
      ]
    );

    const profile = await queryOne<any>(
      'SELECT * FROM business_profiles WHERE id = ?',
      [result[0].insertId]
    );

    return NextResponse.json({
      success: true,
      data: profile,
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
    const existing = await queryOne<any>(
      'SELECT id, logo_url FROM business_profiles WHERE user_id = ?',
      [authUser.id]
    );

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
    await query(
      `UPDATE business_profiles 
      SET business_name = ?, business_type = ?, description = ?, address_line_1 = ?, address_line_2 = ?, 
          city = ?, state = ?, country = ?, postal_code = ?, phone = ?, email = ?, website = ?, 
          logo_url = ?, primary_color = ?, secondary_color = ?, cuisine_type = ?, seating_capacity = ?, 
          operating_hours = ?, services = ?, social_media = ?, updated_at = NOW()
      WHERE user_id = ?`,
      [
        business_name || null, 
        business_type || null, 
        description || null,
        address_line_1 || null,
        address_line_2 || null,
        city || null, 
        state || null, 
        country || 'US', 
        postal_code || null, 
        phone || null, 
        email || null, 
        website || null, 
        logo_url || null,
        primary_color || null,
        secondary_color || null,
        cuisine_type || null,
        seating_capacity || null,
        operating_hours ? JSON.stringify(operating_hours) : null,
        services ? JSON.stringify(services) : null,
        social_media ? JSON.stringify(social_media) : null,
        authUser.id
      ]
    );

    const profile = await queryOne<any>(
      'SELECT * FROM business_profiles WHERE user_id = ?',
      [authUser.id]
    );

    return NextResponse.json({
      success: true,
      data: profile,
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
