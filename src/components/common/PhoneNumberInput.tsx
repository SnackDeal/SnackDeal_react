import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { phoneDigitsOnly, splitPhoneNumber } from '@/lib/phone';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

function formatPhone(first: string, middle: string, last: string) {
  const parts = [first, middle, last];
  const lastFilledIndex = parts.reduce((lastIndex, part, index) => (part ? index : lastIndex), -1);

  if (lastFilledIndex === -1) return '';
  return parts.slice(0, lastFilledIndex + 1).join('-');
}

export function PhoneNumberInput({
  value,
  onChange,
  disabled,
  className,
  label = '휴대폰번호',
}: PhoneNumberInputProps) {
  const parsed = splitPhoneNumber(value);
  const [first, setFirst] = useState(parsed.first);
  const [middle, setMiddle] = useState(parsed.middle);
  const [last, setLast] = useState(parsed.last);

  useEffect(() => {
    const next = splitPhoneNumber(value);
    setFirst(next.first);
    setMiddle(next.middle);
    setLast(next.last);
  }, [value]);

  function emit(nextFirst: string, nextMiddle: string, nextLast: string) {
    onChange(formatPhone(nextFirst, nextMiddle, nextLast));
  }

  function handleFirstChange(nextValue: string) {
    const nextFirst = phoneDigitsOnly(nextValue).slice(0, 3);
    setFirst(nextFirst);
    emit(nextFirst, middle, last);
  }

  function handleMiddleChange(nextValue: string) {
    const nextMiddle = phoneDigitsOnly(nextValue).slice(0, 4);
    setMiddle(nextMiddle);
    emit(first, nextMiddle, last);
  }

  function handleLastChange(nextValue: string) {
    const nextLast = phoneDigitsOnly(nextValue).slice(0, 4);
    setLast(nextLast);
    emit(first, middle, nextLast);
  }

  const inputClassName =
    'h-10 w-full rounded-lg border border-ink-300 bg-white px-3 text-center text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-ink-100 disabled:text-ink-400';

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <div className="grid grid-cols-[0.9fr_auto_1fr_auto_1fr] items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          aria-label="휴대폰 앞자리"
          placeholder="010"
          value={first}
          onChange={(e) => handleFirstChange(e.target.value)}
          maxLength={3}
          disabled={disabled}
          className={inputClassName}
        />
        <span className="text-ink-400">-</span>
        <input
          type="text"
          inputMode="numeric"
          aria-label="휴대폰 가운데자리"
          placeholder="1234"
          value={middle}
          onChange={(e) => handleMiddleChange(e.target.value)}
          maxLength={4}
          disabled={disabled}
          className={inputClassName}
        />
        <span className="text-ink-400">-</span>
        <input
          type="text"
          inputMode="numeric"
          aria-label="휴대폰 끝자리"
          placeholder="5678"
          value={last}
          onChange={(e) => handleLastChange(e.target.value)}
          maxLength={4}
          disabled={disabled}
          className={inputClassName}
        />
      </div>
    </div>
  );
}
