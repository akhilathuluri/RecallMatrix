import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InsightAgent } from '@/lib/agents/InsightAgent';

/**
 * Generate insights for user's memories
 * Uses the InsightAgent from the multi-agent system
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Initialize the InsightAgent
    const insightAgent = new InsightAgent();

    // Execute insight analysis
    const result = await insightAgent.execute({
      id: `insight_${Date.now()}`,
      type: 'insight',
      priority: 1,
      query: 'Generate comprehensive insights from user memories',
      userId: user.id,
      context: {
        requestedAt: new Date().toISOString(),
      },
      createdAt: new Date(),
    });

    if (!result.success || !result.data) {
      throw new Error('Failed to generate insights');
    }

    return NextResponse.json({
      success: true,
      data: {
        patterns: result.data.patterns || [],
        relationships: result.data.relationships || [],
        trends: result.data.trends || [],
        insights: result.data.insights || [],
        summary: result.data.summary || 'No insights available yet.',
      },
      metadata: {
        confidence: result.confidence,
        executionTime: result.executionTime,
        reasoning: result.reasoning,
      },
    });
  } catch (error: any) {
    console.error('[INSIGHTS] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate insights', 
        details: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
