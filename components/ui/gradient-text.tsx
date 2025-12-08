'use client';

import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}

export function GradientText({ 
  children, 
  className,
  from = 'from-blue-600',
  via = 'via-indigo-600', 
  to = 'to-purple-600'
}: GradientTextProps) {
  return (
    <span className={cn(
      `bg-gradient-to-r ${from} ${via} ${to} bg-clip-text text-transparent`,
      className
    )}>
      {children}
    </span>
  );
}
