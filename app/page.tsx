'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AddMemoryModal } from '@/components/AddMemoryModal';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { MemoryCard } from '@/components/MemoryCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { GradientText } from '@/components/ui/gradient-text';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Search, Sparkles, Loader2, Plus, MessageCircle, Zap } from 'lucide-react';
import { supabase, Memory } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'instant' | 'chat'>('instant');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/landing');
    }
  }, [user, authLoading, router]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    // If in chat mode, navigate to chat page
    if (searchMode === 'chat') {
      router.push(`/chat?message=${encodeURIComponent(searchQuery)}`);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, userId: user.id }),
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setMemories(data.memories || []);
      setAiAnswer(data.aiAnswer || null);

      if (data.memories && data.memories.length === 0) {
        toast.info('No memories found matching your search');
      } else if (data.memories && data.memories.length > 0) {
        toast.success(`Found ${data.memories.length} ${data.memories.length === 1 ? 'memory' : 'memories'}`);
      }
    } catch (error) {
      toast.error('Failed to search memories');
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setAiAnswer(null);
    setMemories([]);
  };

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
      <Navbar onAddMemory={() => setShowAddModal(true)} onOpenGraph={() => setShowGraph(true)} />

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl relative">
        <div className={`${(aiAnswer || memories.length > 0) ? '' : 'min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center'}`}>
          <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 animate-slide-up">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 tracking-tight">
                Welcome back,{' '}
                <GradientText>
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </GradientText>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                {searchMode === 'instant' ? 'Search through your memories with natural language' : 'Chat with your memories using AI conversation'}
              </p>
              
              {/* Mode Toggle */}
              <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
                <Button
                  variant={searchMode === 'instant' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchMode('instant')}
                  className="gap-2 rounded-full transition-all duration-300"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Instant Search
                </Button>
                <Button
                  variant={searchMode === 'chat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchMode('chat')}
                  className="gap-2 rounded-full transition-all duration-300"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat Mode
                </Button>
              </div>
            </div>

              <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl sm:rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative glass-card rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-2xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="pl-3 sm:pl-4">
                    {searchMode === 'instant' ? (
                      <Search className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <Input
                    type="text"
                    placeholder={searchMode === 'instant' ? 'Search your memories...' : 'Chat with memories...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="border-0 bg-transparent h-12 sm:h-14 text-sm sm:text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                  />
                  <div className="flex items-center gap-1.5 sm:gap-2 pr-1.5 sm:pr-2">
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSearch}
                        className="hover:bg-muted rounded-lg text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Clear
                      </Button>
                    )}
                    <Button
                      onClick={handleSearch}
                      disabled={searching || !searchQuery.trim()}
                      size="default"
                      className="gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg rounded-xl px-4 sm:px-6 h-10 sm:h-12 text-sm sm:text-base"
                    >
                      {searching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Searching
                        </>
                      ) : searchMode === 'chat' ? (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(aiAnswer || memories.length > 0) && (
            <div className="w-full mt-8 sm:mt-12 md:mt-16 space-y-6 sm:space-y-8 animate-fade-in">
              {aiAnswer && (
                <div className="max-w-5xl mx-auto glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl card-hover border-2">
                  <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    <IconWrapper size="md" variant="primary" className="flex-shrink-0 sm:w-12 sm:h-12">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                    </IconWrapper>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                        <GradientText>AI Answer</GradientText>
                      </h3>
                      <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
                        {aiAnswer}
                      </p>
                      <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Generated from your memories using GPT-4o-mini
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {memories.length > 0 && (
                <div className="w-full">
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                      <GradientText>Related Memories</GradientText>
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Found {memories.length} {memories.length === 1 ? 'memory' : 'memories'} matching your search
                    </p>
                  </div>
                  <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {memories.map((memory, index) => (
                      <div 
                        key={memory.id} 
                        className="animate-in" 
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        <MemoryCard memory={memory} onDelete={() => {}} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <AddMemoryModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        userId={user.id}
        onMemoryAdded={() => {
          setShowAddModal(false);
          toast.success('Memory added! Go to Memories page to view all.');
        }}
      />

      <KnowledgeGraph
        open={showGraph}
        onOpenChange={setShowGraph}
        userId={user.id}
      />
    </div>
  );
}
