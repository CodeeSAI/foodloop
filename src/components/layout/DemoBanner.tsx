import React, { useState, useEffect } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';

export const DemoBanner: React.FC = () => {
  const { requestResetDemoData, aiStatus } = useFoodLoop();
  const [dismissed, setDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse after 2.5 seconds, unless there is a critical error to inspect
  useEffect(() => {
    // If critical error is present, keep expanded so user is aware
    if (aiStatus.lastError) return;

    const timer = setTimeout(() => {
      // Respect prefers-reduced-motion automatically via CSS transition
      setIsCollapsed(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [aiStatus.lastError]);

  if (dismissed) return null;

  return (
    <div 
      className={`bg-forest-dark/95 backdrop-blur-md text-white px-4 md:px-8 border-b border-white/10 text-supporting flex flex-wrap items-center justify-between gap-2.5 z-20 shadow-xs transition-all duration-300 ease-in-out ${
        isCollapsed ? 'py-1 text-xs' : 'py-2.5'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-tech-label flex items-center gap-1.5 border shadow-2xs font-semibold ${
          aiStatus.isLiveVerified
            ? 'bg-lime-accent/20 border-lime-accent/40 text-lime-accent'
            : 'bg-amber-400/20 border-amber-400/35 text-amber-300'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.isLiveVerified ? 'bg-lime-accent animate-pulse' : 'bg-amber-400'}`}></span>
          {aiStatus.isLiveVerified
            ? `LIVE NEMOTRON (${aiStatus.provider === 'nebius' ? 'Nebius' : 'OpenRouter'})`
            : 'DETERMINISTIC SIMULATION'}
        </span>

        {isCollapsed ? (
          <span className="text-sage-pale/90 font-mono text-[11px] truncate max-w-xl">
            Target: <strong className="text-white">{aiStatus.model}</strong> &bull; {aiStatus.isLiveVerified ? 'Live Verified' : 'Deterministic Safety Engine'}
          </span>
        ) : (
          <span className="text-sage-pale/90 leading-tight">
            {aiStatus.isLiveVerified ? (
              <>
                Live inference via <strong className="text-white">NVIDIA Nemotron ({aiStatus.model})</strong> on <strong className="text-white">{aiStatus.provider === 'nebius' ? 'Nebius Token Factory' : 'OpenRouter'}</strong>.
              </>
            ) : (
              <>
                Running in <strong className="text-white">Deterministic Simulation Mode</strong> with active food-safety guardrails. Configured provider: <strong className="text-white">{aiStatus.provider === 'nebius' ? 'Nebius Token Factory' : 'OpenRouter'}</strong> ({aiStatus.model}).
              </>
            )}
          </span>
        )}

        {!isCollapsed && (
          <span className="text-tech-label text-amber-200/80 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 hidden xl:inline lowercase tracking-normal">
            illustrative demo dataset &bull; no real-world food claimed rescued
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setIsCollapsed(prev => !prev)}
          className="text-sage-pale/80 hover:text-white flex items-center gap-1 text-[11px] font-mono py-0.5 px-2 rounded-md hover:bg-white/5 transition-colors"
          title={isCollapsed ? 'Expand system details' : 'Collapse banner'}
        >
          <span className="material-symbols-outlined text-[14px]">
            {isCollapsed ? 'unfold_more' : 'unfold_less'}
          </span>
          <span>{isCollapsed ? 'Expand Details' : 'Collapse'}</span>
        </button>

        {!isCollapsed && (
          <button
            type="button"
            onClick={requestResetDemoData}
            className="text-lime-accent hover:text-white flex items-center gap-1.5 text-tech-label transition-colors py-0.5 px-2 rounded-md hover:bg-white/5 font-semibold"
            title="Reset database to initial sample lots and shelters"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            Reset Demo State
          </button>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-sage-pale/60 hover:text-white transition-colors p-1 rounded-md"
          aria-label="Dismiss banner"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
};
