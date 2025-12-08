import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GITHUB_API_KEY = process.env.GITHUB_MODELS_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { query, userId } = await request.json();

    // Only log in development to avoid exposing sensitive data in production logs
    if (process.env.NODE_ENV === 'development') {
      console.log('Search request:', { query, hasUserId: !!userId });
    }

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query and userId are required' },
        { status: 400 }
      );
    }

    const embeddingResponse = await fetch(
      'https://models.inference.ai.azure.com/embeddings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GITHUB_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: query,
        }),
      }
    );

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate query embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Use service role key to bypass RLS for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch user profile bio for context
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('bio, full_name')
      .eq('id', userId)
      .single();

    if (profileError && process.env.NODE_ENV === 'development') {
      console.error('Profile fetch error:', profileError);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Profile fetched:', { 
        hasBio: !!profile?.bio, 
        bioLength: profile?.bio?.length
      });
    }

    const { data: memories, error } = await supabase.rpc('search_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.2,
      match_count: 10,
      user_id_param: userId,
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Search error:', error);
      }
      return NextResponse.json({ memories: [], aiAnswer: null });
    }

    // Generate AI answer if memories found OR if bio exists
    let aiAnswer = null;
    
    // Check if question is about the user themselves
    const isAboutUser = /\b(who am i|who are you|tell me about yourself|tell me about me|what do you do|what do i do|about me|about yourself)\b/i.test(query);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Query analysis:', { isAboutUser, memoriesFound: memories?.length || 0 });
    }
    
    if (memories && memories.length > 0) {
      const context = memories
        .map((m: any) => `Title: ${m.title}\nContent: ${m.content}`)
        .join('\n\n');

      // Build system prompt with user profile context
      let systemPrompt = 'You are a helpful assistant that answers questions based ONLY on the user\'s personal memories and profile information provided. If the information is not in the memories or profile, clearly state that you don\'t have that information. Never make assumptions or infer information that isn\'t explicitly stated.';
      
      let userContext = '';
      if (profile?.bio && profile.bio.trim().length > 0) {
        userContext += `\n\nUser Profile Information:\n${profile.bio}`;
        if (profile.full_name) {
          userContext += `\nUser's name: ${profile.full_name}`;
        }
        systemPrompt += '\n\nYou have access to the user\'s profile information and their memories. Only use information explicitly provided. If asked about something not in the memories or profile, say you don\'t have that information.';
      } else {
        systemPrompt += ' Only use information from the provided memories. If the answer is not in the memories, say so.';
      }

      const aiResponse = await fetch(
        'https://models.inference.ai.azure.com/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GITHUB_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: systemPrompt + userContext,
              },
              {
                role: 'user',
                content: `${userContext && profile ? `User's Profile:\n${profile.bio}${profile.full_name ? `\nName: ${profile.full_name}` : ''}\n\n` : ''}Memories:\n\n${context}\n\nQuestion: ${query}\n\nIMPORTANT: Only answer based on the information provided above. If the information is not in the memories or profile, clearly state "I don't have any information about that in your memories."`,
              },
            ],
            temperature: 0.7,
            max_tokens: 300,
          }),
        }
      );

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiAnswer = aiData.choices[0].message.content;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('AI answer generated (with memories)');
        }
      }
    } else if (profile?.bio && profile.bio.trim().length > 0 && isAboutUser) {
      // No memories found, but user is asking about themselves and has a bio
      if (process.env.NODE_ENV === 'development') {
        console.log('Generating answer from bio only...');
      }
      
      const aiResponse = await fetch(
        'https://models.inference.ai.azure.com/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GITHUB_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are answering on behalf of the user. Here is their profile information:\n\n${profile.bio}${profile.full_name ? `\nName: ${profile.full_name}` : ''}\n\nAnswer the question as if you are the user, using "I" and "my". Be natural and conversational.`,
              },
              {
                role: 'user',
                content: query,
              },
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
        }
      );

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiAnswer = aiData.choices[0].message.content;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('AI answer generated (bio only)');
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Final response:', { memoriesCount: memories?.length || 0, hasAiAnswer: !!aiAnswer });
    }

    return NextResponse.json({ memories: memories || [], aiAnswer });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Search error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to search memories' },
      { status: 500 }
    );
  }
}
