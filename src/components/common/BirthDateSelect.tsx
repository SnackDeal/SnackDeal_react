import { useEffect, useMemo, useState } from 'react';
import { Select } from '@/components/ui';
import { cn } from '@/lib/cn';

interface BirthDateSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

function pad2(value: string) {
  return value.padStart(2, '0');
}

function getDaysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function splitBirth(value: string) {
  const [year = '', month = '', day = ''] = value.split('-');
  return { year, month, day };
}

export function BirthDateSelect({ value, onChange, disabled, className }: BirthDateSelectProps) {
  const parsed = splitBirth(value);
  const [year, setYear] = useState(parsed.year);
  const [month, setMonth] = useState(parsed.month);
  const [day, setDay] = useState(parsed.day);

  useEffect(() => {
    const next = splitBirth(value);
    setYear(next.year);
    setMonth(next.month);
    setDay(next.day);
  }, [value]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: '', label: '년도' },
      ...Array.from({ length: currentYear - 1899 }, (_, index) => {
        const yearValue = String(currentYear - index);
        return { value: yearValue, label: `${yearValue}년` };
      }),
    ];
  }, []);

  const monthOptions = useMemo(
    () => [
      { value: '', label: '월' },
      ...Array.from({ length: 12 }, (_, index) => {
        const monthValue = pad2(String(index + 1));
        return { value: monthValue, label: `${index + 1}월` };
      }),
    ],
    []
  );

  const dayOptions = useMemo(() => {
    const days = getDaysInMonth(year, month);
    return [
      { value: '', label: '일' },
      ...Array.from({ length: days }, (_, index) => {
        const dayValue = pad2(String(index + 1));
        return { value: dayValue, label: `${index + 1}일` };
      }),
    ];
  }, [month, year]);

  function emit(nextYear: string, nextMonth: string, nextDay: string) {
    onChange(nextYear && nextMonth && nextDay ? `${nextYear}-${nextMonth}-${nextDay}` : '');
  }

  function handleYearChange(nextYear: string) {
    const maxDay = getDaysInMonth(nextYear, month);
    const nextDay = day && Number(day) <= maxDay ? day : '';
    setYear(nextYear);
    setDay(nextDay);
    emit(nextYear, month, nextDay);
  }

  function handleMonthChange(nextMonth: string) {
    const maxDay = getDaysInMonth(year, nextMonth);
    const nextDay = day && Number(day) <= maxDay ? day : '';
    setMonth(nextMonth);
    setDay(nextDay);
    emit(year, nextMonth, nextDay);
  }

  function handleDayChange(nextDay: string) {
    setDay(nextDay);
    emit(year, month, nextDay);
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm font-medium text-ink-700">생년월일</span>
      <div className="grid grid-cols-[1.25fr_1fr_1fr] gap-2">
        <Select
          id="birthYear"
          aria-label="생년"
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          options={yearOptions}
          disabled={disabled}
        />
        <Select
          id="birthMonth"
          aria-label="생월"
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          options={monthOptions}
          disabled={disabled}
        />
        <Select
          id="birthDay"
          aria-label="생일"
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          options={dayOptions}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
