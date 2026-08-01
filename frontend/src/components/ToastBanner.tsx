import React from 'react';
import { CheckCircle, AlertOctagon, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface ToastBannerProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-fadeIn">
      <div
        className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-xl ${
          isSuccess
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-500/10'
            : 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-500/10'
        }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          {isSuccess ? <CheckCircle className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
        </div>

        <div className="flex-1 text-xs">
          <h4 className="font-bold text-sm mb-0.5">{toast.title}</h4>
          <p className="opacity-90 leading-relaxed">{toast.message}</p>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
