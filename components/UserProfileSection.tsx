/**
 * User Profile Component Module
 * 
 * Manages user profile information including bio with AI embeddings.
 * This component allows users to provide context about themselves
 * for better AI understanding and personalized responses.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Loader2, Save, User, Sparkles, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase, Profile } from '@/lib/supabase/client';
import { toast } from 'sonner';

type UserProfileProps = {
  profile: Profile;
  onUpdate: () => void;
};

export function UserProfileSection({ profile, onUpdate }: UserProfileProps) {
  const [bio, setBio] = useState(profile.bio || '');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleBioChange = (value: string) => {
    setBio(value);
    setHasChanges(value !== (profile.bio || ''));
  };

  const handleSave = async () => {
    if (!profile.id) return;

    setSaving(true);
    try {
      let bioEmbedding = null;

      // Generate embedding if bio is not empty
      if (bio.trim().length > 0) {
        const embeddingResponse = await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: bio }),
        });

        if (!embeddingResponse.ok) {
          throw new Error('Failed to generate embedding');
        }

        const { embedding } = await embeddingResponse.json();
        bioEmbedding = embedding;
        
        toast.success('Profile context processed successfully');
      }

      // Update profile with bio and embedding
      const { error } = await supabase
        .from('profiles')
        .update({ 
          bio: bio.trim(),
          bio_embedding: bioEmbedding 
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setHasChanges(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass-card border card-hover rounded-3xl animate-in">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <IconWrapper size="md" variant="primary">
            <User className="w-5 h-5 text-white" />
          </IconWrapper>
          About You
        </CardTitle>
        <CardDescription className="text-base">
          Tell the AI about yourself for more personalized responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
            This information helps the AI understand your context when answering questions about you.
            Your profile is private and only visible to you.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-semibold">
            Profile Context
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => handleBioChange(e.target.value)}
            placeholder="Example: I'm a software engineer who loves building AI applications. I work with React, TypeScript, and Python. I'm interested in machine learning and natural language processing..."
            className="min-h-[200px] border rounded-xl focus:ring-2 focus:ring-primary/20 resize-none"
            maxLength={2000}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {bio.length} / 2000 characters
            </span>
            {hasChanges && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse"></span>
                Unsaved changes
              </span>
            )}
          </div>
        </div>

        {profile.bio && profile.bio.length > 0 && (
          <Alert className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
            <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-sm text-green-900 dark:text-green-100">
              AI has your profile context and can answer questions about you
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 h-11 rounded-xl flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile Context
              </>
            )}
          </Button>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Tips for better results:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Include your profession, interests, and expertise areas</li>
            <li>Mention your current projects or goals</li>
            <li>Add relevant personal context (location, preferences, etc.)</li>
            <li>Update this regularly as your situation changes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
