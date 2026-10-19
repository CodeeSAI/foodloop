import React, { useEffect } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';

export const ResetConfirmModal: React.FC = () => {
  const { isResetConfirmOpen, confirmResetDemoData, cancelResetDemoData } = useFoodLoop();

  useEffect(() => {
    if (!isResetConfirmOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelResetDemoData();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResetConfirmOpen, cancelResetDemoData]);

  if (!isResetConfirmOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
      onClick={cancelResetDemoData}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div
        className="glass-dropdown rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-red-500/35 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-red-400">
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">restart_alt</span>
          </div>
          <div>
            <h3 id="reset-modal-title" className="font-bold text-lg font-sans text-white">
              Reset Demo Data?
            </h3>
            <span className="text-[11px] font-mono text-red-300">Irreversible Demonstration Action</span>
          </div>
        </div>

        <p className="text-xs text-sage-pale/85 leading-relaxed font-sans">
          This action will restore all surplus food lots, recipient shelter intake loads, couriers, and dispatch records to the initial hackathon seed state. Any newly created surplus lots or handoffs will be cleared.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={cancelResetDemoData}
            className="btn-ghost px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmResetDemoData}
            className="btn-destructive px-5 py-2 text-xs font-bold"
          >
            Confirm &amp; Reset State
          </button>
        </div>
      </div>
    </div>
  );
};
