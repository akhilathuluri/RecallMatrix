/**
 * Organization Agent
 * 
 * Auto-categorizes, tags, and creates memory clusters
 * - Automatic categorization
 * - Tag generation
 * - Memory clustering
 * - Duplicate detection
 */

import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentResult, AgentCapability, ToolType, MemoryCluster } from './types';
import { createClient } from '@/lib/supabase/server';

export class OrganizationAgent extends BaseAgent {
  private categories = [
    'Personal', 'Work', 'Travel', 'Finance', 'Health',
    'Education', 'Shopping', 'Entertainment', 'Family', 'Other'
  ];

  constructor() {
    super('organize');
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'Auto-Categorization',
        description: 'Automatically categorize memories based on content',
        tools: ['categorization'],
        estimatedTime: 600,
      },
      {
        name: 'Memory Clustering',
        description: 'Group related memories into clusters',
        tools: ['relationship_detection'],
        estimatedTime: 800,
      },
      {
        name: 'Duplicate Detection',
        description: 'Identify and flag duplicate or similar memories',
        tools: ['duplicate_detection'],
        estimatedTime: 500,
      },
      {
        name: 'Tag Generation',
        description: 'Generate relevant tags for memories',
        tools: ['categorization'],
        estimatedTime: 400,
      },
    ];
  }

  canHandle(task: AgentTask): boolean {
    return task.type === 'organize';
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    this.isProcessing = true;
    const reasoning: string[] = [];
    const toolsUsed: ToolType[] = [];

    try {
      this.log('Starting organization execution', { userId: task.userId });

      // Step 1: Fetch user's memories
      reasoning.push('Fetching user memories for organization');
      const memories = await this.fetchUserMemories(task.userId);
      reasoning.push(`Retrieved ${memories.length} memories to organize`);

      // Step 2: Categorize memories
      reasoning.push('Analyzing memories for categorization');
      toolsUsed.push('categorization');
      const categorized = await this.categorizeMemories(memories);
      reasoning.push(`Categorized memories into ${Object.keys(categorized).length} categories`);

      // Step 3: Detect duplicates
      reasoning.push('Scanning for duplicate or similar memories');
      toolsUsed.push('duplicate_detection');
      const duplicates = await this.detectDuplicates(memories);
      reasoning.push(`Found ${duplicates.length} potential duplicate groups`);

      // Step 4: Create memory clusters
      reasoning.push('Creating memory clusters based on relationships');
      toolsUsed.push('relationship_detection');
      const clusters = await this.createClusters(memories);
      reasoning.push(`Created ${clusters.length} memory clusters`);

      // Step 5: Generate tags
      reasoning.push('Generating tags for uncategorized content');
      const tags = await this.generateTags(memories);
      reasoning.push(`Generated ${tags.size} unique tags across all memories`);

      const confidence = this.calculateOrganizationConfidence(memories.length, clusters.length);

      // Format categories for display
      const categories = Object.entries(categorized).map(([name, mems]) => ({
        name,
        count: mems.length,
        examples: mems.slice(0, 3).map((m: any) => m.title),
      }));

      this.isProcessing = false;
      return this.createResult(
        task,
        {
          categories,
          categorized,
          duplicates,
          clusters: clusters.map(c => ({
            ...c,
            count: c.memoryIds.length,
            topic: c.title,
          })),
          tags: Array.from(tags),
          totalMemories: memories.length,
        },
        reasoning,
        toolsUsed,
        confidence,
        startTime
      );
    } catch (error: any) {
      this.isProcessing = false;
      this.log('Organization execution failed', error.message);
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.log('Failed to fetch memories', error);
      return [];
    }
  }

  /**
   * Categorize memories based on content analysis
   */
  private async categorizeMemories(memories: any[]): Promise<Record<string, any[]>> {
    const categorized: Record<string, any[]> = {};

    for (const category of this.categories) {
      categorized[category] = [];
    }

    for (const memory of memories) {
      const category = this.inferCategory(memory.title, memory.content);
      if (categorized[category]) {
        categorized[category].push(memory);
      } else {
        categorized['Other'].push(memory);
      }
    }

    // Remove empty categories
    Object.keys(categorized).forEach(key => {
      if (categorized[key].length === 0) {
        delete categorized[key];
      }
    });

    return categorized;
  }

  /**
   * Infer category from title and content
   */
  private inferCategory(title: string, content: string): string {
    const text = `${title} ${content}`.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      'Work': ['work', 'project', 'meeting', 'deadline', 'office', 'client', 'team', 'job', 'career'],
      'Travel': ['travel', 'trip', 'vacation', 'flight', 'hotel', 'passport', 'destination', 'tour'],
      'Finance': ['bank', 'payment', 'invoice', 'budget', 'expense', 'salary', 'tax', 'subscription', 'membership'],
      'Health': ['doctor', 'health', 'medical', 'appointment', 'medication', 'exercise', 'fitness'],
      'Education': ['study', 'course', 'learn', 'book', 'exam', 'university', 'school', 'tutorial'],
      'Shopping': ['buy', 'purchase', 'shop', 'order', 'product', 'store', 'amazon'],
      'Entertainment': ['movie', 'game', 'music', 'show', 'concert', 'watch', 'play', 'netflix', 'spotify'],
      'Family': ['family', 'mom', 'dad', 'child', 'parent', 'relative', 'sister', 'brother', 'birthday'],
      'Personal': ['personal', 'favourite', 'love', 'friend', 'life', 'hobby'],
    };

    let maxScore = 0;
    let bestCategory = 'Personal';

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const score = keywords.filter(keyword => text.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  /**
   * Detect duplicate memories
   */
  private async detectDuplicates(memories: any[]): Promise<any[][]> {
    const duplicateGroups: any[][] = [];
    const processed = new Set<string>();

    for (let i = 0; i < memories.length; i++) {
      if (processed.has(memories[i].id)) continue;

      const group = [memories[i]];
      processed.add(memories[i].id);

      for (let j = i + 1; j < memories.length; j++) {
        if (processed.has(memories[j].id)) continue;

        const similarity = this.calculateSimilarity(
          memories[i].title + ' ' + memories[i].content,
          memories[j].title + ' ' + memories[j].content
        );

        if (similarity > 0.85) {
          group.push(memories[j]);
          processed.add(memories[j].id);
        }
      }

      if (group.length > 1) {
        duplicateGroups.push(group);
      }
    }

    return duplicateGroups;
  }

  /**
   * Calculate text similarity (simple Jaccard similarity)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Create memory clusters based on relationships
   */
  private async createClusters(memories: any[]): Promise<MemoryCluster[]> {
    const clusters: MemoryCluster[] = [];
    const processed = new Set<string>();

    // Simple clustering by date proximity and category
    const sortedMemories = [...memories].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let currentCluster: any[] = [];
    let currentCategory = '';

    for (const memory of sortedMemories) {
      const category = this.inferCategory(memory.title, memory.content);

      if (currentCategory === category && currentCluster.length > 0) {
        currentCluster.push(memory);
      } else {
        if (currentCluster.length >= 2) {
          clusters.push({
            id: `cluster_${clusters.length + 1}`,
            title: `${currentCategory} Memories`,
            memoryIds: currentCluster.map(m => m.id),
            category: currentCategory,
            tags: this.extractTags(currentCluster),
            createdAt: new Date(),
            confidence: 0.8,
          });
        }
        currentCluster = [memory];
        currentCategory = category;
      }
    }

    // Add last cluster if it has enough memories
    if (currentCluster.length >= 2) {
      clusters.push({
        id: `cluster_${clusters.length + 1}`,
        title: `${currentCategory} Memories`,
        memoryIds: currentCluster.map(m => m.id),
        category: currentCategory,
        tags: this.extractTags(currentCluster),
        createdAt: new Date(),
        confidence: 0.8,
      });
    }

    return clusters;
  }

  /**
   * Generate tags for memories
   */
  private async generateTags(memories: any[]): Promise<Set<string>> {
    const tags = new Set<string>();

    for (const memory of memories) {
      const memoryTags = this.extractTags([memory]);
      memoryTags.forEach(tag => tags.add(tag));
    }

    return tags;
  }

  /**
   * Extract tags from memories
   */
  private extractTags(memories: any[]): string[] {
    const tags = new Set<string>();
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'was', 'are', 'were',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
      'with', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below'
    ]);

    for (const memory of memories) {
      const text = `${memory.title} ${memory.content}`.toLowerCase();
      
      // Remove URLs
      const textWithoutUrls = text.replace(/https?:\/\/[^\s]+/g, '');
      
      // Split into words and filter
      const words = textWithoutUrls
        .split(/[\s,\.;:!?()\[\]{}"']+/)
        .filter(w => 
          w.length >= 3 && 
          w.length <= 20 && 
          !commonWords.has(w) &&
          !/^\d+$/.test(w) && // Not just numbers
          !/[^a-z0-9-_]/.test(w) // Only alphanumeric and hyphens
        );

      // Add most relevant words
      words.slice(0, 5).forEach(word => tags.add(word));
    }

    return Array.from(tags).slice(0, 15);
  }

  /**
   * Calculate organization confidence
   */
  private calculateOrganizationConfidence(totalMemories: number, clustersCreated: number): number {
    if (totalMemories === 0) return 0;

    const clusterRatio = clustersCreated / Math.max(totalMemories / 5, 1);
    return Math.min(0.6 + clusterRatio * 0.4, 0.95);
  }
}
