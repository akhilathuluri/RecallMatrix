import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const memoryIds = searchParams.get('ids')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by specific IDs if provided
    if (memoryIds && memoryIds.length > 0) {
      query = query.in('id', memoryIds);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: memories, error } = await query;

    if (error) {
      console.error('Error fetching memories:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch memories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      memories: memories || [],
      count: memories?.length || 0,
    });

  } catch (error) {
    console.error('Error in memories API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
