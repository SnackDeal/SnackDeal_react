import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'yellow';

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const tones: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-brand-50 text-brand-700',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-700',
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
