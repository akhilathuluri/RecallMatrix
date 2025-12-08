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

    // Call backend to get status with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/telegram/connection-status/${user.id}`,
        {
          headers: {
            'X-API-Key': API_SECRET_KEY,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        return NextResponse.json(
          { connected: false, error: error.detail || 'Failed to get status' },
          { status: 200 } // Return 200 to avoid console errors
        );
      }

      const data = await response.json();
      return NextResponse.json(data);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout or network errors gracefully
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { connected: false, error: 'Backend service timeout' },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { connected: false, error: 'Backend service unavailable' },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error getting Telegram status:', error);
    return NextResponse.json(
      { connected: false, error: 'Internal server error' },
      { status: 200 } // Return 200 to avoid console errors
    );
  }
}
