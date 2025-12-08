'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { TelegramIntegration } from '@/components/TelegramIntegration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { GradientText } from '@/components/ui/gradient-text';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export default function IntegrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navbar onAddMemory={() => {}} />

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-6xl relative">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 sm:mb-8 gap-2 hover:bg-muted rounded-lg sm:rounded-xl smooth-transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <div className="mb-8 sm:mb-12 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            <GradientText>Integrations</GradientText>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Connect your favorite apps and services to automatically sync your memories
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-2 mb-6 sm:mb-8">
          {/* Telegram Integration - Active */}
          <TelegramIntegration />

          <Card className="glass-card border rounded-3xl relative overflow-hidden group card-hover animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 group-hover:from-blue-500/10 group-hover:to-blue-600/10 transition-all duration-500" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <IconWrapper size="lg" className="bg-gradient-to-br from-blue-500 to-blue-600">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                    </svg>
                  </IconWrapper>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl mb-2">
                      Google Drive
                      <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Automatically sync your files from Google Drive
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Button disabled className="w-full h-11 bg-blue-500 hover:bg-blue-600 rounded-xl">
                Connect
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border shadow-2xl rounded-3xl relative overflow-hidden group hover:shadow-green-500/20 transition-all duration-300 smooth-transition animate-in" style={{ animationDelay: '50ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-400/10 dark:to-green-500/10 group-hover:from-green-500/20 group-hover:to-green-600/20 transition-all duration-300" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <IconWrapper size="lg" className="bg-gradient-to-br from-slate-800 to-slate-900 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 4v16h16V4H4zm8 14H6v-2h6v2zm6-4H6v-2h12v2zm0-4H6V8h12v2z"/>
                    </svg>
                  </IconWrapper>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      Notion
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300">Coming Soon</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Import your notes and documents from Notion
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Button disabled className="w-full h-11 bg-slate-800 hover:bg-slate-900 rounded-xl">
                Connect
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border shadow-2xl rounded-3xl relative overflow-hidden group hover:shadow-emerald-500/20 transition-all duration-300 smooth-transition animate-in" style={{ animationDelay: '100ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 dark:from-emerald-400/10 dark:to-emerald-500/10 group-hover:from-emerald-500/20 group-hover:to-emerald-600/20 transition-all duration-300" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <IconWrapper size="lg" className="bg-gradient-to-br from-emerald-500 to-emerald-600 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 3v2H6v2h2v2h2V7h2V5h-2V3H8zm8 4h-2v2h2V7zm-2 4h-2v2h2v-2zm-4 0H8v2h2v-2zm0 4H8v2h2v-2zm4 0h-2v2h2v-2z"/>
                    </svg>
                  </IconWrapper>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      Evernote
                      <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">Coming Soon</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Sync your notes and memories from Evernote
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Button disabled className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 rounded-xl">
                Connect
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border shadow-2xl rounded-3xl relative overflow-hidden group hover:shadow-orange-500/20 transition-all duration-300 smooth-transition animate-in" style={{ animationDelay: '150ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/10 dark:from-orange-400/10 dark:to-orange-500/10 group-hover:from-orange-500/20 group-hover:to-orange-600/20 transition-all duration-300" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <IconWrapper size="lg" className="bg-gradient-to-br from-orange-500 to-orange-600 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 3H3v18h18V3zm-2 16H5V5h14v14zm-3-7l-3 3.72L11 13l-3 4h12l-4-5z"/>
                    </svg>
                  </IconWrapper>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      Apple Photos
                      <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300">Coming Soon</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Import photos and videos from your Apple library
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Button disabled className="w-full h-11 bg-orange-500 hover:bg-orange-600 rounded-xl">
                Connect
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border shadow-2xl rounded-3xl animate-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <IconWrapper size="md" variant="primary">
                <Sparkles className="w-5 h-5 text-white" />
              </IconWrapper>
              <GradientText>More Integrations Coming Soon</GradientText>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              We're working on adding more integrations to help you consolidate all
              your memories in one place. Stay tuned for updates!
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
