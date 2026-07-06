import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// SEED 기반: primary=브랜드 오렌지 솔리드, secondary=neutral weak,
// outline=neutral outline, ghost=투명, danger=critical
const variants: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-600',
  secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-200 active:bg-ink-200',
  outline:
    'border border-ink-300 bg-white text-ink-900 hover:bg-ink-50 active:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100 active:bg-ink-100',
  danger: 'bg-critical text-white hover:opacity-90 active:opacity-90',
};

// SEED 스펙: lg 52 / md 40 / sm 36
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-[52px] px-5 text-base font-bold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150',
        'disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-400 disabled:border-transparent',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1',
        'active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
