/**
 * Orchestrator Agent
 * 
 * Master coordinator that manages all specialized agents
 * - Analyzes queries and determines which agents to invoke
 * - Coordinates multi-agent workflows
 * - Manages task dependencies
 * - Synthesizes results from multiple agents
 */

import { BaseAgent } from './BaseAgent';
import { SearchAgent } from './SearchAgent';
import { OrganizationAgent } from './OrganizationAgent';
import { InsightAgent } from './InsightAgent';
import { ReminderAgent } from './ReminderAgent';
import {
  AgentTask,
  AgentResult,
  AgentCapability,
  AgentType,
  OrchestrationPlan,
  AgentStep,
} from './types';

export class OrchestratorAgent extends BaseAgent {
  private agents: Map<AgentType, BaseAgent>;

  constructor() {
    super('orchestrator');

    // Initialize all specialized agents
    this.agents = new Map<AgentType, BaseAgent>([
      ['search' as AgentType, new SearchAgent()],
      ['organize' as AgentType, new OrganizationAgent()],
      ['insight' as AgentType, new InsightAgent()],
      ['reminder' as AgentType, new ReminderAgent()],
    ]);
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'Query Analysis',
        description: 'Analyze user queries to determine required agents',
        tools: [],
        estimatedTime: 100,
      },
      {
        name: 'Multi-Agent Coordination',
        description: 'Coordinate execution of multiple specialized agents',
        tools: [],
        estimatedTime: 500,
      },
      {
        name: 'Result Synthesis',
        description: 'Combine results from multiple agents into coherent response',
        tools: [],
        estimatedTime: 200,
      },
    ];
  }

  canHandle(task: AgentTask): boolean {
    return true; // Orchestrator can handle any task
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    this.isProcessing = true;
    const reasoning: string[] = [];

    try {
      this.log('Starting orchestration', { query: task.query });

      // Step 1: Create execution plan
      reasoning.push('Analyzing query to create execution plan');
      const plan = await this.createPlan(task);
      reasoning.push(`Plan created: Will execute ${plan.agents.length} agents`);
      reasoning.push(`Agents: ${plan.agents.join(', ')}`);

      // Step 2: Execute agents according to plan
      reasoning.push('Executing agents in planned sequence');
      const results = await this.executePlan(plan, task);
      reasoning.push(`Completed execution: ${results.filter(r => r.success).length}/${results.length} successful`);

      // Step 3: Synthesize results
      reasoning.push('Synthesizing results from all agents');
      const synthesized = await this.synthesizeResults(results, task);
      reasoning.push('Results synthesized successfully');

      const confidence = this.calculateOverallConfidence(results);

      this.isProcessing = false;
      return this.createResult(
        task,
        {
          plan,
          agentResults: results,
          synthesized,
        },
        reasoning,
        [],
        confidence,
        startTime
      );
    } catch (error: any) {
      this.isProcessing = false;
      this.log('Orchestration failed', error.message);
      return this.createErrorResult(task, error.message, startTime);
    }
  }

  /**
   * Create execution plan based on query analysis
   */
  private async createPlan(task: AgentTask): Promise<OrchestrationPlan> {
    const plan: OrchestrationPlan = {
      id: `plan_${Date.now()}`,
      query: task.query,
      userId: task.userId,
      agents: [],
      steps: [],
      createdAt: new Date(),
      status: 'planning',
    };

    const queryLower = task.query.toLowerCase();

    // Analyze query intent
    const intents = this.analyzeIntent(queryLower);

    // Determine which agents to invoke
    if (intents.includes('search') || intents.includes('find') || intents.includes('query')) {
      plan.agents.push('search');
      plan.steps.push({
        stepNumber: plan.steps.length + 1,
        action: 'Execute search for relevant memories',
        tool: 'vector_search',
        reasoning: 'Query requires finding specific memories',
        status: 'pending',
      });
    }

    if (intents.includes('organize') || intents.includes('categorize') || intents.includes('cluster')) {
      plan.agents.push('organize');
      plan.steps.push({
        stepNumber: plan.steps.length + 1,
        action: 'Organize and categorize memories',
        tool: 'categorization',
        reasoning: 'Query asks for organization of memories',
        status: 'pending',
      });
    }

    if (intents.includes('insight') || intents.includes('pattern') || intents.includes('analyze')) {
      plan.agents.push('insight');
      plan.steps.push({
        stepNumber: plan.steps.length + 1,
        action: 'Analyze patterns and generate insights',
        tool: 'pattern_analysis',
        reasoning: 'Query requests analysis or insights',
        status: 'pending',
      });
    }

    if (intents.includes('reminder') || intents.includes('proactive')) {
      plan.agents.push('reminder');
      plan.steps.push({
        stepNumber: plan.steps.length + 1,
        action: 'Generate proactive reminders',
        tool: 'context_reminder',
        reasoning: 'Query may benefit from reminder suggestions',
        status: 'pending',
      });
    }

    // Default to search if no specific intent detected
    if (plan.agents.length === 0) {
      plan.agents.push('search');
      plan.steps.push({
        stepNumber: 1,
        action: 'Execute default search',
        tool: 'vector_search',
        reasoning: 'Default action for unclassified queries',
        status: 'pending',
      });
    }

    // Add insight agent for complex queries
    if (plan.agents.length >= 2 && !plan.agents.includes('insight')) {
      plan.agents.push('insight');
      plan.steps.push({
        stepNumber: plan.steps.length + 1,
        action: 'Generate insights from multi-agent results',
        tool: 'pattern_analysis',
        reasoning: 'Complex query benefits from insight synthesis',
        status: 'pending',
      });
    }

    return plan;
  }

  /**
   * Analyze query intent
   */
  private analyzeIntent(query: string): string[] {
    const intents: string[] = [];

    // Search intents
    if (/\b(find|search|show|get|retrieve|where|what|when)\b/i.test(query)) {
      intents.push('search', 'find', 'query');
    }

    // Organization intents
    if (/\b(organize|categorize|group|cluster|sort|arrange)\b/i.test(query)) {
      intents.push('organize', 'categorize', 'cluster');
    }

    // Insight intents
    if (/\b(analyze|insight|pattern|trend|discover|understand|learn)\b/i.test(query)) {
      intents.push('insight', 'pattern', 'analyze');
    }

    // Reminder intents
    if (/\b(remind|alert|notify|check|update|expire)\b/i.test(query)) {
      intents.push('reminder', 'proactive');
    }

    return intents;
  }

  /**
   * Execute the orchestration plan
   */
  private async executePlan(plan: OrchestrationPlan, task: AgentTask): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    plan.status = 'executing';

    for (const agentType of plan.agents) {
      const agent = this.agents.get(agentType);
      if (!agent) {
        this.log('Agent not found', agentType);
        continue;
      }

      try {
        this.log(`Executing ${agentType} agent`);

        // Create task for this agent
        const agentTask: AgentTask = {
          ...task,
          type: agentType,
        };

        // Execute agent
        const result = await agent.execute(agentTask);
        results.push(result);

        this.log(`${agentType} agent completed`, {
          success: result.success,
          confidence: result.confidence,
        });
      } catch (error: any) {
        this.log(`${agentType} agent failed`, error.message);
        results.push({
          taskId: task.id,
          agentType,
          success: false,
          data: null,
          reasoning: [`Agent execution failed: ${error.message}`],
          toolsUsed: [],
          confidence: 0,
          executionTime: 0,
          error: error.message,
        });
      }
    }

    plan.status = 'completed';
    return results;
  }

  /**
   * Synthesize results from multiple agents
   */
  private async synthesizeResults(results: AgentResult[], task: AgentTask): Promise<any> {
    const synthesis: any = {
      summary: '',
      primaryResult: null,
      additionalInsights: [],
      recommendations: [],
      confidence: 0,
    };

    // Extract primary search results
    const searchResult = results.find(r => r.agentType === 'search' && r.success);
    if (searchResult) {
      synthesis.primaryResult = searchResult.data;
      synthesis.summary = `Found ${searchResult.data?.memories?.length || 0} relevant memories`;
    }

    // Add organization insights
    const orgResult = results.find(r => r.agentType === 'organize' && r.success);
    if (orgResult) {
      synthesis.additionalInsights.push({
        type: 'organization',
        data: {
          categories: Object.keys(orgResult.data?.categorized || {}),
          clusters: orgResult.data?.clusters?.length || 0,
          duplicates: orgResult.data?.duplicates?.length || 0,
        },
      });

      if (orgResult.data?.duplicates?.length > 0) {
        synthesis.recommendations.push(
          `Found ${orgResult.data.duplicates.length} groups of duplicate memories that could be merged`
        );
      }
    }

    // Add pattern insights
    const insightResult = results.find(r => r.agentType === 'insight' && r.success);
    if (insightResult) {
      synthesis.additionalInsights.push({
        type: 'patterns',
        data: {
          patterns: insightResult.data?.patterns?.length || 0,
          relationships: insightResult.data?.relationships?.length || 0,
          insights: insightResult.data?.insights?.length || 0,
        },
      });

      if (insightResult.data?.insights?.length > 0) {
        const highPriority = insightResult.data.insights.filter((i: any) => i.priority === 'high');
        if (highPriority.length > 0) {
          synthesis.recommendations.push(
            `${highPriority.length} high-priority items need attention`
          );
        }
      }
    }

    // Add reminder insights
    const reminderResult = results.find(r => r.agentType === 'reminder' && r.success);
    if (reminderResult) {
      synthesis.additionalInsights.push({
        type: 'reminders',
        data: {
          reminders: reminderResult.data?.totalReminders || 0,
          urgent: reminderResult.data?.reminders?.filter((r: any) => r.priority === 'high').length || 0,
        },
      });

      const urgentReminders = reminderResult.data?.reminders?.filter((r: any) => r.priority === 'high') || [];
      if (urgentReminders.length > 0) {
        synthesis.recommendations.push(
          `${urgentReminders.length} urgent reminders require immediate attention`
        );
      }
    }

    // Calculate overall confidence
    synthesis.confidence = this.calculateOverallConfidence(results);

    return synthesis;
  }

  /**
   * Calculate overall confidence from all agent results
   */
  private calculateOverallConfidence(results: AgentResult[]): number {
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) return 0;

    const avgConfidence = successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length;

    // Boost confidence if multiple agents succeeded
    const successBoost = Math.min((successfulResults.length - 1) * 0.05, 0.15);

    return Math.min(avgConfidence + successBoost, 0.98);
  }

  /**
   * Get status of all agents
   */
  getAgentStatuses(): Record<AgentType, { isProcessing: boolean }> {
    const statuses: any = {};

    this.agents.forEach((agent, type) => {
      statuses[type] = agent.getStatus();
    });

    return statuses;
  }

  /**
   * Get specific agent
   */
  getAgent(type: AgentType): BaseAgent | undefined {
    return this.agents.get(type);
  }
}
