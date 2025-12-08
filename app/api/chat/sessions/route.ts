import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/chat/sessions
 * List all chat sessions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
    });
  } catch (error: any) {
    console.error('[CHAT-SESSIONS] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/sessions
 * Create a new chat session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title = 'New Chat' } = body;

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('[CHAT-SESSIONS] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create session', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/sessions?id=<session_id>
 * Delete a chat session
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error: any) {
    console.error('[CHAT-SESSIONS] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session', details: error.message },
      { status: 500 }
    );
  }
}
