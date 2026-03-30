import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border border-border',
  primary: 'bg-gradient-to-br from-primary/10 to-background border border-primary/20',
  success: 'bg-gradient-to-br from-emerald-50 to-background border border-emerald-200',
  warning: 'bg-gradient-to-br from-amber-50 to-background border border-amber-200',
  danger: 'bg-gradient-to-br from-rose-50 to-background border border-rose-200'
};

const iconBgStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700'
};

const textStyles = {
  default: {
    title: 'text-muted-foreground',
    value: 'text-foreground',
    subtitle: 'text-muted-foreground'
  },
  primary: {
    title: 'text-muted-foreground',
    value: 'text-foreground',
    subtitle: 'text-muted-foreground'
  },
  success: {
    title: 'text-muted-foreground',
    value: 'text-foreground',
    subtitle: 'text-muted-foreground'
  },
  warning: {
    title: 'text-muted-foreground',
    value: 'text-foreground',
    subtitle: 'text-muted-foreground'
  },
  danger: {
    title: 'text-muted-foreground',
    value: 'text-foreground',
    subtitle: 'text-muted-foreground'
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className
}) => {
  return (
    <div
      className={cn(
        'rounded-xl p-6 shadow-card transition-all duration-300 hover:shadow-card-hover',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn('text-sm font-medium', textStyles[variant].title)}>
            {title}
          </p>
          <p className={cn('text-3xl font-bold font-display mt-2', textStyles[variant].value)}>
            {value}
          </p>
          {subtitle && (
            <p className={cn('text-sm mt-1', textStyles[variant].subtitle)}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className={textStyles[variant].subtitle}>vs mois dernier</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', iconBgStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};
