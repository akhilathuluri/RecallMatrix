'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, Link2, AlertCircle, Loader2, Calendar, BarChart3, Network } from 'lucide-react';
import { GradientText } from '@/components/ui/gradient-text';

export interface MemoryPattern {
  type: 'temporal' | 'categorical' | 'behavioral';
  description: string;
  evidence: string[];
  confidence: number;
  suggestedActions?: string[];
}

export interface ProactiveInsight {
  id: string;
  type: 'missing_info' | 'duplicate' | 'relationship' | 'reminder';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  memoryIds: string[];
  actionable: boolean;
  suggestedAction: string;
  createdAt: Date;
}

export interface Trend {
  type: string;
  direction: 'increasing' | 'decreasing';
  change: string;
  description: string;
}

export interface InsightsData {
  patterns: MemoryPattern[];
  relationships: any[];
  trends: Trend[];
  insights: ProactiveInsight[];
  summary: string;
}

type InsightsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: InsightsData | null;
  loading: boolean;
};

const priorityColors = {
  high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
};

const patternIcons = {
  temporal: Calendar,
  categorical: BarChart3,
  behavioral: Network,
};

export function InsightsModal({ open, onOpenChange, data, loading }: InsightsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] md:max-w-[900px] max-h-[85vh] glass-card border shadow-2xl rounded-3xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <GradientText>Your Insights</GradientText>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            AI-powered analysis of your memory patterns and trends
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="px-6 py-4 space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing your memories...</p>
              </div>
            )}

            {!loading && data && (
              <>
                {/* Summary Section */}
                {data.summary && (
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {data.summary}
                    </p>
                  </Card>
                )}

                {/* Patterns Section */}
                {data.patterns && data.patterns.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      Discovered Patterns
                    </h3>
                    <div className="grid gap-3">
                      {data.patterns.map((pattern, index) => {
                        const Icon = patternIcons[pattern.type] || BarChart3;
                        return (
                          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {pattern.type}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {(pattern.confidence * 100).toFixed(0)}% confidence
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mb-2">{pattern.description}</p>
                                {pattern.evidence && pattern.evidence.length > 0 && (
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {pattern.evidence.map((evidence, i) => (
                                      <li key={i} className="flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-current" />
                                        {evidence}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {pattern.suggestedActions && pattern.suggestedActions.length > 0 && (
                                  <div className="mt-2 pt-2 border-t">
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                                      Suggested Actions:
                                    </p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                      {pattern.suggestedActions.map((action, i) => (
                                        <li key={i}>• {action}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Trends Section */}
                {data.trends && data.trends.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                      Trends & Changes
                    </h3>
                    <div className="grid gap-3">
                      {data.trends.map((trend, index) => (
                        <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                trend.direction === 'increasing' 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-orange-100 dark:bg-orange-900/30'
                              }`}>
                                <TrendingUp className={`w-4 h-4 ${
                                  trend.direction === 'increasing' 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-orange-600 dark:text-orange-400 rotate-180'
                                }`} />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{trend.description}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Type: {trend.type.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {trend.change}%
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relationships Section */}
                {data.relationships && data.relationships.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-indigo-600" />
                      Memory Connections
                    </h3>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">
                        Found <span className="font-semibold text-foreground">{data.relationships.length}</span> connections between your memories
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {data.relationships.slice(0, 5).map((rel, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {rel.type.replace('_', ' ')} • {(rel.strength * 100).toFixed(0)}%
                          </Badge>
                        ))}
                        {data.relationships.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{data.relationships.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Actionable Insights Section */}
                {data.insights && data.insights.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      Actionable Insights
                    </h3>
                    <div className="grid gap-3">
                      {data.insights.map((insight) => (
                        <Card key={insight.id} className={`p-4 border-2 ${priorityColors[insight.priority]}`}>
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold">{insight.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {insight.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground/80 mb-2">{insight.description}</p>
                              {insight.actionable && insight.suggestedAction && (
                                <div className="mt-2 p-2 rounded-lg bg-muted/50">
                                  <p className="text-xs font-medium text-primary">
                                    💡 {insight.suggestedAction}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {data.patterns.length === 0 && data.insights.length === 0 && data.trends.length === 0 && (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-muted/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Add more memories to unlock AI-powered insights about your patterns and trends
                    </p>
                  </div>
                )}
              </>
            )}

            {!loading && !data && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to Generate Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Please try again later
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
