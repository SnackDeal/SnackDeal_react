import { useEffect, useRef, useState } from 'react';

/** 초 단위 카운트다운. start(seconds)로 시작, 0에서 멈춤. */
export function useCountdown() {
  const [remaining, setRemaining] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const start = (seconds: number) => {
    clear();
    setRemaining(seconds);
    timer.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clear();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  useEffect(() => clear, []);

  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(
    remaining % 60
  ).padStart(2, '0')}`;

  return { remaining, mmss, start, reset: clear };
}
