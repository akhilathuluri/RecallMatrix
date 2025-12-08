import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatAgent } from '@/lib/agents/ChatAgent';

/**
 * POST /api/chat
 * Send a message in a chat session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // If no sessionId, create a new session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      currentSessionId = newSession.id;
    }

    // Fetch conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true });

    // Save user message
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        user_id: user.id,
        role: 'user',
        content: message,
      });

    if (userMsgError) throw userMsgError;

    // Initialize ChatAgent
    const chatAgent = new ChatAgent(user.id);

    // Execute chat with context
    const result = await chatAgent.execute({
      id: `chat_${Date.now()}`,
      type: 'chat',
      priority: 1,
      query: message,
      userId: user.id,
      parameters: {
        message,
        conversationHistory: history || [],
        sessionId: currentSessionId,
      },
      createdAt: new Date(),
    });

    if (!result.success || !result.data) {
      throw new Error('Failed to generate response');
    }

    const { response, memoryIds } = result.data;

    // Save assistant message
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        user_id: user.id,
        role: 'assistant',
        content: response,
        memory_ids: memoryIds || [],
        metadata: {
          reasoning: result.reasoning,
          toolsUsed: result.toolsUsed,
          confidence: result.confidence,
        },
      })
      .select()
      .single();

    if (assistantMsgError) throw assistantMsgError;

    return NextResponse.json({
      success: true,
      sessionId: currentSessionId,
      message: assistantMsg,
      reasoning: result.reasoning,
    });
  } catch (error: any) {
    console.error('[CHAT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: error.message },
      { status: 500 }
    );
  }
}
