/**
 * Multi-Agent System Entry Point
 * 
 * Exports all agents and types for use in the application
 */

// Core types
export type {
  AgentType,
  AgentStatus,
  ToolType,
  AgentTask,
  AgentResult,
  AgentStep,
  OrchestrationPlan,
  AgentCapability,
  SearchStrategy,
  MemoryCluster,
  MemoryPattern,
  ProactiveInsight,
  AgentMessage,
  OrchestrationState,
} from './types';

// Base agent
export { BaseAgent } from './BaseAgent';

// Specialized agents
export { SearchAgent } from './SearchAgent';
export { OrganizationAgent } from './OrganizationAgent';
export { InsightAgent } from './InsightAgent';
export { ReminderAgent } from './ReminderAgent';
export { ChatAgent } from './ChatAgent';

// Orchestrator
export { OrchestratorAgent } from './OrchestratorAgent';

// Main service
export { agentService, AgentService } from './AgentService';
