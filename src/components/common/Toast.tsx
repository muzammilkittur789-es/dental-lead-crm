import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const borderClass =
          toast.type === 'success'
            ? 'border-[#A7F3D0]'
            : toast.type === 'error'
            ? 'border-[#FECDCA]'
            : 'border-[#CCFBF1]';

        const Icon =
          toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

        const iconColor =
          toast.type === 'success'
            ? 'text-[#15803D]'
            : toast.type === 'error'
            ? 'text-[#B42318]'
            : 'text-[#0F766E]';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 bg-white rounded-xl border ${borderClass} shadow-lg flex items-start gap-3 transition-all duration-200 text-[#17202F]`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs">
              {toast.title && <p className="font-semibold text-sm mb-0.5 text-[#17202F]">{toast.title}</p>}
              <p className="leading-relaxed text-[#475467]">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded text-[#98A2B3] hover:text-[#17202F] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
