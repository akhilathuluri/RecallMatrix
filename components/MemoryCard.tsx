'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { GradientText } from '@/components/ui/gradient-text';
import { FileText, Image as ImageIcon, Trash2, Download, Eye } from 'lucide-react';
import { supabase, Memory, MemoryFile } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type MemoryCardProps = {
  memory: Memory;
  onDelete: () => void;
};

export function MemoryCard({ memory, onDelete }: MemoryCardProps) {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const loadFiles = async () => {
    if (memory.type === 'file' && files.length === 0) {
      const { data, error } = await supabase
        .from('memory_files')
        .select('*')
        .eq('memory_id', memory.id);

      if (!error && data) {
        setFiles(data);
      }
    }
  };

  const handleCardClick = async () => {
    if (memory.type === 'file') {
      await loadFiles();
    }
    setShowDetails(true);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (memory.type === 'file') {
        const { data: fileRecords } = await supabase
          .from('memory_files')
          .select('file_path, file_size')
          .eq('memory_id', memory.id);

        if (fileRecords) {
          for (const file of fileRecords) {
            await supabase.storage.from('memory-files').remove([file.file_path]);
          }

          const totalSize = fileRecords.reduce(
            (sum: number, file: any) => sum + file.file_size,
            0
          );
          const { data: profile } = await supabase
            .from('profiles')
            .select('storage_used')
            .eq('id', memory.user_id)
            .single();

          if (profile) {
            await supabase
              .from('profiles')
              .update({ storage_used: Math.max(0, profile.storage_used - totalSize) })
              .eq('id', memory.user_id);
          }
        }
      }

      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memory.id);

      if (error) throw error;

      toast.success('Memory deleted successfully');
      onDelete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete memory');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (file: MemoryFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('memory-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  return (
    <>
      <Card className="memory-card-container glass-card card-hover group border rounded-3xl overflow-hidden flex flex-col cursor-pointer smooth-transition hover:border-primary/30" onClick={handleCardClick}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <IconWrapper 
                size="lg" 
                variant="primary" 
                className="group-hover:scale-110 transition-transform duration-500 flex-shrink-0"
              >
                {memory.type === 'text' ? (
                  <FileText className="w-6 h-6 text-white" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-white" />
                )}
              </IconWrapper>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                  {memory.title}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs font-medium">
                    #{memory.index_position}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(memory.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
            <AlertDialog>
            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl hover-lift"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Memory?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  memory and all associated files.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col justify-center">
        {memory.type === 'text' && memory.content && (
          <div className="relative h-full flex items-center">
            <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
              {memory.content}
            </p>
          </div>
        )}
        {memory.type === 'file' && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span>Click to view files</span>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Detail Dialog */}
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogContent className="sm:max-w-[700px] glass-card border shadow-2xl rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <IconWrapper size="xl" variant="primary" className="flex-shrink-0">
              {memory.type === 'text' ? (
                <FileText className="w-7 h-7 text-white" />
              ) : (
                <ImageIcon className="w-7 h-7 text-white" />
              )}
            </IconWrapper>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold mb-2">
                <GradientText>{memory.title}</GradientText>
              </DialogTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  #{memory.index_position}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                </span>
                <Badge variant="outline" className="text-xs">
                  {memory.type === 'text' ? 'Text Memory' : 'File Memory'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {memory.type === 'text' && memory.content && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Content</h3>
              <div className="p-5 rounded-2xl bg-muted/50 border">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {memory.content}
                </p>
              </div>
            </div>
          )}

          {memory.type === 'file' && files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Files ({files.length})</h3>
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border hover:bg-muted transition-colors smooth-transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(file.file_size / 1024 / 1024).toFixed(2)} MB • {file.file_type}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      className="ml-3 hover:bg-muted rounded-xl gap-2 hover-lift"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Created</p>
                <p className="font-medium">
                  {new Date(memory.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Last Updated</p>
                <p className="font-medium">
                  {new Date(memory.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
