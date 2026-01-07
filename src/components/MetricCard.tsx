import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subValue?: string;
  variant?: 'default' | 'revenue' | 'partial' | 'primary';
}

export function MetricCard({ 
  label, 
  value, 
  icon, 
  subValue, 
  variant = 'default' 
}: MetricCardProps) {
  const valueColorClass = {
    default: 'text-foreground',
    revenue: 'text-revenue',
    partial: 'text-partial',
    primary: 'text-primary',
  }[variant];

  return (
    <div className="metric-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="metric-label">{label}</p>
          <p className={`metric-value ${valueColorClass}`}>
            {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
          </p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-muted">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
