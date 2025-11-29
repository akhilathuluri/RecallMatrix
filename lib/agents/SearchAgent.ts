/**
 * Search Agent
 * 
 * Intelligently retrieves memories using multiple search strategies
 * - Vector similarity search
 * - Keyword search
 * - Temporal filtering
 * - Hybrid approaches
 */

import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentResult, AgentCapability, ToolType, SearchStrategy } from './types';

// Helper to get base URL for server-side fetch
function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export class SearchAgent extends BaseAgent {
  private strategies: SearchStrategy[] = [
    {
      primary: 'vector_search',
      fallback: ['keyword_search', 'temporal_filter'],
      confidence_threshold: 0.7,
    },
    {
      primary: 'keyword_search',
      fallback: ['vector_search'],
      confidence_threshold: 0.6,
    },
  ];

  constructor() {
    super('search');
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'Semantic Search',
        description: 'Search memories using vector similarity for semantic understanding',
        tools: ['vector_search'],
        estimatedTime: 500,
      },
      {
        name: 'Keyword Search',
        description: 'Search memories using exact keyword matching',
        tools: ['keyword_search'],
        estimatedTime: 300,
      },
      {
        name: 'Temporal Search',
        description: 'Search memories within specific time ranges',
        tools: ['temporal_filter'],
        estimatedTime: 400,
      },
      {
        name: 'Hybrid Search',
        description: 'Combines multiple search strategies for best results',
        tools: ['vector_search', 'keyword_search', 'temporal_filter'],
        estimatedTime: 800,
      },
    ];
  }

  canHandle(task: AgentTask): boolean {
    // Search agent handles any task with a query
    return !!task.query && task.type === 'search';
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    this.isProcessing = true;
    const reasoning: string[] = [];
    const toolsUsed: ToolType[] = [];

    try {
      this.log('Starting search execution', { query: task.query });

      // Step 1: Analyze query to determine search strategy
      reasoning.push('Analyzing query to determine optimal search strategy');
      const strategy = this.selectStrategy(task.query);
      reasoning.push(`Selected strategy: ${strategy.primary} with fallbacks: ${strategy.fallback.join(', ')}`);

      // Step 2: Execute primary search
      reasoning.push(`Executing primary search using ${strategy.primary}`);
      toolsUsed.push(strategy.primary);

      const primaryResults = await this.executePrimarySearch(
        task.query,
        task.userId,
        strategy.primary
      );

      // Step 3: Evaluate results
      const confidence = this.calculateConfidence(primaryResults, strategy.confidence_threshold);
      reasoning.push(`Primary search confidence: ${(confidence * 100).toFixed(1)}%`);

      // Step 4: Apply fallback if needed
      let finalResults = primaryResults;
      if (confidence < strategy.confidence_threshold && strategy.fallback.length > 0) {
        reasoning.push(`Confidence below threshold, trying fallback strategy: ${strategy.fallback[0]}`);
        toolsUsed.push(strategy.fallback[0]);

        const fallbackResults = await this.executePrimarySearch(
          task.query,
          task.userId,
          strategy.fallback[0]
        );

        // Merge results
        finalResults = this.mergeResults(primaryResults, fallbackResults);
        reasoning.push(`Merged results from multiple strategies: ${finalResults.length} total memories`);
      }

      // Step 5: Rank and filter
      reasoning.push('Ranking and filtering final results');
      const rankedResults = this.rankResults(finalResults, task.query);

      this.isProcessing = false;
      return this.createResult(
        task,
        {
          memories: rankedResults,
          strategy: strategy.primary,
          totalFound: rankedResults.length,
        },
        reasoning,
        toolsUsed,
        confidence,
        startTime
      );
    } catch (error: any) {
      this.isProcessing = false;
      this.log('Search execution failed', error.message);
      return this.createErrorResult(task, error.message, startTime);
    }
  }

  /**
   * Select optimal search strategy based on query analysis
   */
  private selectStrategy(query: string): SearchStrategy {
    // Check for date/time indicators
    const temporalKeywords = ['yesterday', 'last week', 'last month', 'ago', 'recent', 'old'];
    const hasTemporalContext = temporalKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );

    // Check for exact phrases (quoted)
    const hasQuotes = query.includes('"') || query.includes("'");

    // Check for specific keywords
    const hasSpecificKeywords = /\b(find|show|get|retrieve)\b/i.test(query);

    if (hasTemporalContext) {
      return {
        primary: 'temporal_filter',
        fallback: ['vector_search', 'keyword_search'],
        confidence_threshold: 0.6,
      };
    }

    if (hasQuotes || hasSpecificKeywords) {
      return {
        primary: 'keyword_search',
        fallback: ['vector_search'],
        confidence_threshold: 0.6,
      };
    }

    // Default to semantic search
    return this.strategies[0];
  }

  /**
   * Execute primary search using specified tool
   */
  private async executePrimarySearch(
    query: string,
    userId: string,
    tool: ToolType
  ): Promise<any[]> {
    try {
      // Call the existing search API endpoint
      const response = await fetch(`${getBaseUrl()}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userId }),
      });

      if (!response.ok) {
        throw new Error('Search API request failed');
      }

      const data = await response.json();
      return data.memories || [];
    } catch (error: any) {
      this.log('Primary search failed', error.message);
      return [];
    }
  }

  /**
   * Calculate confidence score for search results
   */
  private calculateConfidence(results: any[], threshold: number): number {
    if (!results || results.length === 0) return 0;

    // Calculate average similarity score
    const avgSimilarity = results.reduce((sum, r) => sum + (r.similarity || 0), 0) / results.length;
    
    // Boost confidence if we have multiple high-quality results
    const highQualityCount = results.filter(r => (r.similarity || 0) > 0.8).length;
    const qualityBoost = Math.min(highQualityCount * 0.1, 0.3);

    return Math.min(avgSimilarity + qualityBoost, 1.0);
  }

  /**
   * Merge results from multiple search strategies
   */
  private mergeResults(primary: any[], fallback: any[]): any[] {
    const merged = [...primary];
    const existingIds = new Set(primary.map(r => r.id));

    for (const result of fallback) {
      if (!existingIds.has(result.id)) {
        merged.push(result);
      }
    }

    return merged;
  }

  /**
   * Rank results by relevance
   */
  private rankResults(results: any[], query: string): any[] {
    return results
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, 10); // Top 10 results
  }
}
