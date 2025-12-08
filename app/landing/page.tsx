'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { GradientText } from '@/components/ui/gradient-text';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import {
  Brain,
  Search,
  MessageCircle,
  Network,
  Sparkles,
  Zap,
  Shield,
  Smartphone,
  FileText,
  Image as ImageIcon,
  Bot,
  Bell,
  FolderKanban,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Memory Management',
      description: 'Store and retrieve your memories using advanced AI embeddings and semantic search technology.',
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Search,
      title: 'RAG-Based Search',
      description: 'Find memories using natural language queries. Our RAG system understands context and meaning.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: MessageCircle,
      title: 'Conversational AI Chat',
      description: 'Chat with your memories naturally. Get contextual answers with sources from your personal knowledge base.',
      gradient: 'from-teal-500 to-green-500',
    },
    {
      icon: Network,
      title: 'Knowledge Graph',
      description: 'Visualize connections between your memories with an interactive, force-directed graph.',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: Bot,
      title: 'Multi-Agent System',
      description: '5 specialized AI agents working together: Search, Organization, Insights, Reminders, and Orchestration.',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Smartphone,
      title: 'Telegram Integration',
      description: 'Manage memories from anywhere using our Telegram bot. Add, search, and view memories on the go.',
      gradient: 'from-orange-500 to-amber-500',
    },
  ];

  const highlights = [
    {
      icon: Sparkles,
      title: 'Auto-Categorization',
      description: 'AI automatically organizes memories into 10 categories',
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Context-based notifications and proactive insights',
    },
    {
      icon: FolderKanban,
      title: 'Memory Clustering',
      description: 'Related memories grouped together automatically',
    },
    {
      icon: Lightbulb,
      title: 'Pattern Discovery',
      description: 'AI finds temporal, behavioral, and categorical patterns',
    },
    {
      icon: FileText,
      title: 'Text & Files',
      description: 'Store text memories and upload images/videos',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Row-level security ensures your data stays yours',
    },
  ];

  const capabilities = [
    'Natural language semantic search',
    'Vector similarity matching',
    'Conversational AI interface',
    'Real-time notifications',
    'Tag generation & categorization',
    'Duplicate detection',
    'Relationship mapping',
    'Temporal pattern analysis',
    'Multi-platform access',
    'Dark/Light theme support',
  ];

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="relative z-10 border-b glass-card">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <IconWrapper size="sm" variant="primary" className="sm:w-10 sm:h-10">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </IconWrapper>
            <span className="text-lg sm:text-xl md:text-2xl font-bold">
              <GradientText>ReacallMatrix</GradientText>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/signin')}
              className="rounded-lg sm:rounded-xl h-9 sm:h-10 px-3 sm:px-4 text-sm"
            >
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Login</span>
            </Button>
            <Button
              onClick={() => router.push('/signup')}
              className="rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-90 h-9 sm:h-10 px-3 sm:px-4 text-sm"
            >
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        <Badge className="mb-4 sm:mb-6 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-xs sm:text-sm">
          <Sparkles className="w-3 h-3 mr-1.5 sm:mr-2 inline" />
          AI-Powered Memory Management
        </Badge>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 tracking-tight animate-slide-up px-2">
          Never Forget <br />
          <GradientText>Anything Again</GradientText>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto animate-slide-up px-4" style={{ animationDelay: '100ms' }}>
          Your personal AI-powered memory assistant. Store, search, and retrieve memories using natural language with advanced RAG technology.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-slide-up px-4" style={{ animationDelay: '200ms' }}>
          <Button
            size="lg"
            onClick={() => router.push('/signup')}
            className="rounded-lg sm:rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-90 shadow-lg w-full sm:w-auto"
          >
            Start Remembering
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-lg sm:rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg border-2 w-full sm:w-auto"
          >
            Explore Features
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2">
            <GradientText>Powerful Features</GradientText>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Built with cutting-edge AI technology to help you manage and retrieve your memories effortlessly
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="glass-card border-2 card-hover rounded-3xl animate-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <CardHeader>
                <div className="mb-4">
                  <IconWrapper 
                    size="lg" 
                    variant="primary"
                    style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                    className={`bg-gradient-to-br ${feature.gradient}`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </IconWrapper>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base pt-2">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Highlights Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Makes Us <GradientText>Unique</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI capabilities that go beyond simple storage
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {highlights.map((highlight, idx) => (
            <Card
              key={idx}
              className="glass-card border card-hover rounded-2xl p-6 animate-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <IconWrapper size="md" variant="primary">
                    <highlight.icon className="w-5 h-5 text-white" />
                  </IconWrapper>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{highlight.title}</h3>
                  <p className="text-muted-foreground">{highlight.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Capabilities List */}
        <Card className="glass-card border-2 rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">
            <GradientText>Complete Feature Set</GradientText>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {capabilities.map((capability, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-base">{capability}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Technology Stack Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="glass-card border-2 rounded-3xl p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Built with <GradientText>Modern Technology</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Next.js 16, React 18, TypeScript, Supabase with pgvector, GitHub Models API for embeddings, 
            and FastAPI for Telegram integration
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Next.js', 'React', 'TypeScript', 'Supabase', 'PostgreSQL', 'pgvector', 'GitHub Models', 'FastAPI', 'Telegram Bot'].map((tech) => (
              <Badge key={tech} variant="secondary" className="px-4 py-2 text-sm rounded-xl">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <Card className="glass-card border-2 rounded-3xl p-12 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join ReacallMatrix today and experience the future of personal memory management
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/signup')}
            className="rounded-xl px-10 py-6 text-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-90 shadow-lg"
          >
            Create Your Account
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t glass-card">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <IconWrapper size="sm" variant="primary">
              <Brain className="w-4 h-4 text-white" />
            </IconWrapper>
            <span className="text-xl font-bold">
              <GradientText>ReacallMatrix</GradientText>
            </span>
          </div>
          <p className="text-muted-foreground">
            AI-Powered Memory Management Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
