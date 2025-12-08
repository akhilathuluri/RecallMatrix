'use client';

/**
 * Agent System Page
 * 
 * Dedicated page to interact with and monitor the multi-agent system
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AgentDashboard } from '@/components/AgentDashboard';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { GradientText } from '@/components/ui/gradient-text';
import { Loader2 } from 'lucide-react';

export default function AgentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navbar onAddMemory={() => {}} onOpenGraph={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-7xl relative">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <GradientText>AI Agent System</GradientText>
          </h1>
          <p className="text-muted-foreground text-lg">
            Watch autonomous agents organize, analyze, and provide insights about your memories
          </p>
        </div>

        <AgentDashboard userId={user.id} />
      </main>
    </div>
  );
}
