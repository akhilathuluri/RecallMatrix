/**
 * User Profile Context API
 * 
 * Provides user profile information for AI context enhancement.
 * This allows the AI to answer questions about the user based on their profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch user profile with bio
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, bio, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // Return user context for AI
    const userContext = {
      name: profile.full_name || 'User',
      email: profile.email,
      bio: profile.bio || null,
      hasContext: Boolean(profile.bio && profile.bio.trim().length > 0),
    };

    return NextResponse.json({
      success: true,
      context: userContext,
    });
  } catch (error: any) {
    console.error('Profile context API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
