'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { analyzeImage, isImageFile } from '@/lib/services/imageAnalysisService';

type AddMemoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onMemoryAdded: () => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_STORAGE = 100 * 1024 * 1024;

export function AddMemoryModal({
  open,
  onOpenChange,
  userId,
  onMemoryAdded,
}: AddMemoryModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [loading, setLoading] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalyzed, setImageAnalyzed] = useState(false);

  const generateEmbedding = async (text: string): Promise<number[]> => {
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error('Failed to generate embedding');
    const data = await response.json();
    return data.embedding;
  };

  const getNextIndexPosition = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('memories')
      .select('index_position')
      .eq('user_id', userId)
      .order('index_position', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0].index_position + 1 : 1;
  };

  const handleTextSubmit = async () => {
    if (!textTitle.trim() || !textContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const embedding = await generateEmbedding(
        `${textTitle} ${textContent}`
      );
      const indexPosition = await getNextIndexPosition();

      const { data, error } = await supabase.from('memories').insert({
        user_id: userId,
        title: textTitle,
        content: textContent,
        type: 'text',
        embedding,
        index_position: indexPosition,
      }).select().single();

      if (error) throw error;
      
      // Auto-categorize the memory
      if (data) {
        try {
          await fetch('/api/auto-categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memoryId: data.id,
              title: textTitle,
              content: textContent,
            }),
          });
        } catch (catError) {
          console.error('Auto-categorization failed:', catError);
          // Don't fail the whole operation if categorization fails
        }
      }
      
      toast.success('Memory saved successfully!');
      setTextTitle('');
      setTextContent('');
      onMemoryAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save memory');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    setFiles(selectedFiles);
    setImageAnalyzed(false);

    // Auto-analyze first image if it's an image file
    if (selectedFiles && selectedFiles.length > 0) {
      const firstFile = selectedFiles[0];
      
      if (isImageFile(firstFile)) {
        setAnalyzingImage(true);
        toast.info('Analyzing image...', { icon: '🔍' });
        
        try {
          const analysis = await analyzeImage(firstFile);
          
          // Auto-fill the form with AI-generated content
          setFileTitle(analysis.title);
          setFileContent(analysis.content);
          setImageAnalyzed(true);
          
          toast.success('Image analyzed successfully!', { 
            icon: '✨',
            description: 'Title and description have been auto-filled'
          });
        } catch (error) {
          console.error('Image analysis failed:', error);
          // Fallback to filename-based title
          const fallbackTitle = firstFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setFileTitle(fallbackTitle);
          toast.warning('Using filename as title', {
            description: 'You can edit it before saving'
          });
        } finally {
          setAnalyzingImage(false);
        }
      } else {
        // For non-image files, use filename as title
        const fallbackTitle = firstFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setFileTitle(fallbackTitle);
      }
    }
  };

  const handleFileSubmit = async () => {
    if (!fileTitle.trim() || !files || files.length === 0) {
      toast.error('Please provide a title and select files');
      return;
    }

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('storage_used')
        .eq('id', userId)
        .single();

      let totalSize = 0;
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size;
        if (files[i].size > MAX_FILE_SIZE) {
          throw new Error(`File ${files[i].name} exceeds 10MB limit`);
        }
      }

      if ((profile?.storage_used || 0) + totalSize > MAX_TOTAL_STORAGE) {
        throw new Error('Total storage limit (100MB) exceeded');
      }

      // Use both title and content for better embeddings
      const embeddingText = fileContent.trim() 
        ? `${fileTitle} ${fileContent}` 
        : fileTitle;
      const embedding = await generateEmbedding(embeddingText);
      const indexPosition = await getNextIndexPosition();

      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          user_id: userId,
          title: fileTitle,
          content: fileContent,
          type: 'file',
          embedding,
          index_position: indexPosition,
        })
        .select()
        .single();

      if (memoryError) throw memoryError;

      // Auto-categorize the file memory
      if (memory) {
        try {
          await fetch('/api/auto-categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memoryId: memory.id,
              title: fileTitle,
              content: fileContent,
            }),
          });
        } catch (catError) {
          console.error('Auto-categorization failed:', catError);
        }
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${memory.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('memory-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: fileRecordError } = await supabase
          .from('memory_files')
          .insert({
            memory_id: memory.id,
            file_name: file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
          });

        if (fileRecordError) throw fileRecordError;
      }

      await supabase
        .from('profiles')
        .update({ storage_used: (profile?.storage_used || 0) + totalSize })
        .eq('id', userId);

      toast.success('Files uploaded successfully!');
      setFileTitle('');
      setFileContent('');
      setFiles(null);
      setImageAnalyzed(false);
      onMemoryAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-card border shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Add New Memory
            </span>
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'file')}>
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="text" 
              className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <FileText className="w-4 h-4" />
              Text Memory
            </TabsTrigger>
            <TabsTrigger 
              value="file" 
              className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Upload className="w-4 h-4" />
              File Memory
            </TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label htmlFor="text-title" className="text-sm font-semibold">Title</Label>
              <Input
                id="text-title"
                placeholder="What is this memory about?"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                className="h-12 border rounded-xl focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-content" className="text-sm font-semibold">Content</Label>
              <Textarea
                id="text-content"
                placeholder="Describe your memory in detail..."
                rows={7}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="border rounded-xl focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <Button
              onClick={handleTextSubmit}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Memory'
              )}
            </Button>
          </TabsContent>
          <TabsContent value="file" className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-sm font-semibold flex items-center gap-2">
                Files (Images/Videos)
                {analyzingImage && <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />}
              </Label>
              <div className="relative">
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={analyzingImage}
                  className="h-32 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors cursor-pointer rounded-2xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-indigo-500 file:text-white hover:file:from-blue-600 hover:file:to-indigo-600 file:transition-all file:duration-300 file:shadow-md hover:file:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              {analyzingImage && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Analyzing image with AI...
                  </p>
                </div>
              )}
              {files && files.length > 0 && !analyzingImage && (
                <div className="p-3 rounded-xl bg-muted/50 border">
                  <p className="text-sm font-medium">
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                    {imageAnalyzed && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        ✨ AI analyzed
                      </span>
                    )}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                Max 10MB per file, 100MB total storage. Images are auto-analyzed by AI.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-title" className="text-sm font-semibold">Title</Label>
              <Input
                id="file-title"
                placeholder="What are these files about?"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                className="h-12 border rounded-xl focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-content" className="text-sm font-semibold">Description (Optional)</Label>
              <Textarea
                id="file-content"
                placeholder="Additional details about this file..."
                rows={4}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="border rounded-xl focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                For images, this is auto-generated by AI. You can edit it if needed.
              </p>
            </div>
            <Button
              onClick={handleFileSubmit}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Files'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
