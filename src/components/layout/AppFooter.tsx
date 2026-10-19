import React from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';

export const AppFooter: React.FC = () => {
  const { setActiveView } = useFoodLoop();

  const handleNav = (view: 'privacy' | 'terms' | 'cookies' | 'accessibility') => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      role="contentinfo"
      aria-label="Site Footer"
      className="mt-8 border-t border-white/10 bg-[#051811]/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 text-xs text-[#9EB3A2] shadow-sm select-none"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Attribution */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-accent"></span>
            <span className="font-extrabold text-white text-sm tracking-tight font-sans">
              FOODLOOP
            </span>
            <span className="text-sage-pale/60 text-xs font-mono">&mdash; Zero-Waste Dispatch</span>
          </div>
          <span className="hidden sm:inline text-white/20">&bull;</span>
          <span className="text-[#9EB3A2] font-mono text-[11px]">
            Made by Team DuoFlash &middot; R Sai Ganesh
          </span>
        </div>

        {/* Legal & Compliance Links */}
        <nav
          aria-label="Legal and Trust Navigation"
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 font-mono text-[11px]"
        >
          <button
            type="button"
            onClick={() => handleNav('privacy')}
            className="text-sage-pale hover:text-lime-accent transition-colors underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-lime-accent rounded"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => handleNav('terms')}
            className="text-sage-pale hover:text-lime-accent transition-colors underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-lime-accent rounded"
          >
            Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={() => handleNav('cookies')}
            className="text-sage-pale hover:text-lime-accent transition-colors underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-lime-accent rounded"
          >
            Cookie Policy
          </button>
          <button
            type="button"
            onClick={() => handleNav('accessibility')}
            className="text-sage-pale hover:text-lime-accent transition-colors underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-lime-accent rounded"
          >
            Accessibility Statement
          </button>
        </nav>
      </div>

      {/* Compliance / Vercel deployment subtitle */}
      <div className="mt-3 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-sage-pale/60 font-mono text-center sm:text-left">
        <span>
          Operational decision-support platform. Deterministic HACCP safety verification strictly enforced.
        </span>
        <span className="text-lime-accent/80">
          Deployed on Vercel &bull; Client Zero-Tracking Active
        </span>
      </div>
    </footer>
  );
};
