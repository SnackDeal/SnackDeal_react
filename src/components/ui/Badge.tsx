import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'gray' | 'brand' | 'green' | 'red' | 'yellow';

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const tones: Record<Tone, string> = {
  gray: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-critical',
  yellow: 'bg-amber-50 text-amber-700',
};

export function Badge({ children, tone = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
