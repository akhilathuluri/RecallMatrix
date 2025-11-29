/**
 * Base Agent Class
 * 
 * Abstract base class for all specialized agents in the system
 */

import { 
  AgentType, 
  AgentTask, 
  AgentResult, 
  AgentStep, 
  ToolType,
  AgentCapability 
} from './types';

export abstract class BaseAgent {
  protected agentType: AgentType;
  protected capabilities: AgentCapability[] = [];
  protected isProcessing: boolean = false;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
  }

  /**
   * Main execution method - must be implemented by each agent
   */
  abstract execute(task: AgentTask): Promise<AgentResult>;

  /**
   * Get agent capabilities
   */
  abstract getCapabilities(): AgentCapability[];

  /**
   * Check if this agent can handle a specific task
   */
  abstract canHandle(task: AgentTask): boolean;

  /**
   * Get estimated execution time for a task
   */
  getEstimatedTime(task: AgentTask): number {
    return 1000; // Default 1 second
  }

  /**
   * Create a reasoning step
   */
  protected createStep(
    stepNumber: number,
    action: string,
    reasoning: string,
    tool?: ToolType
  ): AgentStep {
    return {
      stepNumber,
      action,
      tool,
      reasoning,
      status: 'pending',
      startTime: new Date(),
    };
  }

  /**
   * Update step status
   */
  protected updateStep(step: AgentStep, status: AgentStep['status'], result?: any): AgentStep {
    return {
      ...step,
      status,
      result,
      endTime: new Date(),
    };
  }

  /**
   * Create a successful result
   */
  protected createResult(
    task: AgentTask,
    data: any,
    reasoning: string[],
    toolsUsed: ToolType[],
    confidence: number,
    startTime: Date
  ): AgentResult {
    return {
      taskId: task.id,
      agentType: this.agentType,
      success: true,
      data,
      reasoning,
      toolsUsed,
      confidence,
      executionTime: Date.now() - startTime.getTime(),
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    task: AgentTask,
    error: string,
    startTime: Date
  ): AgentResult {
    return {
      taskId: task.id,
      agentType: this.agentType,
      success: false,
      data: null,
      reasoning: [`Error: ${error}`],
      toolsUsed: [],
      confidence: 0,
      executionTime: Date.now() - startTime.getTime(),
      error,
    };
  }

  /**
   * Log agent activity
   */
  protected log(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.agentType.toUpperCase()} AGENT]`, message, data || '');
    }
  }

  /**
   * Get agent status
   */
  getStatus(): { type: AgentType; isProcessing: boolean } {
    return {
      type: this.agentType,
      isProcessing: this.isProcessing,
    };
  }
}
