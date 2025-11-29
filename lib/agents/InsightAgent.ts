/**
 * Insight Agent
 * 
 * Discovers patterns, relationships, and trends in memories
 * - Pattern analysis
 * - Trend detection
 * - Relationship mapping
 * - Behavioral insights
 */

import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentResult, AgentCapability, ToolType, MemoryPattern, ProactiveInsight } from './types';
import { createClient } from '@/lib/supabase/server';

export class InsightAgent extends BaseAgent {
  constructor() {
    super('insight');
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'Pattern Discovery',
        description: 'Identify recurring patterns in user memories',
        tools: ['pattern_analysis'],
        estimatedTime: 1000,
      },
      {
        name: 'Relationship Mapping',
        description: 'Discover connections between memories',
        tools: ['relationship_detection', 'graph_traversal'],
        estimatedTime: 900,
      },
      {
        name: 'Trend Analysis',
        description: 'Analyze trends over time in memory creation',
        tools: ['temporal_filter', 'pattern_analysis'],
        estimatedTime: 800,
      },
      {
        name: 'Proactive Insights',
        description: 'Generate actionable insights from memory data',
        tools: ['pattern_analysis', 'relationship_detection'],
        estimatedTime: 1200,
      },
    ];
  }

  canHandle(task: AgentTask): boolean {
    return task.type === 'insight';
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    this.isProcessing = true;
    const reasoning: string[] = [];
    const toolsUsed: ToolType[] = [];

    try {
      this.log('Starting insight analysis', { userId: task.userId });

      // Step 1: Fetch user's memories
      reasoning.push('Fetching memories for pattern analysis');
      const memories = await this.fetchUserMemories(task.userId);
      reasoning.push(`Analyzing ${memories.length} memories for insights`);

      // Step 2: Discover patterns
      reasoning.push('Discovering patterns in memory data');
      toolsUsed.push('pattern_analysis');
      const patterns = await this.discoverPatterns(memories);
      reasoning.push(`Identified ${patterns.length} distinct patterns`);

      // Step 3: Analyze relationships
      reasoning.push('Mapping relationships between memories');
      toolsUsed.push('relationship_detection', 'graph_traversal');
      const relationships = await this.analyzeRelationships(memories);
      reasoning.push(`Discovered ${relationships.length} memory relationships`);

      // Step 4: Detect trends
      reasoning.push('Analyzing temporal trends');
      toolsUsed.push('temporal_filter');
      const trends = await this.detectTrends(memories);
      reasoning.push(`Found ${trends.length} notable trends`);

      // Step 5: Generate proactive insights
      reasoning.push('Generating actionable insights');
      const insights = await this.generateInsights(memories, patterns, relationships);
      reasoning.push(`Generated ${insights.length} proactive insights`);

      const confidence = this.calculateInsightConfidence(patterns, relationships, trends);

      this.isProcessing = false;
      return this.createResult(
        task,
        {
          patterns,
          relationships,
          trends,
          insights,
          summary: this.createSummary(patterns, relationships, trends, insights),
        },
        reasoning,
        toolsUsed,
        confidence,
        startTime
      );
    } catch (error: any) {
      this.isProcessing = false;
      this.log('Insight analysis failed', error.message);
      return this.createErrorResult(task, error.message, startTime);
    }
  }

  /**
   * Fetch user memories from database
   */
  private async fetchUserMemories(userId: string): Promise<any[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.log('Failed to fetch memories', error);
      return [];
    }
  }

  /**
   * Discover patterns in memory data
   */
  private async discoverPatterns(memories: any[]): Promise<MemoryPattern[]> {
    const patterns: MemoryPattern[] = [];

    // Temporal patterns
    const temporalPattern = this.analyzeTemporalPattern(memories);
    if (temporalPattern) patterns.push(temporalPattern);

    // Categorical patterns
    const categoryPattern = this.analyzeCategoryPattern(memories);
    if (categoryPattern) patterns.push(categoryPattern);

    // Behavioral patterns
    const behavioralPattern = this.analyzeBehavioralPattern(memories);
    if (behavioralPattern) patterns.push(behavioralPattern);

    return patterns;
  }

  /**
   * Analyze temporal patterns
   */
  private analyzeTemporalPattern(memories: any[]): MemoryPattern | null {
    if (memories.length < 5) return null;

    const dayOfWeek = memories.map(m => new Date(m.created_at).getDay());
    const hourOfDay = memories.map(m => new Date(m.created_at).getHours());

    // Find most common day
    const dayCounts = dayOfWeek.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostCommonDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Find most common time range
    const morningCount = hourOfDay.filter(h => h >= 6 && h < 12).length;
    const afternoonCount = hourOfDay.filter(h => h >= 12 && h < 18).length;
    const eveningCount = hourOfDay.filter(h => h >= 18 || h < 6).length;

    const timeRange = morningCount > afternoonCount && morningCount > eveningCount ? 'morning'
      : afternoonCount > eveningCount ? 'afternoon' : 'evening';

    return {
      type: 'temporal',
      description: `You typically save memories on ${dayNames[parseInt(mostCommonDay[0])]}s during the ${timeRange}`,
      evidence: [
        `${mostCommonDay[1]} memories saved on ${dayNames[parseInt(mostCommonDay[0])]}s`,
        `Most active during ${timeRange} hours`,
      ],
      confidence: Math.min((Number(mostCommonDay[1]) / memories.length) * 2, 0.9),
    };
  }

  /**
   * Analyze category patterns
   */
  private analyzeCategoryPattern(memories: any[]): MemoryPattern | null {
    if (memories.length < 3) return null;

    const categories = memories.map(m => this.inferCategory(m.title + ' ' + m.content));
    const categoryCounts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      type: 'categorical',
      description: `Your most saved memory categories are: ${topCategories.map(c => c[0]).join(', ')}`,
      evidence: topCategories.map(([cat, count]) => `${count} ${cat} memories`),
      confidence: 0.85,
    };
  }

  /**
   * Analyze behavioral patterns
   */
  private analyzeBehavioralPattern(memories: any[]): MemoryPattern | null {
    if (memories.length < 10) return null;

    // Analyze memory creation frequency
    const now = new Date();
    const last30Days = memories.filter(m => {
      const diff = now.getTime() - new Date(m.created_at).getTime();
      return diff < 30 * 24 * 60 * 60 * 1000;
    });

    const avgPerWeek = (last30Days.length / 30) * 7;

    let description = '';
    let suggestedActions: string[] = [];

    if (avgPerWeek < 1) {
      description = 'You save memories infrequently (less than once per week)';
      suggestedActions = ['Consider setting a reminder to capture important moments'];
    } else if (avgPerWeek > 7) {
      description = 'You actively save memories daily';
      suggestedActions = ['Great habit! Consider organizing into categories'];
    } else {
      description = `You save approximately ${avgPerWeek.toFixed(1)} memories per week`;
    }

    return {
      type: 'behavioral',
      description,
      evidence: [
        `${last30Days.length} memories in last 30 days`,
        `Average ${avgPerWeek.toFixed(1)} memories per week`,
      ],
      confidence: 0.8,
      suggestedActions,
    };
  }

  /**
   * Analyze relationships between memories
   */
  private async analyzeRelationships(memories: any[]): Promise<any[]> {
    const relationships: any[] = [];

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const similarity = this.calculateContentSimilarity(memories[i], memories[j]);

        if (similarity > 0.6) {
          relationships.push({
            memory1: memories[i].id,
            memory2: memories[j].id,
            type: 'content_similarity',
            strength: similarity,
          });
        }

        // Check temporal proximity (within 7 days)
        const timeDiff = Math.abs(
          new Date(memories[i].created_at).getTime() - new Date(memories[j].created_at).getTime()
        );
        if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
          relationships.push({
            memory1: memories[i].id,
            memory2: memories[j].id,
            type: 'temporal_proximity',
            strength: 0.7,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Calculate content similarity
   */
  private calculateContentSimilarity(m1: any, m2: any): number {
    const text1 = (m1.title + ' ' + m1.content).toLowerCase();
    const text2 = (m2.title + ' ' + m2.content).toLowerCase();

    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Detect trends over time
   */
  private async detectTrends(memories: any[]): Promise<any[]> {
    const trends: any[] = [];

    // Memory creation trend
    const now = new Date();
    const last30 = memories.filter(m => 
      now.getTime() - new Date(m.created_at).getTime() < 30 * 24 * 60 * 60 * 1000
    ).length;
    const prev30 = memories.filter(m => {
      const diff = now.getTime() - new Date(m.created_at).getTime();
      return diff >= 30 * 24 * 60 * 60 * 1000 && diff < 60 * 24 * 60 * 60 * 1000;
    }).length;

    if (prev30 > 0) {
      const change = ((last30 - prev30) / prev30) * 100;
      trends.push({
        type: 'creation_rate',
        direction: change > 0 ? 'increasing' : 'decreasing',
        change: Math.abs(change).toFixed(1),
        description: `Memory creation ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}%`,
      });
    }

    return trends;
  }

  /**
   * Generate proactive insights
   */
  private async generateInsights(
    memories: any[],
    patterns: MemoryPattern[],
    relationships: any[]
  ): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    // Check for missing information
    const memoriesWithoutContent = memories.filter(m => !m.content || m.content.trim().length < 10);
    if (memoriesWithoutContent.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: 'missing_info',
        priority: 'medium',
        title: 'Memories Need More Details',
        description: `${memoriesWithoutContent.length} memories have minimal content`,
        memoryIds: memoriesWithoutContent.map(m => m.id).slice(0, 5),
        actionable: true,
        suggestedAction: 'Add more details to these memories',
        createdAt: new Date(),
      });
    }

    // Check for potential duplicates
    const duplicatePairs = relationships.filter(r => r.type === 'content_similarity' && r.strength > 0.85);
    if (duplicatePairs.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_2`,
        type: 'duplicate',
        priority: 'low',
        title: 'Potential Duplicate Memories',
        description: `Found ${duplicatePairs.length} pairs of very similar memories`,
        memoryIds: duplicatePairs.slice(0, 3).flatMap(p => [p.memory1, p.memory2]),
        actionable: true,
        suggestedAction: 'Review and merge duplicate memories',
        createdAt: new Date(),
      });
    }

    // Strong relationships
    const strongRelationships = relationships.filter(r => r.strength > 0.7);
    if (strongRelationships.length >= 3) {
      insights.push({
        id: `insight_${Date.now()}_3`,
        type: 'relationship',
        priority: 'low',
        title: 'Connected Memories Detected',
        description: `${strongRelationships.length} memories are closely related`,
        memoryIds: [],
        actionable: true,
        suggestedAction: 'Consider creating a memory collection',
        createdAt: new Date(),
      });
    }

    return insights;
  }

  /**
   * Infer category from text
   */
  private inferCategory(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('work') || lower.includes('project')) return 'Work';
    if (lower.includes('travel') || lower.includes('trip')) return 'Travel';
    if (lower.includes('health') || lower.includes('doctor')) return 'Health';
    if (lower.includes('finance') || lower.includes('bank')) return 'Finance';
    return 'Personal';
  }

  /**
   * Create summary of insights
   */
  private createSummary(
    patterns: MemoryPattern[],
    relationships: any[],
    trends: any[],
    insights: ProactiveInsight[]
  ): string {
    const parts: string[] = [];

    if (patterns.length > 0) {
      parts.push(`Discovered ${patterns.length} behavioral patterns`);
    }

    if (relationships.length > 0) {
      parts.push(`Found ${relationships.length} memory connections`);
    }

    if (trends.length > 0) {
      parts.push(`Identified ${trends.length} trends`);
    }

    if (insights.length > 0) {
      parts.push(`Generated ${insights.length} actionable insights`);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Calculate insight confidence
   */
  private calculateInsightConfidence(
    patterns: MemoryPattern[],
    relationships: any[],
    trends: any[]
  ): number {
    const patternScore = Math.min(patterns.length * 0.2, 0.4);
    const relationshipScore = Math.min(relationships.length * 0.01, 0.3);
    const trendScore = Math.min(trends.length * 0.15, 0.3);

    return Math.min(patternScore + relationshipScore + trendScore, 0.95);
  }
}
