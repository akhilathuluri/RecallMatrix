'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Brain, ArrowLeft } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative">
      <AnimatedBackground />
      
      {/* Back to Landing Link */}
      <Link 
        href="/landing"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 text-xs sm:text-sm font-medium hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Back to Home</span>
        <span className="sm:hidden">Back</span>
      </Link>

      <div className="w-full max-w-md relative">
        <Card className="glass-card shadow-2xl border rounded-2xl sm:rounded-3xl animate-slide-up">
          <CardHeader className="space-y-3 sm:space-y-4 text-center pb-6 sm:pb-8 px-4 sm:px-6">
            <IconWrapper size="lg" variant="primary" className="mx-auto sm:w-16 sm:h-16">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </IconWrapper>
            <div>
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                Sign in to access your memories
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border rounded-xl focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border rounded-xl focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-primary hover:underline transition-colors"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
