import React from 'react';

export type StatusVariant =
  | 'MATCHED'
  | 'REVIEW'
  | 'EXCEPTION'
  | 'PASS'
  | 'BLOCK'
  | 'PENDING'
  | 'INVALID'
  | 'AI'
  | 'HIGH_VALUE'
  | 'FLAGSHIP'
  | 'OPERATIONAL';

interface StatusBadgeProps {
  status: string | StatusVariant;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
  label?: string;
}

export default function StatusBadge({
  status,
  size = 'sm',
  showDot = true,
  className = '',
  label,
}: StatusBadgeProps) {
  const norm = (status || '').toUpperCase().trim();
  const displayLabel = label || norm;

  // Resolve semantic color styles
  let colorStyles = 'bg-surface-sunken text-content-muted border-border';
  let dotColor = 'bg-content-muted';

  switch (norm) {
    case 'MATCHED':
    case 'PASS':
    case 'CONFIRMED':
    case 'OPERATIONAL':
      colorStyles =
        'bg-[#04DB7C]/10 text-[#04DB7C] dark:bg-[#04DB7C]/15 dark:text-[#04DB7C] border-[#04DB7C]/25';
      dotColor = 'bg-[#04DB7C]';
      break;

    case 'REVIEW':
    case 'PENDING':
    case 'AMBIGUOUS':
      colorStyles =
        'bg-[#FFB454]/12 text-[#D98A26] dark:bg-[#FFB454]/15 dark:text-[#FFB454] border-[#FFB454]/30';
      dotColor = 'bg-[#FFB454]';
      break;

    case 'EXCEPTION':
    case 'BLOCK':
    case 'BLOCKED':
    case 'INVALID':
    case 'FAILED':
      colorStyles =
        'bg-[#FF647C]/10 text-[#E03A53] dark:bg-[#FF647C]/15 dark:text-[#FF647C] border-[#FF647C]/25';
      dotColor = 'bg-[#FF647C]';
      break;

    case 'AI':
    case 'GEMINI':
    case 'AI INVESTIGATOR':
      colorStyles =
        'bg-[#8B7CFF]/12 text-[#7462F5] dark:bg-[#8B7CFF]/20 dark:text-[#A79CFF] border-[#8B7CFF]/30';
      dotColor = 'bg-[#8B7CFF]';
      break;

    case 'HIGH_VALUE':
    case 'HIGH VALUE':
      colorStyles =
        'bg-[#FF647C]/10 text-[#E03A53] dark:bg-[#FF647C]/15 dark:text-[#FFB454] border-[#FF647C]/30';
      dotColor = 'bg-[#FF647C]';
      break;

    case 'FLAGSHIP':
      colorStyles =
        'bg-[#8B7CFF]/10 text-[#7462F5] dark:bg-[#8B7CFF]/20 dark:text-[#A79CFF] border-[#8B7CFF]/30';
      dotColor = 'bg-[#8B7CFF]';
      break;

    default:
      colorStyles = 'bg-surface-sunken text-content-secondary border-border';
      dotColor = 'bg-content-muted';
      break;
  }

  const sizeStyles =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 tracking-wider gap-1.5'
      : 'text-xs px-2.5 py-1 tracking-wider gap-2';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase rounded border transition-colors select-none ${sizeStyles} ${colorStyles} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor} ${
            norm === 'OPERATIONAL' || norm === 'REVIEW' ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
