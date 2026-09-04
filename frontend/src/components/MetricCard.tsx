import React from 'react';

export type MetricAccent = 'neutral' | 'blue' | 'mint' | 'amber' | 'coral' | 'violet';

interface MetricCardProps {
  label: string;
  value: string | React.ReactNode;
  subValue?: string | React.ReactNode;
  meta?: string | React.ReactNode;
  accent?: MetricAccent;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function MetricCard({
  label,
  value,
  subValue,
  meta,
  accent = 'neutral',
  icon,
  className = '',
  onClick,
}: MetricCardProps) {
  // Semantic accent rail & dot styling
  let railColor = 'bg-transparent';
  let dotColor = 'bg-content-muted';
  let valueColor = 'text-content-primary';

  switch (accent) {
    case 'blue':
      railColor = 'border-l-2 border-l-[#0D94FB]';
      dotColor = 'bg-[#0D94FB]';
      break;
    case 'mint':
      railColor = 'border-l-2 border-l-[#04DB7C]';
      dotColor = 'bg-[#04DB7C]';
      valueColor = 'text-[#04DB7C] dark:text-[#04DB7C]';
      break;
    case 'amber':
      railColor = 'border-l-2 border-l-[#FFB454]';
      dotColor = 'bg-[#FFB454]';
      valueColor = 'text-[#D98A26] dark:text-[#FFB454]';
      break;
    case 'coral':
      railColor = 'border-l-2 border-l-[#FF647C]';
      dotColor = 'bg-[#FF647C]';
      valueColor = 'text-[#E03A53] dark:text-[#FF647C]';
      break;
    case 'violet':
      railColor = 'border-l-2 border-l-[#8B7CFF]';
      dotColor = 'bg-[#8B7CFF]';
      valueColor = 'text-[#7462F5] dark:text-[#A79CFF]';
      break;
    default:
      railColor = 'border-l-2 border-l-border';
      dotColor = 'bg-content-muted';
      break;
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg bg-surface border border-border shadow-card transition-all duration-150 hover:shadow-elevated ${railColor} ${
        onClick ? 'cursor-pointer hover:border-brand/40' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-content-muted font-medium">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {icon ? (
            <span className="text-content-muted">{icon}</span>
          ) : (
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          )}
        </div>
      </div>

      <div className={`text-2xl font-bold font-mono tracking-tight mt-2.5 tabular-nums ${valueColor}`}>
        {value}
      </div>

      {subValue && (
        <div className="text-[11px] font-mono text-content-secondary mt-1">
          {subValue}
        </div>
      )}

      {meta && (
        <div className="text-[10px] font-mono text-content-muted mt-2 pt-2 border-t border-border/60">
          {meta}
        </div>
      )}
    </div>
  );
}
