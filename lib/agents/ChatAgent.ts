import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentResult, ToolType, AgentCapability } from './types';
import { createClient } from '@/lib/supabase/server';

/**
 * ChatAgent - Conversational AI agent that maintains context and retrieves relevant memories
 * 
 * Features:
 * - Maintains conversation history and context
 * - Retrieves relevant memories based on conversation
 * - Generates contextual responses using memories
 * - Tracks memory references used in responses
 */
export class ChatAgent extends BaseAgent {
  name = 'ChatAgent';
  description = 'Conversational AI that maintains context and retrieves relevant memories';
  private userId: string;

  constructor(userId: string) {
    super('chat');
    this.userId = userId;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'Conversational Memory Chat',
        description: 'Maintains conversation context and retrieves relevant memories',
        tools: ['vector_search', 'conversational_ai'] as ToolType[],
        estimatedTime: 3000,
      },
    ];
  }

  /**
   * Check if this agent can handle a task
   */
  canHandle(task: AgentTask): boolean {
    return task.type === 'chat';
  }

  /**
   * Execute chat task with conversation context
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    this.isProcessing = true;

    try {
      const reasoning: string[] = [];
      const toolsUsed: ToolType[] = [];

      // Extract conversation data
      const { message, conversationHistory = [], sessionId } = task.parameters || {};

      if (!message) {
        throw new Error('Message is required');
      }

      reasoning.push(`📝 Processing message: "${message.substring(0, 50)}..."`);

      // Step 1: Search for relevant memories
      reasoning.push('🔍 Searching for relevant memories...');
      const relevantMemories = await this.searchRelevantMemories(message);
      toolsUsed.push('vector_search');
      reasoning.push(`Found ${relevantMemories.length} relevant memories`);

      // Step 2: Build context from conversation history
      const conversationContext = this.buildConversationContext(conversationHistory);
      reasoning.push(`📚 Built context from ${conversationHistory.length} previous messages`);

      // Step 3: Generate AI response using memories and context
      reasoning.push('🤖 Generating contextual response...');
      const response = await this.generateResponse(
        message,
        relevantMemories,
        conversationContext
      );
      toolsUsed.push('conversational_ai');

      // Step 4: Extract memory references
      const memoryIds = relevantMemories.map(m => m.id);

      const confidence = this.calculateConfidence(relevantMemories.length, conversationHistory.length);

      this.isProcessing = false;
      return this.createResult(
        task,
        {
          response,
          memoryIds,
          memoriesUsed: relevantMemories.length,
          conversationContext,
        },
        reasoning,
        toolsUsed,
        confidence,
        new Date(startTime)
      );
    } catch (error: any) {
      this.isProcessing = false;
      this.log('Chat generation failed', error.message);
      return this.createErrorResult(task, error.message, new Date(startTime));
    }
  }

  /**
   * Search for memories relevant to the user's message
   */
  private async searchRelevantMemories(message: string, limit: number = 5): Promise<any[]> {
    try {
      // Use the existing search API endpoint
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          userId: this.userId,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error('Search API failed');
      }

      const data = await response.json();
      return data.memories || data.results || [];
    } catch (error) {
      this.log('Memory search failed', error);
      return [];
    }
  }

  /**
   * Build context string from conversation history
   */
  private buildConversationContext(history: any[]): string {
    if (history.length === 0) return '';

    // Take last 10 messages to keep context manageable
    const recentHistory = history.slice(-10);
    
    return recentHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Generate AI response using memories and conversation context
   */
  private async generateResponse(
    userMessage: string,
    memories: any[],
    conversationContext: string
  ): Promise<string> {
    try {
      const githubToken = process.env.GITHUB_MODELS_API_KEY || process.env.GITHUB_TOKEN;
      if (!githubToken) {
        throw new Error('GITHUB_MODELS_API_KEY not configured');
      }

      // Build context from memories
      const memoryContext = memories.length > 0
        ? `Relevant memories:\n${memories.map((m, i) => 
            `${i + 1}. ${m.title}: ${m.content.substring(0, 200)}...`
          ).join('\n')}`
        : 'No relevant memories found.';

      // Build system prompt
      const systemPrompt = `You are a helpful AI assistant that helps users interact with their personal memory vault. 

Your role:
- Answer questions based on the user's stored memories
- Provide context and insights from their memories
- Be conversational and friendly
- If no relevant memories exist, say so politely and offer to help in other ways

${memoryContext}

${conversationContext ? `Previous conversation:\n${conversationContext}` : ''}

Guidelines:
- Reference specific memories when relevant
- Keep responses concise and natural
- If memories don't contain the answer, acknowledge it
- Maintain conversation flow by referencing previous messages`;

      // Call GitHub Models API
      const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub Models API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      this.log('Response generation failed', error);
      return 'Sorry, I encountered an error generating a response. Please try again.';
    }
  }

  /**
   * Calculate confidence based on available context
   */
  private calculateConfidence(memoriesFound: number, historyLength: number): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence with relevant memories
    if (memoriesFound > 0) confidence += 0.2;
    if (memoriesFound >= 3) confidence += 0.1;

    // Boost confidence with conversation context
    if (historyLength > 0) confidence += 0.1;
    if (historyLength >= 5) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Get base URL for API calls (server-side compatibility)
   */
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }
}
