import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-10 rounded-lg border border-ink-300 bg-ink-50 px-3 text-sm text-ink-900',
          'placeholder:text-ink-400',
          'focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          error &&
            'border-critical bg-white focus:border-critical focus:ring-critical/20',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-critical">{error}</span>}
    </div>
  );
});
