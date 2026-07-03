import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  path: string;
  note?: ReactNode;
}

/** 뼈대 단계 공용 "준비중" 화면. 도메인 구현 시 이 파일을 실제 화면으로 교체. */
export function Placeholder({ title, path, note }: PlaceholderProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Construction size={26} />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-400">준비중</p>
      </div>
      <code className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500">{path}</code>
      {note && <p className="max-w-md text-sm text-gray-400">{note}</p>}
    </div>
  );
}
