'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { UserProfileSection } from '@/components/UserProfileSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { GradientText } from '@/components/ui/gradient-text';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { ArrowLeft, Loader2, Save, User, Upload, Sparkles } from 'lucide-react';
import { supabase, Profile } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFullName(data.full_name || '');
    } catch (error: any) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
      loadProfile();
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const storagePercentage = profile
    ? (profile.storage_used / (100 * 1024 * 1024)) * 100
    : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (authLoading || loading || !user) {
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

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-4xl relative">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 sm:mb-8 gap-2 hover:bg-muted rounded-lg sm:rounded-xl smooth-transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <h1 className="text-5xl md:text-6xl font-bold mb-12 animate-slide-up">
          <GradientText>Settings</GradientText>
        </h1>

        <div className="space-y-8">
          {profile && <UserProfileSection profile={profile} onUpdate={loadProfile} />}

          <Card className="glass-card border card-hover rounded-3xl animate-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <IconWrapper size="md" variant="primary">
                  <User className="w-5 h-5 text-white" />
                </IconWrapper>
                Account Information
              </CardTitle>
              <CardDescription className="text-base">
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted/50 border rounded-xl h-12"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="border rounded-xl h-12 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 h-11 rounded-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border card-hover rounded-3xl animate-in" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <IconWrapper size="md" variant="primary">
                  <Upload className="w-5 h-5 text-white" />
                </IconWrapper>
                Storage Usage
              </CardTitle>
              <CardDescription className="text-base">
                Monitor your file storage consumption
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatBytes(profile?.storage_used || 0)} of 100 MB used
                  </span>
                  <span className="text-2xl font-bold">
                    <GradientText from="from-purple-600" via="via-violet-600" to="to-fuchsia-600">
                      {storagePercentage.toFixed(1)}%
                    </GradientText>
                  </span>
                </div>
                <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-500 rounded-full"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Maximum 10MB per file, 100MB total storage limit
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border card-hover rounded-3xl animate-in" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <IconWrapper size="md" variant="primary">
                  <Sparkles className="w-5 h-5 text-white" />
                </IconWrapper>
                Account Statistics
              </CardTitle>
              <CardDescription className="text-base">
                Overview of your memory collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border hover-lift smooth-transition">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Account Created
                  </p>
                  <p className="text-2xl font-bold">
                    <GradientText from="from-blue-600" via="via-indigo-600" to="to-purple-600">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : '-'}
                    </GradientText>
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border hover-lift smooth-transition">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Last Updated
                  </p>
                  <p className="text-2xl font-bold">
                    <GradientText from="from-indigo-600" via="via-purple-600" to="to-fuchsia-600">
                      {profile?.updated_at
                        ? new Date(profile.updated_at).toLocaleDateString()
                        : '-'}
                    </GradientText>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
