import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/stores/toastStore';

const icons: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

const tones: Record<ToastVariant, string> = {
  default: 'text-ink-500',
  success: 'text-positive',
  error: 'text-critical',
};

/** 개별 토스트 컴포넌트 */
export function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  const color = type === 'success' ? 'text-positive' : 'text-critical';

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3 shadow-s2">
      <Icon size={18} className={color} />
      <span className="text-sm text-ink-800">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-ink-400 hover:text-ink-700"
        aria-label="닫기"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** 앱 루트에 1회 마운트되는 토스트 뷰포트 */
export function ToastViewport() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.variant];
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3 shadow-s2"
          >
            <Icon size={18} className={tones[t.variant]} />
            <span className="text-sm text-ink-800">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 text-ink-400 hover:text-ink-700"
              aria-label="닫기"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
