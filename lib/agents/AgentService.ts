/**
 * Agent Service
 * 
 * Main service for interacting with the Multi-Agent System
 * Provides a clean interface for the application to use agents
 */

import { OrchestratorAgent } from './OrchestratorAgent';
import { AgentTask, AgentResult, AgentType, OrchestrationState } from './types';

class AgentService {
  private orchestrator: OrchestratorAgent;
  private state: OrchestrationState;

  constructor() {
    this.orchestrator = new OrchestratorAgent();
    this.state = {
      activeAgents: new Set(),
      completedTasks: [],
      messages: [],
      isProcessing: false,
    };
  }

  /**
   * Execute a query using the multi-agent system
   */
  async executeQuery(query: string, userId: string): Promise<AgentResult> {
    this.state.isProcessing = true;

    try {
      // Create task
      const task: AgentTask = {
        id: `task_${Date.now()}`,
        type: 'search', // Will be determined by orchestrator
        priority: 1,
        query,
        userId,
        createdAt: new Date(),
      };

      // Execute through orchestrator
      const result = await this.orchestrator.execute(task);

      // Update state
      this.state.completedTasks.push(result);
      this.state.currentPlan = result.data?.plan;

      return result;
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Run organization analysis
   */
  async runOrganization(userId: string): Promise<AgentResult> {
    this.state.isProcessing = true;

    try {
      const task: AgentTask = {
        id: `task_org_${Date.now()}`,
        type: 'organize',
        priority: 2,
        query: 'organize my memories',
        userId,
        createdAt: new Date(),
      };

      const agent = this.orchestrator.getAgent('organize');
      if (!agent) throw new Error('Organization agent not available');

      const result = await agent.execute(task);
      this.state.completedTasks.push(result);

      return result;
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Run insight analysis
   */
  async runInsights(userId: string): Promise<AgentResult> {
    this.state.isProcessing = true;

    try {
      const task: AgentTask = {
        id: `task_insight_${Date.now()}`,
        type: 'insight',
        priority: 2,
        query: 'analyze my memory patterns',
        userId,
        createdAt: new Date(),
      };

      const agent = this.orchestrator.getAgent('insight');
      if (!agent) throw new Error('Insight agent not available');

      const result = await agent.execute(task);
      this.state.completedTasks.push(result);

      return result;
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Get proactive reminders
   */
  async getReminders(userId: string): Promise<AgentResult> {
    this.state.isProcessing = true;

    try {
      const task: AgentTask = {
        id: `task_reminder_${Date.now()}`,
        type: 'reminder',
        priority: 3,
        query: 'check for reminders',
        userId,
        createdAt: new Date(),
      };

      const agent = this.orchestrator.getAgent('reminder');
      if (!agent) throw new Error('Reminder agent not available');

      const result = await agent.execute(task);
      this.state.completedTasks.push(result);

      return result;
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Get current orchestration state
   */
  getState(): OrchestrationState {
    return { ...this.state };
  }

  /**
   * Get agent statuses
   */
  getAgentStatuses() {
    return this.orchestrator.getAgentStatuses();
  }

  /**
   * Clear completed tasks history
   */
  clearHistory(): void {
    this.state.completedTasks = [];
    this.state.messages = [];
  }

  /**
   * Get last N completed tasks
   */
  getHistory(limit: number = 10): AgentResult[] {
    return this.state.completedTasks.slice(-limit);
  }
}

// Export singleton instance
export const agentService = new AgentService();

// Export class for testing
export { AgentService };
