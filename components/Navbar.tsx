'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Brain, Plus, Puzzle, User, Settings, Moon, Sun, LogOut, BookMarked, Network, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import NotificationBell from '@/components/NotificationBell';

type NavbarProps = {
  onAddMemory: () => void;
  onOpenGraph?: () => void;
};

export function Navbar({ onAddMemory, onOpenGraph }: NavbarProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b backdrop-blur-2xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer hover-lift" onClick={() => router.push('/')}>
          <IconWrapper size="md" variant="primary" className="group-hover:scale-110 smooth-transition">
            <Brain className="w-5 h-5 text-white" />
          </IconWrapper>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ReacallMatrix
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onAddMemory}
            size="default"
            className="gap-2 font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Memory</span>
          </Button>

          <Button
            onClick={() => router.push('/memories')}
            variant="outline"
            size="icon"
            className="hover:bg-muted rounded-xl smooth-transition border hover-lift"
            title="View All Memories"
          >
            <BookMarked className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => router.push('/agents')}
            variant="outline"
            size="icon"
            className="hover:bg-muted rounded-xl smooth-transition border hover-lift"
            title="AI Agents"
          >
            <Bot className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => router.push('/integrations')}
            variant="outline"
            size="icon"
            className="hover:bg-muted rounded-xl smooth-transition border hover-lift"
            title="Integrations"
          >
            <Puzzle className="w-4 h-4" />
          </Button>

          <Button
            onClick={onOpenGraph}
            variant="outline"
            size="icon"
            className="hover:bg-muted rounded-xl smooth-transition border hover-lift"
            title="Knowledge Graph"
          >
            <Network className="w-4 h-4" />
          </Button>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl hover:bg-muted smooth-transition border hover-lift">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass rounded-xl border shadow-xl">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer rounded-lg">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="cursor-pointer rounded-lg"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={loading}
                className="text-red-600 dark:text-red-400 cursor-pointer rounded-lg focus:text-red-600 dark:focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {loading ? 'Signing out...' : 'Sign Out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
