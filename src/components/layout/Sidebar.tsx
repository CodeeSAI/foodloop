import React from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';
import { ActiveView } from '../../types';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeView, setActiveView, donations, requestResetDemoData, aiStatus } = useFoodLoop();

  const activeBatchesCount = donations.filter(d => d.status !== 'DELIVERED' && d.status !== 'CANCELLED').length;
  const inTransitCount = donations.filter(d => d.status === 'IN_TRANSIT').length;

  const navItems: { id: ActiveView; label: string; icon: string; badge?: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      badge: (
        <span className="text-[10px] font-mono bg-lime-accent text-forest font-extrabold px-2 py-0.5 rounded-full shadow-xs">
          {activeBatchesCount}
        </span>
      ),
    },
    {
      id: 'create',
      label: 'Create Donation',
      icon: 'add_circle',
      badge: (
        <span className="text-[10px] font-mono bg-white/10 text-white/90 px-1.5 py-0.5 rounded font-medium border border-white/10">
          +New
        </span>
      ),
    },
    {
      id: 'matching',
      label: 'Recipient Match',
      icon: 'hub',
      badge: <span className="w-2 h-2 rounded-full bg-lime-accent animate-pulse shadow-xs"></span>,
    },
    {
      id: 'planner',
      label: 'AI Dispatch Planner',
      icon: 'psychology',
      badge: (
        <span className="text-[9px] font-mono bg-emerald-accent/60 text-lime-accent px-1.5 py-0.5 rounded uppercase font-semibold border border-lime-accent/30 shadow-2xs">
          Simulate
        </span>
      ),
    },
    {
      id: 'tracking',
      label: 'Chain of Custody',
      icon: 'local_shipping',
      badge: (
        <span className="text-[10px] font-mono text-emerald-300 font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
          {inTransitCount > 0 ? `${inTransitCount} Live` : 'Live'}
        </span>
      ),
    },
    {
      id: 'analytics',
      label: 'Impact Analytics',
      icon: 'monitoring',
      badge: <span className="material-symbols-outlined text-[15px] text-sage-pale/60">trending_up</span>,
    },
  ];

  const handleNavClick = (viewId: ActiveView) => {
    setActiveView(viewId);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full justify-between bg-[#041610]/95 backdrop-blur-2xl text-ivory-warm relative overflow-hidden select-none">
      {/* Ambient glowing radial lights */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-16 -left-16 w-52 h-52 rounded-full bg-emerald-accent/30 blur-3xl"
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-40 -right-12 w-40 h-40 rounded-full bg-lime-accent/15 blur-2xl"
      />

      <div className="flex flex-col flex-1 min-h-0 relative z-10">
        {/* Brand & System Status */}
        <div className="p-5 border-b border-white/10 flex flex-col gap-3.5 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-accent/15 border border-lime-accent/40 flex items-center justify-center shadow-inner relative group">
                <span className="material-symbols-outlined text-lime-accent text-2xl font-bold transition-transform duration-200 group-hover:scale-110">
                  all_inclusive
                </span>
                <span className="absolute inset-0 rounded-xl bg-lime-accent/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xs"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white font-sans">FOODLOOP</span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-lime-accent/20 text-lime-accent border border-lime-accent/35 font-semibold tracking-wider">
                    v3.4
                  </span>
                </div>
                <p className="text-xs text-sage-pale/75 font-mono">Zero-Waste Dispatch</p>
              </div>
            </div>
            {isMobileOpen && (
              <button 
                onClick={onCloseMobile} 
                className="md:hidden text-sage-pale hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close navigation drawer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          {/* Product-Focused AI Dispatch Engine Card */}
          <div className="bg-[#07241A]/90 backdrop-blur-md rounded-2xl p-3 border border-white/12 flex flex-col gap-1.5 text-[11px] font-mono shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-sage-pale/90 uppercase tracking-wider font-mono">
                AI DISPATCH ENGINE
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                aiStatus.isLiveVerified
                  ? 'bg-lime-accent/20 text-lime-accent border-lime-accent/40 shadow-xs'
                  : aiStatus.hasKey
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
              }`}>
                {aiStatus.isLiveVerified ? 'Live AI' : aiStatus.hasKey ? 'AI Ready' : 'Simulation'}
              </span>
            </div>
            <p className="text-xs text-white/90 font-sans font-medium">
              Food Rescue Intelligence
            </p>
            <div className="flex items-center justify-between text-sage-pale/70 text-[10px] pt-1.5 border-t border-white/8 font-mono">
              <span className="truncate">
                {aiStatus.isLiveVerified
                  ? (aiStatus.provider === 'nebius' ? 'Nebius Cloud' : 'OpenRouter Live')
                  : 'Deterministic Safety'}
              </span>
              <button
                type="button"
                onClick={() => handleNavClick('planner')}
                className="text-lime-accent hover:underline flex items-center gap-0.5 focus-visible:outline-none"
              >
                <span>Details</span>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="text-tech-label text-sage-pale/60 px-3 pb-2 tracking-widest">
            Operations Hub
          </div>
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm transition-all duration-200 group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-accent ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-accent/40 to-lime-accent/15 text-lime-accent font-bold shadow-lg border border-lime-accent/35'
                    : 'text-sage-pale/80 hover:text-white hover:bg-white/6 border border-transparent font-medium'
                }`}
              >
                {/* Active left glowing bar */}
                {isActive && (
                  <span className="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full bg-lime-accent shadow-xs" />
                )}
                <div className={`flex items-center gap-3 transition-transform duration-200 ${isActive ? 'translate-x-1.5' : 'group-hover:translate-x-1'}`}>
                  <span className={`material-symbols-outlined text-[20px] transition-colors ${isActive ? 'text-lime-accent' : 'text-sage-pale/70 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  <span className="font-sans tracking-tight">{item.label}</span>
                </div>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer / Attribution & Reset Demo */}
      <div className="p-4 border-t border-white/10 bg-[#051A12]/90 backdrop-blur-md flex flex-col gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-lime-accent/15 border border-lime-accent/30 flex items-center justify-center text-[12px] font-mono font-bold text-lime-accent">
            N
          </div>
          <div className="text-[11px] leading-tight">
            <div className="font-semibold text-white">NVIDIA × Nebius</div>
            <div className="text-[10px] text-sage-pale/60 font-mono">Global AI Hackathon 2025</div>
          </div>
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={requestResetDemoData}
          className="btn-ghost w-full py-2 px-3 text-xs font-mono flex items-center justify-center gap-2"
          title="Restore original sample batches, recipients, and telemetry"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          <span>Reset Demo Data</span>
        </button>

        <div className="text-[10px] font-mono text-sage-pale/60 flex justify-between items-center pt-0.5">
          <span className="truncate">Mode: {aiStatus.isLiveVerified ? (aiStatus.provider === 'nebius' ? 'Nebius Cloud' : 'OpenRouter Live') : 'Deterministic Safety'}</span>
          <span className="text-lime-accent/90 flex items-center gap-1 font-semibold flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.isLiveVerified ? 'bg-lime-accent' : 'bg-amber-400'}`}></span>
            {aiStatus.isLiveVerified ? 'Live AI' : 'Simulation'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-white/10 shadow-2xl z-40 select-none">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
