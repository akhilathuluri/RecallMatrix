'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AddMemoryModal } from '@/components/AddMemoryModal';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { GradientText } from '@/components/ui/gradient-text';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Plus, 
  Trash2, 
  Sparkles,
  ArrowLeft,
  Brain,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure marked for better code block rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Sanitize and render markdown
function sanitizeAndRenderMarkdown(content: string): string {
  // Convert markdown to HTML
  const rawHtml = marked.parse(content) as string;
  
  // Sanitize HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
  
  return cleanHtml;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  memory_ids?: string[];
}

interface Memory {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

function ChatContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMessage = searchParams?.get('message');
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [memoryDetails, setMemoryDetails] = useState<Map<string, Memory>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const pendingMessageRef = useRef<string | null>(initialMessage);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  // Load sessions
  const loadSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions');
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // Load messages for a session
  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Initialize
  useEffect(() => {
    if (user && !hasInitialized.current) {
      hasInitialized.current = true;
      loadSessions().then(() => setLoading(false));
      
      // Send initial message if provided
      if (pendingMessageRef.current) {
        setInputMessage(pendingMessageRef.current);
        // Clear URL parameters for security
        window.history.replaceState({}, '', '/chat');
        setTimeout(() => {
          handleSendMessage();
          pendingMessageRef.current = null;
        }, 500);
      }
    }
  }, [user]);

  // Fetch memory details
  const fetchMemoryDetails = async (memoryIds: string[]) => {
    // Filter out IDs we already have
    const missingIds = memoryIds.filter(id => !memoryDetails.has(id));
    if (missingIds.length === 0) return;
    
    try {
      const response = await fetch('/api/memories');
      if (!response.ok) return;
      
      const data = await response.json();
      const newDetails = new Map(memoryDetails);
      
      data.memories?.forEach((memory: Memory) => {
        if (memoryIds.includes(memory.id)) {
          newDetails.set(memory.id, memory);
        }
      });
      
      setMemoryDetails(newDetails);
    } catch (error) {
      console.error('Failed to fetch memory details:', error);
    }
  };

  // Toggle source expansion
  const toggleSources = async (messageId: string, memoryIds?: string[]) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
      if (memoryIds && memoryIds.length > 0) {
        await fetchMemoryDetails(memoryIds);
      }
    }
    setExpandedSources(newExpanded);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Optimistic update - show user message immediately
    const optimisticUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      // Update or set current session
      if (!currentSessionId) {
        setCurrentSessionId(data.sessionId);
        await loadSessions();
      }

      // Reload messages to get real IDs and assistant response
      await loadMessages(data.sessionId);
      
    } catch (error) {
      toast.error('Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
      setInputMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Create new chat
  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSessionId(data.session.id);
        setMessages([]);
        await loadSessions();
        toast.success('New chat created');
      }
    } catch (error) {
      toast.error('Failed to create new chat');
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions?id=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
        await loadSessions();
        toast.success('Chat deleted');
      }
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  // Select session
  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <AnimatedBackground />
      <Navbar onAddMemory={() => setShowAddModal(true)} onOpenGraph={() => setShowGraph(true)} />

      <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-6 max-w-7xl relative flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6">
        {/* Sidebar - Sessions (hidden on mobile unless toggled) */}
        <div className="w-full lg:w-72 lg:flex-shrink-0 order-2 lg:order-1">
          <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 h-auto lg:h-full">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Chats
              </h2>
              <Button
                size="sm"
                onClick={handleNewChat}
                className="gap-1 rounded-lg sm:rounded-xl h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="w-full justify-start mb-2 sm:mb-3 gap-2 rounded-lg sm:rounded-xl h-9 text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Button>

            <ScrollArea className="h-auto max-h-40 lg:h-[calc(100vh-16rem)]">
              {loading ? (
                <div className="text-center py-6 sm:py-8">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                  <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  No chats yet
                </div>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-center gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors cursor-pointer ${
                        currentSessionId === session.id
                          ? 'bg-accent'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col order-1 lg:order-2 min-h-[calc(100vh-10rem)] lg:min-h-0">
          <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 flex-1 flex flex-col">
            {/* Header */}
            <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
              <h1 className="text-xl sm:text-2xl font-bold">
                <GradientText>Memory Chat</GradientText>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Have a conversation about your memories with AI
              </p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 pr-4 -mr-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative glass-card rounded-full p-6">
                      <Brain className="w-12 h-12 text-blue-500" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    <GradientText>Start a conversation</GradientText>
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Ask me anything about your memories. I'll search through them and provide helpful answers.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 pb-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 animate-in ${
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <span className="text-white text-sm font-bold">U</span>
                        ) : (
                          <Sparkles className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${
                          message.role === 'user' ? 'text-right' : ''
                        }`}
                      >
                        <div
                          className={`inline-block p-4 rounded-2xl max-w-[80%] ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                              : 'bg-accent'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          ) : (
                            <div 
                              className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-pre:bg-black/50 prose-pre:p-3 prose-pre:rounded-lg prose-code:text-pink-400"
                              dangerouslySetInnerHTML={{ __html: sanitizeAndRenderMarkdown(message.content) }}
                            />
                          )}
                        </div>
                        
                        {/* Memory Sources */}
                        {message.role === 'assistant' && message.memory_ids && message.memory_ids.length > 0 && (
                          <div className="mt-2 px-2">
                            <button
                              onClick={() => toggleSources(message.id, message.memory_ids)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              {message.memory_ids.length} {message.memory_ids.length === 1 ? 'source' : 'sources'}
                              {expandedSources.has(message.id) ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                            
                            {expandedSources.has(message.id) && (
                              <div className="mt-2 space-y-2 animate-in fade-in duration-200">
                                {message.memory_ids.map((memoryId) => {
                                  const memory = memoryDetails.get(memoryId);
                                  return (
                                    <div
                                      key={memoryId}
                                      className="p-3 rounded-lg bg-accent/50 border border-border text-xs"
                                    >
                                      {memory ? (
                                        <>
                                          <div className="flex items-start gap-2">
                                            <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-foreground mb-1">
                                                {memory.title}
                                              </div>
                                              <div className="text-muted-foreground line-clamp-3 text-xs">
                                                {memory.content}
                                              </div>
                                              <div className="text-muted-foreground/70 mt-1.5 text-[10px]">
                                                {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                          <span className="text-muted-foreground text-xs">Loading memory details...</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1 px-2">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="inline-block p-4 rounded-2xl bg-accent">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
              <div className="flex items-end gap-1.5 sm:gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="flex-1 resize-none rounded-lg sm:rounded-xl h-10 sm:h-11 text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !inputMessage.trim()}
                  size="default"
                  className="gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-lg sm:rounded-xl h-10 sm:h-11 px-3 sm:px-4"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline text-sm">Send</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AddMemoryModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        userId={user.id}
        onMemoryAdded={() => setShowAddModal(false)}
      />

      <KnowledgeGraph
        open={showGraph}
        onOpenChange={setShowGraph}
        userId={user.id}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
