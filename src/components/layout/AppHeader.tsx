import React, { useState, useRef, useEffect } from 'react';
import { useFoodLoop, ALL_KITCHEN_OPTIONS, ALL_KITCHENS_ID, DonorOrg } from '../../context/FoodLoopContext';
import { OperationalReportModal } from './OperationalReportModal';

interface AppHeaderProps {
  onToggleMobileNav?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleMobileNav }) => {
  const {
    searchQuery,
    setSearchQuery,
    allZonesActive,
    toggleAllZones,
    isUrgentOnly,
    toggleUrgentOnly,
    setActiveView,
    triggerToast,
    selectedKitchenId,
    setSelectedKitchenId,
    selectedDonorOrg,
    aiStatus,
    donations,
    requestResetDemoData,
  } = useFoodLoop();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or touch
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(target)) {
        setOrgDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setNotifDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
    };

    if (orgDropdownOpen || notifDropdownOpen || profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [orgDropdownOpen, notifDropdownOpen, profileDropdownOpen]);

  // Close dropdowns on Escape key
  useEffect(() => {
    if (!orgDropdownOpen && !notifDropdownOpen && !profileDropdownOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOrgDropdownOpen(false);
        setNotifDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orgDropdownOpen, notifDropdownOpen, profileDropdownOpen]);

  // Recent operational activity
  const recentActivity = donations
    .filter(d => d.trackingSteps && d.trackingSteps.length > 0)
    .slice(0, 4);

  return (
    <header className="h-16 flex-shrink-0 bg-[#082218]/95 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 flex items-center justify-between z-40 relative shadow-lg">
      {/* Mobile Menu & Logo Trigger */}
      <div className="md:hidden flex items-center gap-2">
        <button
          onClick={onToggleMobileNav}
          className="p-2 -ml-2 rounded-xl text-sage-pale hover:bg-white/10 hover:text-white transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-lime-accent focus-visible:outline-none"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <span className="font-extrabold text-white text-base tracking-tight font-sans">FOODLOOP</span>
      </div>

      {/* Global Search & Zone Filters */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sage-pale/60 text-[19px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lot ID, donor kitchen, food category, or shelter..."
            className="w-full pl-10 pr-9 py-2 bg-[#0B2C21]/80 hover:bg-[#0D3326] focus:bg-[#0D382A] text-body-default rounded-xl border border-white/10 focus:border-lime-accent/50 focus:ring-4 focus:ring-lime-accent/15 outline-none transition-all duration-200 text-white placeholder:text-sage-pale/50 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-pale/60 hover:text-white transition-colors p-0.5 rounded-md focus-visible:outline-none"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={toggleAllZones}
            className={`px-3 py-1.5 text-tech-label rounded-xl transition-all duration-150 flex items-center gap-1.5 ${
              allZonesActive
                ? 'btn-primary text-xs py-1 px-3 shadow-xs'
                : 'btn-ghost text-xs py-1 px-3'
            }`}
            title={allZonesActive ? 'Showing all network zones/kitchens. Click to restrict to active kitchen.' : 'Expand to all network zones without changing active kitchen selection'}
          >
            <span className="material-symbols-outlined text-[14px]">
              {allZonesActive ? 'check_circle' : 'hub'}
            </span>
            All Zones
          </button>
          <button
            type="button"
            onClick={toggleUrgentOnly}
            className={`px-3 py-1.5 text-tech-label rounded-xl flex items-center gap-1.5 transition-all duration-150 ${
              isUrgentOnly
                ? 'bg-alert-crimson text-white font-bold shadow-xs ring-2 ring-red-400/40'
                : 'btn-destructive text-xs py-1 px-2.5'
            }`}
            title={isUrgentOnly ? 'Urgent filter active (<90m). Click to show all active batches.' : 'Filter to urgent batches expiring in <90m'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isUrgentOnly ? 'bg-white animate-pulse' : 'bg-red-400'}`}></span>
            Urgent Only
          </button>
        </div>
      </div>

      {/* Right Controls: Working Donor Org Selector, CTA, Notification, Profile */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Working Active Donor Org Selector */}
        <div className="relative" ref={orgDropdownRef}>
          <button
            onClick={() => {
              setOrgDropdownOpen(prev => !prev);
              setNotifDropdownOpen(false);
            }}
            aria-expanded={orgDropdownOpen}
            aria-haspopup="listbox"
            className={`flex items-center gap-2 bg-[#0D3125] hover:bg-[#103A2C] border rounded-xl px-2.5 sm:px-3 py-1.5 transition-all duration-200 text-left shadow-xs focus-visible:ring-2 focus-visible:ring-lime-accent focus-visible:outline-none ${
              orgDropdownOpen
                ? 'border-lime-accent ring-2 ring-lime-accent/30 bg-[#103A2C]'
                : 'border-white/15 hover:border-lime-accent/40'
            }`}
            title="Switch active commercial kitchen"
          >
            <div className="w-6 h-6 rounded-lg bg-lime-accent/15 text-lime-accent flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[16px]">
                {selectedKitchenId === ALL_KITCHENS_ID ? 'hub' : 'restaurant'}
              </span>
            </div>
            <div className="text-left hidden xs:block">
              <div className="text-subheading font-bold text-white leading-tight truncate max-w-[100px] sm:max-w-[140px]">
                {selectedDonorOrg.name}
              </div>
              <div className="text-tech-label text-sage-pale/75 truncate max-w-[100px] sm:max-w-[140px] font-normal lowercase tracking-normal">
                {selectedDonorOrg.sub}
              </div>
            </div>
            <span className={`material-symbols-outlined text-sage-pale/70 text-[18px] transition-transform duration-200 ${
              orgDropdownOpen ? 'rotate-180 text-lime-accent' : ''
            }`}>
              expand_more
            </span>
          </button>

          {/* Donor Org Dropdown with Opaque Dark-Green Glass */}
          {orgDropdownOpen && (
            <div
              role="listbox"
              aria-label="Active Commercial Kitchen Selection"
              className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] glass-dropdown rounded-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 shadow-2xl space-y-1"
            >
              <div className="px-3 py-2 text-tech-label text-lime-accent font-bold border-b border-white/10 mb-1 flex items-center justify-between">
                <span>Select Operations Scope</span>
                <span className="text-[10px] text-sage-pale/60 font-mono font-normal">All Hubs &amp; Kitchens</span>
              </div>
              <div className="max-h-[min(380px,calc(100vh-5rem))] overflow-y-auto space-y-1.5 pr-0.5">
                {ALL_KITCHEN_OPTIONS.map((org: DonorOrg) => {
                  const isSelected = selectedKitchenId === org.id;
                  const isAll = org.id === ALL_KITCHENS_ID;
                  return (
                    <button
                      key={org.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setSelectedKitchenId(org.id);
                        setOrgDropdownOpen(false);
                        triggerToast(
                          isAll ? 'Network-Wide Scope' : 'Kitchen Switched',
                          isAll ? 'Operations Command set to All Commercial Kitchens.' : `Active kitchen set to ${org.name}`
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedKitchenId(org.id);
                          setOrgDropdownOpen(false);
                          triggerToast(
                            isAll ? 'Network-Wide Scope' : 'Kitchen Switched',
                            isAll ? 'Operations Command set to All Commercial Kitchens.' : `Active kitchen set to ${org.name}`
                          );
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex items-start justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-lime-accent/20 border border-lime-accent/50 text-white font-semibold ring-1 ring-lime-accent/30'
                          : 'hover:bg-white/10 text-sage-pale hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[15px] ${isSelected ? 'text-lime-accent' : 'text-sage-pale/70'}`}>
                            {isAll ? 'hub' : 'restaurant'}
                          </span>
                          <div className={`text-subheading font-bold text-sm ${isSelected ? 'text-lime-accent' : 'text-white'}`}>
                            {org.name}
                          </div>
                          {isSelected && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lime-accent text-forest font-extrabold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-supporting text-sage-pale font-mono text-xs mt-0.5 truncate pl-6">
                          {org.sub}
                        </div>
                        <div className="text-[11px] text-sage-pale/70 font-sans mt-0.5 truncate pl-6">
                          {org.address}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-lime-accent text-forest flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                          <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Post Surplus Button: FOODLOOP Lime background with Deep Forest text/icons */}
        <button
          onClick={() => setActiveView('create')}
          className="btn-primary px-3 sm:px-4 py-2 text-xs font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span className="hidden sm:inline">Post Surplus</span>
        </button>

        <div className="h-6 w-px bg-white/15 hidden sm:block"></div>

        {/* Interactive Notifications Bell */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => {
              setNotifDropdownOpen(prev => !prev);
              setOrgDropdownOpen(false);
            }}
            className={`relative p-2 rounded-xl transition-colors active:scale-95 ${
              notifDropdownOpen
                ? 'bg-white/15 text-white ring-2 ring-lime-accent/30'
                : 'text-sage-pale hover:text-white hover:bg-white/10'
            }`}
            aria-label="Alerts"
            aria-expanded={notifDropdownOpen}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-xs"></span>
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] glass-dropdown rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-card-title text-white">Dispatch Notifications</span>
                <span className="text-tech-label text-lime-accent bg-lime-accent/15 px-2 py-0.5 rounded-full border border-lime-accent/30 font-semibold">
                  Live Dispatch
                </span>
              </div>
              <div className="max-h-[min(340px,calc(100vh-6rem))] overflow-y-auto space-y-1.5 pr-0.5">
                {recentActivity.map((d) => (
                  <div key={d.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-supporting text-sage-pale">
                    <div className="flex justify-between items-center text-tech-data font-bold text-white">
                      <span>{d.id}</span>
                      <span className="text-tech-label text-lime-accent bg-forest/80 px-1.5 py-0.5 rounded">{d.status}</span>
                    </div>
                    <p className="text-supporting text-sage-pale truncate mt-1">{d.title}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setNotifDropdownOpen(false);
                  setActiveView('tracking');
                }}
                className="w-full text-center py-2 text-subheading font-semibold text-lime-accent hover:underline pt-2 border-t border-white/10 block transition-colors"
              >
                View Chain of Custody &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Interactive User Profile / Avatar Menu */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setProfileDropdownOpen(prev => !prev);
              setOrgDropdownOpen(false);
              setNotifDropdownOpen(false);
            }}
            className={`flex items-center gap-1.5 p-1 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-accent ${
              profileDropdownOpen ? 'bg-white/15 ring-2 ring-lime-accent/40' : 'hover:bg-white/10'
            }`}
            aria-label="User profile and session options"
            aria-expanded={profileDropdownOpen}
          >
            <div className="relative w-8 h-8 rounded-xl bg-[#0D382A] border border-lime-accent/40 flex items-center justify-center text-lime-accent font-bold text-xs shadow-inner">
              OP
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#082218] ${
                  aiStatus.isLiveVerified ? 'bg-lime-accent shadow-xs' : 'bg-amber-400 shadow-xs'
                }`}
              ></span>
            </div>
            <span className={`material-symbols-outlined text-sage-pale/60 text-[16px] transition-transform duration-150 ${profileDropdownOpen ? 'rotate-180 text-lime-accent' : ''}`}>
              expand_more
            </span>
          </button>

          {profileDropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] glass-dropdown rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 shadow-2xl space-y-2.5"
            >
              {/* Profile Header */}
              <div className="border-b border-white/10 pb-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Operations Dispatcher</span>
                  <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-lime-accent/15 text-lime-accent border border-lime-accent/30">
                    Local Demo
                  </span>
                </div>
                <p className="text-[11px] text-sage-pale/70 font-mono mt-0.5">
                  Scope: {selectedDonorOrg.name}
                </p>
                <p className="text-[10px] text-sage-pale/50 mt-1">
                  Local demo profile &bull; Session data stored in browser
                </p>
              </div>

              {/* Menu Actions */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setReportModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[17px] text-lime-accent group-hover:scale-110 transition-transform">
                      insights
                    </span>
                    <span>Session Report &amp; Export</span>
                  </span>
                  <span className="material-symbols-outlined text-[15px] text-sage-pale/60">
                    chevron_right
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setActiveView('planner');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[17px] text-emerald-300 group-hover:scale-110 transition-transform">
                      psychology
                    </span>
                    <span>AI Dispatch Planner</span>
                  </span>
                  <span className="text-[10px] font-mono text-lime-accent font-bold">
                    {aiStatus.isLiveVerified ? 'Live AI' : 'Simulation'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    requestResetDemoData();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-950/40 flex items-center gap-2 transition-colors border border-transparent hover:border-red-500/20"
                >
                  <span className="material-symbols-outlined text-[17px] text-red-400">
                    restart_alt
                  </span>
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Operational Report & Session Summary Modal */}
      <OperationalReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </header>
  );
};
