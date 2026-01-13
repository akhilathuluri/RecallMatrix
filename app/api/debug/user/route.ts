import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Debug endpoint to check current user and their memories
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Get memory count for this user
    const { count: memoryCount } = await supabase
      .from('memories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get sample memories
    const { data: memories } = await supabase
      .from('memories')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .limit(5);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      memoryCount,
      sampleMemories: memories,
      environment: process.env.NODE_ENV,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGithubKey: !!process.env.GITHUB_MODELS_API_KEY,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
