import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

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
      'SELECT id FROM business_profiles WHERE user_id = ?',
      [authUser.id]
    );

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Business profile not found. Please create a profile first.' },
        { status: 404 }
      );
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
      message: 'Onboarding completed successfully'
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
