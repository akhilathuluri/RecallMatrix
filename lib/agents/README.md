# Multi-Agent Orchestration System

## 🤖 Overview

The Multi-Agent Orchestration System is a modular, extensible AI agent framework built into MemoryVault. It demonstrates true agentic AI capabilities with autonomous decision-making, multi-step reasoning, and coordinated execution across specialized agents.

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│        Master Orchestrator Agent        │
│     (Analyzes, Plans, Coordinates)      │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼─────────┬─────────┐
        ▼         ▼         ▼         ▼
    [Search]  [Organize] [Insight] [Reminder]
     Agent     Agent      Agent     Agent
```

## 🎯 Key Features

### 1. **Master Orchestrator**
- Analyzes user queries to understand intent
- Creates execution plans dynamically
- Coordinates multiple agents
- Synthesizes results from all agents
- Manages dependencies and workflow

### 2. **Search Agent**
- Intelligent query analysis
- Multiple search strategies (vector, keyword, temporal)
- Automatic fallback mechanisms
- Confidence-based strategy selection
- Result ranking and filtering

**Tools:**
- `vector_search` - Semantic similarity search
- `keyword_search` - Exact keyword matching
- `temporal_filter` - Time-based filtering

### 3. **Organization Agent**
- Automatic memory categorization
- Smart clustering of related memories
- Duplicate detection
- Tag generation
- Category inference from content

**Tools:**
- `categorization` - Auto-categorize memories
- `relationship_detection` - Find connections
- `duplicate_detection` - Identify duplicates

### 4. **Insight Agent**
- Pattern discovery (temporal, categorical, behavioral)
- Relationship mapping
- Trend analysis
- Proactive insight generation
- Actionable recommendations

**Tools:**
- `pattern_analysis` - Discover patterns
- `relationship_detection` - Map connections
- `graph_traversal` - Explore relationships
- `temporal_filter` - Analyze trends

### 5. **Reminder Agent**
- Context-based reminders
- Time-sensitive alerts
- Update suggestions for old information
- Priority-based notifications
- Proactive suggestions

**Tools:**
- `context_reminder` - Context-aware alerts
- `temporal_filter` - Time-based analysis
- `pattern_analysis` - Behavioral reminders

## 📁 Project Structure

```
lib/agents/
├── types.ts                    # TypeScript type definitions
├── BaseAgent.ts               # Abstract base class for all agents
├── SearchAgent.ts             # Search specialist
├── OrganizationAgent.ts       # Organization specialist
├── InsightAgent.ts            # Pattern & insight specialist
├── ReminderAgent.ts           # Proactive reminder specialist
├── OrchestratorAgent.ts       # Master coordinator
├── AgentService.ts            # Main service interface
└── index.ts                   # Public exports

app/api/agents/
└── route.ts                   # API endpoint for agent system

components/
├── AgentDashboard.tsx         # Interactive agent visualization
└── Navbar.tsx                 # Updated with agent link

app/(dashboard)/agents/
└── page.tsx                   # Dedicated agent dashboard page
```

## 🚀 Usage

### Via API

#### Execute Query (Orchestrated)
```typescript
POST /api/agents
{
  "query": "analyze my travel memories",
  "userId": "user-id"
}
```

#### Run Specific Agent
```typescript
POST /api/agents
{
  "mode": "organize",  // organize | insights | reminders
  "userId": "user-id"
}
```

#### Get Agent Status
```typescript
GET /api/agents?action=status
```

#### Get Task History
```typescript
GET /api/agents?action=history&limit=10
```

### Via Code

```typescript
import { agentService } from '@/lib/agents';

// Execute orchestrated query
const result = await agentService.executeQuery(
  "find my passport information",
  userId
);

// Run organization
const orgResult = await agentService.runOrganization(userId);

// Get insights
const insights = await agentService.runInsights(userId);

// Get reminders
const reminders = await agentService.getReminders(userId);

// Check status
const statuses = agentService.getAgentStatuses();

// View history
const history = agentService.getHistory(10);
```

### Via UI

Navigate to `/agents` to access the interactive Agent Dashboard where you can:
- Run different agent modes
- View agent reasoning process
- See execution plans
- Monitor agent coordination
- Review task history

## 🎨 Response Format

```typescript
{
  success: boolean,
  data: {
    plan: OrchestrationPlan,      // Execution plan
    agentResults: AgentResult[],  // Individual agent results
    synthesized: {                // Combined insights
      summary: string,
      primaryResult: any,
      additionalInsights: any[],
      recommendations: string[],
      confidence: number
    }
  },
  reasoning: string[],            // Step-by-step thinking
  toolsUsed: ToolType[],          // Tools executed
  confidence: number,             // Overall confidence (0-1)
  executionTime: number,          // Duration in ms
  agentType: AgentType,          // Which agent executed
  error?: string                 // Error message if failed
}
```

## 🔧 Extending the System

### Add a New Agent

1. **Create Agent Class**
```typescript
// lib/agents/CustomAgent.ts
import { BaseAgent } from './BaseAgent';

export class CustomAgent extends BaseAgent {
  constructor() {
    super('custom');
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'Custom Capability',
        description: 'What this agent does',
        tools: ['tool_name'],
        estimatedTime: 500,
      }
    ];
  }

  canHandle(task: AgentTask): boolean {
    return task.type === 'custom';
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    // Implementation
  }
}
```

2. **Register in Orchestrator**
```typescript
// lib/agents/OrchestratorAgent.ts
this.agents = new Map([
  // ... existing agents
  ['custom', new CustomAgent()],
]);
```

3. **Update Types**
```typescript
// lib/agents/types.ts
export type AgentType = 
  | 'search' 
  | 'organize' 
  | 'insight' 
  | 'reminder' 
  | 'custom';  // Add new type
```

### Add a New Tool

1. **Define Tool Type**
```typescript
// lib/agents/types.ts
export type ToolType = 
  | 'existing_tools'
  | 'new_tool_name';
```

2. **Implement Tool Logic**
```typescript
private async executeNewTool(params: any): Promise<any> {
  // Tool implementation
}
```

3. **Register in Agent**
```typescript
getCapabilities(): AgentCapability[] {
  return [{
    name: 'New Capability',
    tools: ['new_tool_name'],
    // ...
  }];
}
```

## 📊 Agent Capabilities

### Search Agent
- ✅ Multi-strategy search
- ✅ Automatic fallback
- ✅ Confidence scoring
- ✅ Result ranking

### Organization Agent  
- ✅ 10 category classification
- ✅ Memory clustering
- ✅ Duplicate detection (85%+ similarity)
- ✅ Auto-tag generation

### Insight Agent
- ✅ Temporal pattern analysis
- ✅ Categorical pattern detection
- ✅ Behavioral insights
- ✅ Relationship mapping
- ✅ Trend analysis

### Reminder Agent
- ✅ Expiration detection
- ✅ Renewal reminders
- ✅ Security info updates
- ✅ Context-based alerts
- ✅ Priority scoring

## 🎯 Agentic AI Features

### ✅ Autonomy
- Agents make independent decisions
- Choose appropriate tools dynamically
- Adapt strategies based on results
- Proactive suggestions without prompting

### ✅ Planning & Reasoning
- Multi-step execution plans
- Chain-of-thought reasoning
- Visible reasoning process
- Adaptive planning

### ✅ Tool Use
- Dynamic tool selection
- Multiple tool coordination
- Fallback mechanisms
- Tool confidence scoring

### ✅ Learning & Adaptation
- Strategy selection based on patterns
- Confidence-based decisions
- Error recovery
- Performance tracking

### ✅ Coordination
- Multi-agent orchestration
- Dependency management
- Result synthesis
- Workflow optimization

## 🔍 Example Workflows

### Complex Query: "Help me plan my Japan trip"

**Orchestrator Analysis:**
1. Detects search + organize + insight intents
2. Creates plan: Search → Organize → Insight
3. Executes agents in sequence
4. Synthesizes results

**Search Agent:**
- Uses vector search for "Japan" + "trip"
- Finds travel-related memories
- Returns ranked results

**Organization Agent:**
- Categorizes as "Travel"
- Creates cluster for Japan trip
- Identifies missing information

**Insight Agent:**
- Analyzes travel patterns
- Generates recommendations
- Suggests additional items to save

**Final Output:**
- Found memories
- Organized by category
- Missing info detected
- Actionable recommendations

## 🎓 Best Practices

1. **Use Orchestrator for Complex Queries**
   - Let it decide which agents to invoke
   - Benefits from multi-agent synthesis

2. **Direct Agent Access for Specific Tasks**
   - Organization: Use when you want to categorize
   - Insights: Use for pattern analysis
   - Reminders: Use for proactive alerts

3. **Monitor Confidence Scores**
   - < 0.5: Low confidence, consider refinement
   - 0.5-0.7: Moderate confidence
   - > 0.7: High confidence results

4. **Review Reasoning Process**
   - Understand agent decisions
   - Identify improvement opportunities
   - Debug unexpected results

## 🚀 Performance

- **Search Agent**: ~500ms average
- **Organization Agent**: ~600ms average
- **Insight Agent**: ~1000ms average
- **Reminder Agent**: ~600ms average
- **Orchestrator Overhead**: ~100ms

**Concurrent Execution:** Agents can run in parallel when no dependencies exist.

## 🔐 Security

- ✅ Row Level Security enforced
- ✅ User data isolation
- ✅ API authentication required
- ✅ No cross-user data access

## 🎉 Benefits for Hackathon

1. **True Agentic Architecture**: Not just RAG, actual multi-agent system
2. **Visible Intelligence**: Shows reasoning process to judges
3. **Modular & Extensible**: Easy to add new capabilities
4. **Practical Use Case**: Solves real memory management problems
5. **Production Ready**: Clean code, error handling, documentation

## 📝 Future Enhancements

- [ ] Agent-to-agent communication
- [ ] Persistent agent memory
- [ ] Learning from user feedback
- [ ] Custom agent creation by users
- [ ] Agent performance analytics
- [ ] Multi-turn conversations
- [ ] Background agent execution
- [ ] Agent scheduling system

## 🐛 Troubleshooting

**Issue: Agent not responding**
- Check API endpoint availability
- Verify user authentication
- Review browser console for errors

**Issue: Low confidence results**
- Check query clarity
- Verify sufficient memory data
- Review agent reasoning for insights

**Issue: Slow execution**
- Check network latency
- Monitor concurrent requests
- Review database query performance

## 📚 Additional Resources

- [Agent System Architecture](../docs/ARCHITECTURE.md)
- [API Documentation](../docs/API.md)
- [Type Definitions](./types.ts)
- [Main README](../README.md)

---

**Built for hackathon demonstration of agentic AI capabilities** 🏆
