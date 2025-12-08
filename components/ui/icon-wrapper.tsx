'use client';

import { cn } from '@/lib/utils';

interface IconWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
}

const variantClasses = {
  default: 'bg-gradient-to-br from-slate-500 to-slate-700',
  primary: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500',
  success: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  warning: 'bg-gradient-to-br from-amber-500 to-orange-500',
  danger: 'bg-gradient-to-br from-red-500 to-rose-500',
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function IconWrapper({ 
  children, 
  className,
  variant = 'primary',
  size = 'md',
  style
}: IconWrapperProps) {
  return (
    <div 
      className={cn(
        'rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
