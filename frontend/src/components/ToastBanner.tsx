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
        className={`p-4 rounded-2xl border shadow-lg flex items-start gap-3 ${
          isSuccess
            ? 'bg-[#1a2f24] border-[#22442c] text-emerald-100 shadow-[#0d1812]/50'
            : 'bg-[#3b1c1c] border-[#552323] text-rose-100 shadow-[#1a0c0c]/50'
        }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isSuccess ? 'bg-[#22442c]/50 text-emerald-400' : 'bg-[#552323]/50 text-rose-400'
          }`}
        >
          {isSuccess ? <CheckCircle className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
        </div>

        <div className="flex-1 text-xs">
          <h4 className="font-bold text-sm mb-0.5 text-white">{toast.title}</h4>
          <p className="opacity-80 leading-relaxed text-[#c9d1d9]">{toast.message}</p>
        </div>

        <button
          onClick={onDismiss}
          className={`p-1 rounded-lg transition-all shrink-0 ${
            isSuccess ? 'hover:bg-[#22442c]/50 text-emerald-500' : 'hover:bg-[#552323]/50 text-rose-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
