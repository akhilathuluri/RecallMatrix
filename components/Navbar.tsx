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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Brain, Plus, Puzzle, User, Settings, Moon, Sun, LogOut, BookMarked, Network, Bot, Menu } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer hover-lift" onClick={() => router.push('/')}>
          <IconWrapper size="sm" variant="primary" className="group-hover:scale-110 smooth-transition sm:w-10 sm:h-10">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </IconWrapper>
          <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ReacallMatrix
          </span>
        </div>

        {/* Mobile Menu - Hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <NotificationBell />
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Button
                  onClick={() => {
                    onAddMemory();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-3 h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700"
                >
                  <Plus className="w-5 h-5" />
                  Add Memory
                </Button>
                
                <Button
                  onClick={() => {
                    router.push('/memories');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                >
                  <BookMarked className="w-5 h-5" />
                  All Memories
                </Button>
                
                <Button
                  onClick={() => {
                    router.push('/agents');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                >
                  <Bot className="w-5 h-5" />
                  AI Agents
                </Button>
                
                <Button
                  onClick={() => {
                    router.push('/integrations');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                >
                  <Puzzle className="w-5 h-5" />
                  Integrations
                </Button>
                
                <Button
                  onClick={() => {
                    onOpenGraph?.();
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                >
                  <Network className="w-5 h-5" />
                  Knowledge Graph
                </Button>
                
                <div className="border-t pt-4 mt-2">
                  <Button
                    onClick={() => {
                      router.push('/settings');
                      setMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </Button>
                  
                  <Button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    variant="outline"
                    className="w-full justify-start gap-3 h-12 mt-2"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-5 h-5" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="w-5 h-5" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-start gap-3 h-12 mt-2 text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                    disabled={loading}
                  >
                    <LogOut className="w-5 h-5" />
                    {loading ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Menu - All Icons */}
        <div className="hidden lg:flex items-center gap-2">
          <Button
            onClick={onAddMemory}
            size="default"
            className="gap-2 font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-10 px-4"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </Button>

          <Button
            onClick={() => router.push('/memories')}
            variant="outline"
            size="icon"
            className="hover:bg-muted rounded-xl smooth-transition border hover-lift h-10 w-10"
            title="View All Memories"
          >
            <BookMarked className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => router.push('/agents')}
            variant="outline"
            size="icon"
            className="hover:bg-muted rounded-xl smooth-transition border hover-lift h-10 w-10"
            title="AI Agents"
          >
            <Bot className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => router.push('/integrations')}
            variant="outline"
            size="icon"
            className="hover:bg-muted rounded-xl smooth-transition border hover-lift h-10 w-10"
            title="Integrations"
          >
            <Puzzle className="w-4 h-4" />
          </Button>

          <Button
            onClick={onOpenGraph}
            variant="outline"
            size="icon"
            className="hover:bg-muted rounded-xl smooth-transition border hover-lift h-10 w-10"
            title="Knowledge Graph"
          >
            <Network className="w-4 h-4" />
          </Button>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-lg sm:rounded-xl hover:bg-muted smooth-transition border hover-lift h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56 glass rounded-xl border shadow-xl">
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
