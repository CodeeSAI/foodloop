import React from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useFoodLoop();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isWarning = toast.type === 'warning';
        const isInfo = toast.type === 'info';
        const isAlert = toast.type === 'alert';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3.5 transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              isWarning
                ? 'bg-amber-950/85 border-amber-500/40 text-white'
                : isAlert
                ? 'bg-red-950/85 border-red-500/40 text-white'
                : isInfo
                ? 'bg-forest-dark/85 border-emerald-500/40 text-white'
                : 'bg-forest/85 border-lime-accent/35 text-white'
            }`}
          >
            <div className="mt-0.5">
              <span className={`material-symbols-outlined text-[20px] ${
                isWarning ? 'text-amber-400' : isAlert ? 'text-red-400' : isInfo ? 'text-sky-300' : 'text-lime-accent'
              }`}>
                {isWarning ? 'warning' : isAlert ? 'error' : isInfo ? 'info' : 'task_alt'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-tech-label font-bold flex items-center justify-between text-white">
                <span>{toast.title}</span>
                <span className="text-[10px] text-sage-pale/60 font-normal lowercase tracking-normal">now</span>
              </div>
              <p className="text-supporting text-sage-pale/90 mt-1 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-sage-pale/60 hover:text-white -mr-1 transition-colors p-0.5"
              aria-label="Dismiss toast"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
