/**
 * Agent Orchestration API
 * 
 * API endpoint for multi-agent system queries
 * Uses the orchestrator to coordinate multiple agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { agentService } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const { query, userId, mode } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    let result;

    switch (mode) {
      case 'search':
      case 'query':
        if (!query) {
          return NextResponse.json(
            { error: 'query is required for search mode' },
            { status: 400 }
          );
        }
        result = await agentService.executeQuery(query, userId);
        break;

      case 'organize':
        result = await agentService.runOrganization(userId);
        break;

      case 'insights':
        result = await agentService.runInsights(userId);
        break;

      case 'reminders':
        result = await agentService.getReminders(userId);
        break;

      default:
        // Default to orchestrated query if mode not specified
        if (!query) {
          return NextResponse.json(
            { error: 'query is required when mode is not specified' },
            { status: 400 }
          );
        }
        result = await agentService.executeQuery(query, userId);
    }

    return NextResponse.json({
      success: result.success,
      data: result.data,
      reasoning: result.reasoning,
      toolsUsed: result.toolsUsed,
      confidence: result.confidence,
      executionTime: result.executionTime,
      agentType: result.agentType,
      error: result.error,
    });

  } catch (error: any) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to process agent request', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json({
          statuses: agentService.getAgentStatuses(),
          state: agentService.getState(),
        });

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '10');
        return NextResponse.json({
          history: agentService.getHistory(limit),
        });

      default:
        return NextResponse.json({
          message: 'Multi-Agent Orchestration System',
          endpoints: {
            POST: {
              description: 'Execute agent task',
              parameters: {
                query: 'Search query or task description',
                userId: 'User ID (required)',
                mode: 'search | organize | insights | reminders (optional)',
              },
            },
            GET: {
              status: 'Get agent statuses',
              history: 'Get task history',
            },
          },
        });
    }
  } catch (error: any) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
