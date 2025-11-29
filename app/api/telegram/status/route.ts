/**
 * API Route: Get Telegram Connection Status
 * GET /api/telegram/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_TELEGRAM_BACKEND_URL || 'http://localhost:8000';
const API_SECRET_KEY = process.env.TELEGRAM_API_SECRET_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
    }

    if (!user) {
      console.log('No authenticated user found');
      return NextResponse.json(
        { connected: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Call backend to get status
    const response = await fetch(
      `${BACKEND_URL}/api/telegram/connection-status/${user.id}`,
      {
        headers: {
          'X-API-Key': API_SECRET_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Failed to get status' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error getting Telegram status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
