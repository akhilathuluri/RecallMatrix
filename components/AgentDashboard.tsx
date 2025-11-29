'use client';

/**
 * Agent Dashboard Component
 * 
 * Visualizes the multi-agent system in action
 * Shows agent activity, reasoning, and results
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Search,
  FolderKanban,
  Lightbulb,
  Bell,
  MessageCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  Network,
  Tag,
} from 'lucide-react';
import type { AgentResult, AgentType } from '@/lib/agents/types';

interface AgentDashboardProps {
  userId: string;
}

const agentIcons: Record<AgentType, any> = {
  orchestrator: Brain,
  search: Search,
  organize: FolderKanban,
  insight: Lightbulb,
  reminder: Bell,
  chat: MessageCircle,
};

const agentColors: Record<AgentType, string> = {
  orchestrator: 'from-purple-500 to-indigo-500',
  search: 'from-blue-500 to-cyan-500',
  organize: 'from-green-500 to-emerald-500',
  insight: 'from-yellow-500 to-orange-500',
  reminder: 'from-red-500 to-pink-500',
  chat: 'from-teal-500 to-cyan-500',
};

export function AgentDashboard({ userId }: AgentDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [activeMode, setActiveMode] = useState<'search' | 'organize' | 'insights' | 'reminders'>('search');
  const [history, setHistory] = useState<AgentResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const runAgent = async (mode: string, query?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mode,
          query: query || `Run ${mode} analysis`,
        }),
      });

      if (!response.ok) throw new Error('Agent request failed');

      const data = await response.json();
      setResult(data);
      
      // Add to history
      setHistory(prev => [...prev, data].slice(-10));
    } catch (error) {
      console.error('Agent execution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const AgentIcon = result ? agentIcons[result.agentType] : Brain;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Multi-Agent System</CardTitle>
              <CardDescription>
                Autonomous AI agents working together to manage your memories
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => {
                setActiveMode('organize');
                runAgent('organize');
              }}
              disabled={loading}
              variant={activeMode === 'organize' ? 'default' : 'outline'}
              className="h-20 flex-col gap-2"
            >
              <FolderKanban className="w-5 h-5" />
              <span>Organize</span>
            </Button>
            <Button
              onClick={() => {
                setActiveMode('insights');
                runAgent('insights');
              }}
              disabled={loading}
              variant={activeMode === 'insights' ? 'default' : 'outline'}
              className="h-20 flex-col gap-2"
            >
              <Lightbulb className="w-5 h-5" />
              <span>Insights</span>
            </Button>
            <Button
              onClick={() => {
                setActiveMode('reminders');
                runAgent('reminders');
              }}
              disabled={loading}
              variant={activeMode === 'reminders' ? 'default' : 'outline'}
              className="h-20 flex-col gap-2"
            >
              <Bell className="w-5 h-5" />
              <span>Reminders</span>
            </Button>
            <div className="col-span-2 md:col-span-1">
              <Button
                onClick={() => {
                  setActiveMode('search');
                  if (searchQuery.trim()) {
                    runAgent('search', searchQuery);
                  } else {
                    runAgent('search', 'analyze my memories');
                  }
                }}
                disabled={loading}
                variant={activeMode === 'search' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2 w-full"
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </Button>
            </div>
          </div>
          
          {/* Search Query Input */}
          {activeMode === 'search' && (
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Enter search query (e.g., 'passwords', 'vacation plans', 'health records')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && searchQuery.trim()) {
                    runAgent('search', searchQuery);
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => runAgent('search', searchQuery)}
                disabled={loading || !searchQuery.trim()}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="border-blue-500/50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <div className="text-center">
                <p className="font-semibold">Agents Working...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing your memories and generating insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${agentColors[result.agentType]}`}>
                      <AgentIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="capitalize">{result.agentType} Agent</CardTitle>
                      <CardDescription>
                        Executed in {result.executionTime}ms
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" />
                        Failed
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {(result.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {result.toolsUsed.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Tools Used:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.toolsUsed.map((tool, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <Zap className="w-3 h-3" />
                          {tool.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.data?.synthesized?.summary && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">Summary:</p>
                    <p className="text-sm">{result.data.synthesized.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agent Results */}
            {result.data?.agentResults && (
              <div className="grid gap-4 md:grid-cols-2">
                {result.data.agentResults.map((agentResult: any, idx: number) => {
                  const Icon = agentIcons[agentResult.agentType as AgentType];
                  return (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <CardTitle className="text-base capitalize">
                            {agentResult.agentType}
                          </CardTitle>
                          {agentResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {(agentResult.confidence * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {agentResult.executionTime}ms
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reasoning">
            <Card>
              <CardHeader>
                <CardTitle>Agent Reasoning Process</CardTitle>
                <CardDescription>
                  Step-by-step thinking of the agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full">
                  <div className="space-y-3">
                    {result.reasoning.map((step, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{step}</p>
                        </div>
                        {idx < result.reasoning.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Agent Results</CardTitle>
                <CardDescription>
                  Detailed findings and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full">
                  <div className="space-y-4">
                    {/* Summary Banner */}
                    {result.data?.synthesized?.summary && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-sm mb-1">Summary</div>
                            <p className="text-sm">{result.data.synthesized.summary}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Organization Results */}
                    {result.data?.categories && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold flex items-center gap-2">
                            <FolderKanban className="w-4 h-4" />
                            Categories ({result.data.categories.length})
                          </h3>
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const response = await fetch('/api/organize', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    categorized: result.data.categorized,
                                    clusters: result.data.clusters,
                                    tags: result.data.tags,
                                  }),
                                });
                                const data = await response.json();
                                if (data.success) {
                                  alert(`✅ ${data.message}\n\nGo to Memories page to see your organized folders!`);
                                } else {
                                  alert('Failed to apply organization');
                                }
                              } catch (error) {
                                alert('Error applying organization');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            className="gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Apply to Memories
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {result.data.categories.map((cat: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="font-medium text-sm">{cat.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {cat.count} {cat.count === 1 ? 'memory' : 'memories'}
                              </div>
                              {cat.examples && cat.examples.length > 0 && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  e.g., {cat.examples[0]}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {result.data?.tags && result.data.tags.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Generated Tags ({result.data.tags.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {result.data.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clusters */}
                    {result.data?.clusters && result.data.clusters.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Network className="w-4 h-4" />
                          Memory Clusters ({result.data.clusters.length})
                        </h3>
                        <div className="space-y-2">
                          {result.data.clusters.map((cluster: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="font-medium text-sm">{cluster.topic || `Cluster ${idx + 1}`}</div>
                              <div className="text-xs text-muted-foreground">
                                {cluster.memories?.length || cluster.count} related memories
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Patterns */}
                    {result.data?.patterns && result.data.patterns.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Discovered Patterns ({result.data.patterns.length})
                        </h3>
                        <div className="space-y-2">
                          {result.data.patterns.map((pattern: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="font-medium text-sm">{pattern.type}</div>
                              <div className="text-sm">{pattern.description}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Confidence: {(pattern.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Insights */}
                    {result.data?.insights && result.data.insights.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Insights ({result.data.insights.length})
                        </h3>
                        <div className="space-y-2">
                          {result.data.insights.map((insight: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="font-medium text-sm">{insight.title}</div>
                              <div className="text-sm mt-1">{insight.description}</div>
                              {insight.action && (
                                <div className="text-xs text-primary mt-2">
                                  💡 {insight.action}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reminders */}
                    {(result.data?.reminders !== undefined) && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          Reminders ({result.data.reminders.length})
                        </h3>
                        {result.data.reminders.length > 0 ? (
                          <div className="space-y-2">
                            {result.data.reminders.map((reminder: any, idx: number) => (
                              <div key={idx} className="p-3 bg-muted rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{reminder.title}</div>
                                    <div className="text-sm mt-1">{reminder.description}</div>
                                    {reminder.suggestedAction && (
                                      <div className="text-xs text-primary mt-2">
                                        💡 {reminder.suggestedAction}
                                      </div>
                                    )}
                                    {reminder.dueDate && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Due: {new Date(reminder.dueDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant={
                                    reminder.priority === 'high' ? 'destructive' :
                                    reminder.priority === 'medium' ? 'default' : 'secondary'
                                  }>
                                    {reminder.priority}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 bg-muted/50 rounded-lg text-center">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-sm font-medium mb-1">No Reminders Found</p>
                            <p className="text-xs text-muted-foreground">
                              No time-sensitive items detected in your memories.
                              Try adding memories with dates like "expires Dec 1st 2025" or "subscription renewal due".
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Search Results */}
                    {(result.data?.memories || 
                      result.data?.agentResults?.[0]?.data?.memories ||
                      result.data?.synthesized?.memories) && (
                      <div>
                        {(() => {
                          const memories = result.data?.memories || 
                                         result.data?.agentResults?.[0]?.data?.memories ||
                                         result.data?.synthesized?.memories || [];
                          
                          if (memories.length === 0) return null;
                          
                          return (
                            <>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Found Memories ({memories.length})
                              </h3>
                              <div className="space-y-2">
                                {memories.slice(0, 10).map((memory: any, idx: number) => (
                                  <div key={idx} className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm mb-1">{memory.title || 'Untitled Memory'}</div>
                                        <div className="text-sm text-muted-foreground line-clamp-3 mb-2">
                                          {memory.content}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          {memory.type && (
                                            <Badge variant="outline" className="text-xs">
                                              {memory.type}
                                            </Badge>
                                          )}
                                          {memory.created_at && (
                                            <span>
                                              {new Date(memory.created_at).toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {memory.similarity && (
                                        <Badge variant="secondary" className="shrink-0">
                                          {(memory.similarity * 100).toFixed(0)}% match
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {memories.length > 10 && (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    +{memories.length - 10} more memories
                                  </p>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Fallback: Show raw JSON if no formatted data */}
                    {!result.data?.categories && 
                     !result.data?.tags && 
                     !result.data?.clusters &&
                     !result.data?.patterns &&
                     !result.data?.insights &&
                     !result.data?.reminders &&
                     !result.data?.memories && (
                      <div>
                        <h3 className="font-semibold mb-2">Raw Data</h3>
                        <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan">
            <Card>
              <CardHeader>
                <CardTitle>Orchestration Plan</CardTitle>
                <CardDescription>
                  How the orchestrator coordinated agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result.data?.plan ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {result.data.plan.agents.map((agent: string, idx: number) => {
                        const Icon = agentIcons[agent as AgentType];
                        return (
                          <Badge key={idx} variant="secondary" className="gap-2 py-2">
                            <Icon className="w-4 h-4" />
                            {agent}
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      {result.data.plan.steps.map((step: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">Step {step.stepNumber}</span>
                            <Badge variant="outline" className="text-xs">
                              {step.tool}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{step.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">{step.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No orchestration plan available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
