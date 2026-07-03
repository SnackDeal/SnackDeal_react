/** className 조건부 병합 (경량 clsx 대체) */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
