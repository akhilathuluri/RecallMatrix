/**
 * Multi-Agent Orchestration System - Type Definitions
 * 
 * Core types for the agent system without modifying existing functionality
 */

export type AgentType = 'search' | 'organize' | 'insight' | 'reminder' | 'orchestrator' | 'chat';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'completed' | 'error';

export type ToolType = 
  | 'vector_search'
  | 'keyword_search'
  | 'temporal_filter'
  | 'graph_traversal'
  | 'categorization'
  | 'pattern_analysis'
  | 'relationship_detection'
  | 'duplicate_detection'
  | 'context_reminder'
  | 'conversational_ai';

export interface AgentTask {
  id: string;
  type: AgentType;
  priority: number;
  query: string;
  userId: string;
  context?: Record<string, any>;
  parameters?: Record<string, any>; // Additional parameters for specialized agents
  dependencies?: string[]; // Task IDs that must complete first
  createdAt: Date;
}

export interface AgentResult {
  taskId: string;
  agentType: AgentType;
  success: boolean;
  data: any;
  reasoning: string[];
  toolsUsed: ToolType[];
  confidence: number;
  executionTime: number;
  error?: string;
}

export interface AgentStep {
  stepNumber: number;
  action: string;
  tool?: ToolType;
  reasoning: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  startTime?: Date;
  endTime?: Date;
}

export interface OrchestrationPlan {
  id: string;
  query: string;
  userId: string;
  agents: AgentType[];
  steps: AgentStep[];
  createdAt: Date;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

export interface AgentCapability {
  name: string;
  description: string;
  tools: ToolType[];
  estimatedTime: number; // in milliseconds
}

export interface SearchStrategy {
  primary: ToolType;
  fallback: ToolType[];
  confidence_threshold: number;
}

export interface MemoryCluster {
  id: string;
  title: string;
  memoryIds: string[];
  category: string;
  tags: string[];
  createdAt: Date;
  confidence: number;
}

export interface MemoryPattern {
  type: 'temporal' | 'categorical' | 'relationship' | 'behavioral';
  description: string;
  evidence: string[];
  confidence: number;
  suggestedActions?: string[];
}

export interface ProactiveInsight {
  id: string;
  type: 'duplicate' | 'missing_info' | 'update_needed' | 'relationship' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  memoryIds: string[];
  actionable: boolean;
  suggestedAction?: string;
  createdAt: Date;
}

export interface AgentMessage {
  id: string;
  agentType: AgentType;
  timestamp: Date;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  data?: any;
}

export interface OrchestrationState {
  currentPlan?: OrchestrationPlan;
  activeAgents: Set<AgentType>;
  completedTasks: AgentResult[];
  messages: AgentMessage[];
  isProcessing: boolean;
}
