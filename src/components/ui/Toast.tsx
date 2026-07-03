import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/stores/toastStore';

const icons: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

const tones: Record<ToastVariant, string> = {
  default: 'text-gray-500',
  success: 'text-green-600',
  error: 'text-red-600',
};

/** 개별 토스트 컴포넌트 */
export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  const color = type === 'success' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <Icon size={18} className={color} />
      <span className="text-sm text-gray-700">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600" aria-label="닫기">
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
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg"
          >
            <Icon size={18} className={tones[t.variant]} />
            <span className="text-sm text-gray-700">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 text-gray-400 hover:text-gray-600"
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
