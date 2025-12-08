'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AddMemoryModal } from '@/components/AddMemoryModal';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { MemoryCard } from '@/components/MemoryCard';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { GradientText } from '@/components/ui/gradient-text';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { ArrowLeft, Loader2, Plus, RefreshCw } from 'lucide-react';
import { supabase, Memory } from '@/lib/supabase/client';
import { toast } from 'sonner';

const CACHE_KEY = 'memories_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

type CachedData = {
  memories: Memory[];
  timestamp: number;
  userId: string;
};

export default function MemoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>([]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  // Load from cache first, then fetch if needed
  const loadMemories = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    // Try to load from cache first
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const cachedData: CachedData = JSON.parse(cached);
          const now = Date.now();
          
          // Use cache if it's for the same user and not expired
          if (
            cachedData.userId === user.id &&
            now - cachedData.timestamp < CACHE_DURATION
          ) {
            setMemories(cachedData.memories);
            
            // Extract categories from cached data
            const categorySet = new Set(
              cachedData.memories
                .map((m: any) => m.category)
                .filter(Boolean)
            );
            const uniqueCategories = ['All', ...Array.from(categorySet)].sort();
            setCategories(uniqueCategories as string[]);
            
            setLoading(false);
            return; // Use cached data, skip API call
          }
        }
      } catch (error) {
        console.error('Cache read error:', error);
      }
    }

    // Fetch from database if no valid cache
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const memoriesData = data || [];
      setMemories(memoriesData);

      // Extract unique categories
      const categorySet = new Set(
        memoriesData
          .map((m: any) => m.category)
          .filter(Boolean)
      );
      const uniqueCategories = ['All', ...Array.from(categorySet)].sort();
      setCategories(uniqueCategories as string[]);

      // Save to cache
      try {
        const cacheData: CachedData = {
          memories: memoriesData,
          timestamp: Date.now(),
          userId: user.id,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (error) {
        console.error('Cache write error:', error);
      }
    } catch (error: any) {
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMemories(true);
    toast.success('Memories refreshed');
  };

  const handleMemoryAdded = () => {
    // Invalidate cache when new memory is added
    localStorage.removeItem(CACHE_KEY);
    loadMemories(true);
  };

  const handleMemoryDeleted = () => {
    // Invalidate cache when memory is deleted
    localStorage.removeItem(CACHE_KEY);
    loadMemories(true);
  };

  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadMemories();
    }
  }, [user, loadMemories]);

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
      <Navbar onAddMemory={() => setShowAddModal(true)} onOpenGraph={() => setShowGraph(true)} />

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl relative">
        <div className="mb-6 sm:mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-start justify-between animate-slide-up gap-4">
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-3 sm:mb-4 gap-2 hover:bg-muted rounded-lg sm:rounded-xl smooth-transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Button>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-3">
              <GradientText>All Memories</GradientText>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'} saved
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="hover:bg-muted rounded-lg sm:rounded-xl smooth-transition border hover-lift h-9 sm:h-10 px-3 sm:px-4"
            title="Refresh memories"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="ml-2 text-xs sm:text-sm">Refresh</span>
          </Button>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-5 sm:mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground mr-1 sm:mr-2">
                  📁 Filter:
                </span>
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-lg sm:rounded-xl smooth-transition h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm"
                  >
                    {category}
                    {category !== 'All' && (
                      <span className="ml-2 text-xs opacity-70">
                        ({memories.filter((m: any) => m.category === category).length})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12 sm:py-16 md:py-24 animate-fade-in px-4">
              <IconWrapper size="lg" variant="primary" className="mx-auto mb-4 sm:mb-6 animate-pulse sm:w-16 sm:h-16">
                <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </IconWrapper>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
                <GradientText>No memories yet</GradientText>
              </h3>
              <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base md:text-lg max-w-md mx-auto">
                Start building your memory vault by adding your first memory
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                size="lg"
                className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add Your First Memory
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {memories
                .filter((memory: any) => 
                  selectedCategory === 'All' || memory.category === selectedCategory
                )
                .map((memory, index) => (
                <div key={memory.id} className="animate-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <MemoryCard memory={memory} onDelete={handleMemoryDeleted} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AddMemoryModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        userId={user.id}
        onMemoryAdded={handleMemoryAdded}
      />

      <KnowledgeGraph
        open={showGraph}
        onOpenChange={setShowGraph}
        userId={user.id}
      />
    </div>
  );
}
