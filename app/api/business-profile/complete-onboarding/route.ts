import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

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
    const profile = await queryOne<any>(
      'SELECT * FROM business_profiles WHERE user_id = ?',
      [authUser.id]
    );

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Business profile not found. Please create a profile first.' },
        { status: 404 }
      );
    }

    // Check if user already has locations
    const existingLocations = await query<any>(
      'SELECT id FROM locations WHERE user_id = ?',
      [authUser.id]
    );

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
          const [locationResult] = await pool.execute<ResultSetHeader>(
            `INSERT INTO locations 
            (user_id, name, description, phone, email, website, address_line_1, address_line_2, 
             city, state, postal_code, country, cuisine_type, seating_capacity, operating_hours, 
             services, logo_url, primary_color, secondary_color, social_media, is_active, is_default, 
             created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
            [
              authUser.id,
              profile.business_name,
              profile.description,
              profile.phone,
              profile.email,
              profile.website,
              profile.address_line_1,
              profile.address_line_2,
              profile.city,
              profile.state,
              profile.postal_code,
              profile.country || 'US',
              profile.cuisine_type,
              profile.seating_capacity,
              operating_hours ? JSON.stringify(operating_hours) : null,
              services ? JSON.stringify(services) : null,
              profile.logo_url,
              profile.primary_color,
              profile.secondary_color,
              social_media ? JSON.stringify(social_media) : null
            ]
          );

          console.log('Default location created with ID:', locationResult.insertId);
        } catch (locationError) {
          console.error('Error creating default location:', locationError);
          // Don't fail the entire onboarding if location creation fails
          console.warn('Continuing onboarding without creating default location');
        }
      }
    }

    // Mark onboarding as complete
    await query(
      'UPDATE business_profiles SET onboarding_completed = 1, onboarding_completed_at = NOW(), updated_at = NOW() WHERE user_id = ?',
      [authUser.id]
    );

    const updatedProfile = await queryOne<any>(
      'SELECT * FROM business_profiles WHERE user_id = ?',
      [authUser.id]
    );

    return NextResponse.json({
      success: true,
      data: updatedProfile,
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
