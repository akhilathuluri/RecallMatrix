/**
 * Telegram Integration Component
 * Handles Telegram bot connection, auth code display, and status
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Copy, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface TelegramStatus {
  connected: boolean;
  telegram_user_id?: string;
  telegram_username?: string;
  telegram_name?: string;
  connected_at?: string;
}

interface AuthCode {
  code: string;
  expiresInMinutes: number;
}

export function TelegramIntegration() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [authCode, setAuthCode] = useState<AuthCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Fetch connection status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  // Countdown timer for auth code expiry
  useEffect(() => {
    if (!authCode || countdown === null) return;

    if (countdown <= 0) {
      setAuthCode(null);
      setCountdown(null);
      toast.info('Authentication code expired');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, authCode]);

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await fetch('/api/telegram/status');
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        // Silently handle status fetch failures - backend might not be running
        const data = await response.json().catch(() => ({}));
        setStatus({ connected: false, error: data.error || 'Backend unavailable' });
      }
    } catch (error) {
      // Silently handle network errors - backend might not be running
      setStatus({ connected: false, error: 'Backend service unavailable' });
    } finally {
      setStatusLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/telegram/generate-code', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setAuthCode(data);
        setCountdown(data.expiresInMinutes * 60); // Convert to seconds
        toast.success('Authentication code generated!');
      } else {
        const error = await response.json();
        // Handle Pydantic validation errors (array of error objects)
        if (error.detail && Array.isArray(error.detail)) {
          const errorMsg = error.detail.map((e: any) => e.msg).join(', ');
          toast.error(`Validation error: ${errorMsg}`);
        } else {
          toast.error(error.error || error.detail || 'Failed to generate code');
        }
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Telegram?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/telegram/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setStatus({ connected: false });
        setAuthCode(null);
        toast.success('Telegram disconnected successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (authCode) {
      navigator.clipboard.writeText(authCode.code);
      toast.success('Code copied to clipboard!');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (statusLoading) {
    return (
      <Card className="glass-card border rounded-3xl relative overflow-hidden">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border rounded-3xl relative overflow-hidden group card-hover">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-blue-600/10 group-hover:from-sky-500/15 group-hover:to-blue-600/15 transition-all duration-500" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <IconWrapper size="lg" className="bg-gradient-to-br from-sky-500 to-blue-600">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </IconWrapper>
            <div>
              <CardTitle className="flex items-center gap-2 text-xl mb-2">
                Telegram Bot
                {status?.connected ? (
                  <Badge className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-base">
                Add, view, and search memories directly from Telegram
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {status?.connected ? (
          <>
            <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                <div className="space-y-1">
                  <div className="font-medium">
                    Connected as{' '}
                    {status.telegram_username ? (
                      <span className="font-mono">@{status.telegram_username}</span>
                    ) : (
                      status.telegram_name
                    )}
                  </div>
                  {status.connected_at && (
                    <div className="text-sm opacity-80">
                      Connected on {new Date(status.connected_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3 pt-2">
              <h4 className="font-medium text-sm text-muted-foreground">Available Commands:</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <code className="font-mono text-xs bg-background px-2 py-1 rounded">/status</code>
                  <span className="text-muted-foreground">Check connection status</span>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <code className="font-mono text-xs bg-background px-2 py-1 rounded">/list</code>
                  <span className="text-muted-foreground">View recent memories</span>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <code className="font-mono text-xs bg-background px-2 py-1 rounded">/search</code>
                  <span className="text-muted-foreground">Search your memories</span>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <code className="font-mono text-xs bg-background px-2 py-1 rounded">Send message</code>
                  <span className="text-muted-foreground">Create new memory</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={disconnect}
                disabled={loading}
                className="rounded-xl"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Disconnect
              </Button>
              <Button
                variant="ghost"
                onClick={fetchStatus}
                disabled={loading}
                className="rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </>
        ) : (
          <>
            {authCode ? (
              <div className="space-y-4">
                <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    <div className="space-y-3">
                      <div className="font-medium">Step 1: Copy your authentication code</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-2xl font-mono font-bold tracking-wider bg-white dark:bg-background px-4 py-3 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                          {authCode.code}
                        </code>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={copyCode}
                          className="h-12 w-12 rounded-lg"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      {countdown !== null && (
                        <div className="text-sm">
                          Expires in: <span className="font-mono font-medium">{formatTime(countdown)}</span>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertDescription className="space-y-3">
                    <div className="font-medium">Step 2: Open Telegram and send the code</div>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Open Telegram and search for <code className="font-mono bg-muted px-1 py-0.5 rounded">@MemoryVaultBot</code></li>
                      <li>Send the command: <code className="font-mono bg-muted px-1 py-0.5 rounded">/connect {authCode.code}</code></li>
                      <li>Wait for confirmation message</li>
                    </ol>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://t.me/MemoryVaultBot', '_blank')}
                      className="rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Telegram Bot
                    </Button>
                  </AlertDescription>
                </Alert>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setAuthCode(null);
                    setCountdown(null);
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Alert>
                  <AlertDescription className="space-y-2">
                    <div className="font-medium">Connect your Telegram account:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Add, view, and search memories from Telegram</li>
                      <li>Send photos and documents directly</li>
                      <li>Get instant notifications</li>
                      <li>Works on mobile and desktop</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={generateCode}
                  disabled={loading}
                  className="w-full h-11 bg-sky-500 hover:bg-sky-600 rounded-xl"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Connection Code
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
