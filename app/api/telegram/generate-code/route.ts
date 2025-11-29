/**
 * API Route: Generate Telegram Auth Code
 * POST /api/telegram/generate-code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_TELEGRAM_BACKEND_URL || 'http://localhost:8000';
const API_SECRET_KEY = process.env.TELEGRAM_API_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call backend to generate code
    const response = await fetch(`${BACKEND_URL}/api/telegram/generate-auth-code?user_id=${user.id}`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_SECRET_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Failed to generate code' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      code: data.code,
      expiresInMinutes: data.expires_in_minutes,
    });

  } catch (error) {
    console.error('Error generating Telegram auth code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
