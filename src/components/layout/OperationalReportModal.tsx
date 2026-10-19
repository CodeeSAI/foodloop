import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFoodLoop } from '../../context/FoodLoopContext';
import { evaluateRecipientConstraints } from '../../utils/constraintEngine';

interface OperationalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperationalReportModal: React.FC<OperationalReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    donations,
    recipients,
    selectedDonorOrg,
    selectedKitchenId,
    allZonesActive,
    aiStatus,
    requestResetDemoData,
  } = useFoodLoop();

  // Focus management refs
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Local preferences that genuinely affect UI or session
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>(() => {
    return (localStorage.getItem('foodloop_pref_temp_unit') as 'C' | 'F') || 'C';
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('foodloop_pref_contrast') === 'true';
  });

  const handleTempUnitToggle = () => {
    const next = tempUnit === 'C' ? 'F' : 'C';
    setTempUnit(next);
    localStorage.setItem('foodloop_pref_temp_unit', next);
  };

  const handleContrastToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('foodloop_pref_contrast', String(next));
    document.documentElement.classList.toggle('high-contrast-mode', next);
  };

  // Prevent background scrolling while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus trapping and keyboard management
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Focus close button on open
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key and Tab focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real application-state calculations
  const totalDonations = donations.length;
  const activeLots = donations.filter(d => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
  const matchedLots = donations.filter(d =>
    ['MATCHED', 'APPROVED', 'COURIER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(d.status)
  );
  const deliveredLots = donations.filter(d => d.status === 'DELIVERED');

  // Real safety blocked lots: evaluate against matched recipient or fallback
  const blockedLots = donations.filter(d => {
    const targetRecipient = recipients.find(r => r.id === d.matchedRecipientId) || recipients[0];
    if (!targetRecipient) return false;
    const check = evaluateRecipientConstraints(d, targetRecipient);
    return !check.eligible;
  });

  const totalDeliveredKg = deliveredLots.reduce((acc, d) => acc + d.quantityKg, 0);
  const totalInFlightKg = matchedLots.reduce((acc, d) => acc + d.quantityKg, 0);
  const totalActiveKg = activeLots.reduce((acc, d) => acc + d.quantityKg, 0);

  // Illustrative estimates clearly labeled
  const illustrativeDeliveredMeals = Math.round(totalDeliveredKg * 2.2);
  const illustrativeCo2OffsetKg = Number((totalDeliveredKg * 2.5).toFixed(1));

  // Genuine Real Export Handler (JSON)
  const handleExportJson = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      platform: 'FOODLOOP Autonomous Food Rescue Platform',
      environment: 'Local Demo Session (Browser Storage)',
      scope: allZonesActive ? 'All Regional Kitchens' : selectedDonorOrg.name,
      executionMode: aiStatus.isLiveVerified ? 'Live AI' : 'Deterministic Simulation',
      metrics: {
        totalLots: totalDonations,
        activeLotsCount: activeLots.length,
        matchedLotsCount: matchedLots.length,
        deliveredLotsCount: deliveredLots.length,
        safetyBlockedLotsCount: blockedLots.length,
        totalDeliveredKg,
        totalActiveKg,
      },
      illustrativeEstimates: {
        estimatedMealsDelivered: illustrativeDeliveredMeals,
        estimatedCo2OffsetKg: illustrativeCo2OffsetKg,
        disclaimer:
          'Illustrative demo extrapolation based on standard 0.45kg/meal and 2.5kg CO2e/kg food waste benchmarks.',
      },
      lots: donations.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        donorKitchen: d.donorName,
        quantityKg: d.quantityKg,
        servings: d.servings,
        status: d.status,
        matchedRecipientId: d.matchedRecipientId || 'None',
        expiryMinutesRemaining: d.expiryMinutesRemaining,
        storageType: d.storageType,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodloop-operations-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Genuine Real Export Handler (CSV)
  const handleExportCsv = () => {
    const headers = [
      'Lot ID',
      'Food Title',
      'Category',
      'Donor Kitchen',
      'Weight (kg)',
      'Servings',
      'Storage Type',
      'Safe Margin (min)',
      'Status',
      'Matched Recipient ID',
    ];

    const rows = donations.map(d => [
      `"${d.id}"`,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.category}"`,
      `"${d.donorName.replace(/"/g, '""')}"`,
      d.quantityKg,
      d.servings,
      `"${d.storageType}"`,
      d.expiryMinutesRemaining,
      `"${d.status}"`,
      `"${d.matchedRecipientId || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodloop-lots-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#061D15] rounded-2xl w-full max-w-[800px] max-h-[calc(100dvh-32px)] flex flex-col border border-[#1E4D3B] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-150 overflow-hidden text-[#F5F5EC]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — Pinned at top, completely opaque */}
        <div className="flex-shrink-0 px-6 py-4.5 border-b border-[#1E4D3B] bg-[#061D15] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F382B] border border-[#235843] text-lime-accent flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">insights</span>
            </div>
            <div>
              <h2
                id="report-modal-title"
                className="text-lg font-bold text-white font-sans tracking-tight"
              >
                Operations Profile &amp; Session Report
              </h2>
              <p className="text-xs text-[#9EB3A2] font-mono mt-0.5">
                Local Demo Session &bull; Verified application state
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#9EB3A2] hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-accent"
            aria-label="Close operational report modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body — Scrollable, solid surfaces */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-[#061D15]">
          {/* Operations Dispatcher Profile Bar */}
          <div className="p-3.5 rounded-xl bg-[#0A271D] border border-[#174333] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F382B] border border-lime-accent/40 text-lime-accent font-bold flex items-center justify-center text-xs">
                OP
              </div>
              <div>
                <div className="font-bold text-white text-sm">Operations Dispatcher</div>
                <div className="text-[#9EB3A2] font-mono text-[11px]">
                  Scope: {selectedDonorOrg.name} ({selectedKitchenId})
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#0F382B] text-lime-accent border border-[#28634D] font-mono text-[10px] font-bold self-start sm:self-auto">
              {aiStatus.isLiveVerified ? 'Live AI Verified' : 'Deterministic Simulation'}
            </span>
          </div>

          {/* Section 1: Four Summary Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#9EB3A2] uppercase font-mono tracking-wider">
                Application State (Verified Lots)
              </span>
              <span className="text-[10px] font-mono text-[#7D9682]">Live shared state</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0A271D] border border-[#174333] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-[#9EB3A2] font-mono block">Total Lots</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">
                  {totalDonations}
                </span>
                <span className="text-[10px] text-[#7D9682] font-mono mt-0.5">
                  {totalActiveKg} kg recorded
                </span>
              </div>
              <div className="bg-[#0A271D] border border-[#174333] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-emerald-300 font-mono block">Matched / In-Flight</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">
                  {matchedLots.length}
                </span>
                <span className="text-[10px] text-emerald-300 font-mono mt-0.5">
                  {totalInFlightKg} kg committed
                </span>
              </div>
              <div className="bg-[#0A271D] border border-[#174333] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-lime-accent font-mono block">Delivered Lots</span>
                <span className="text-2xl font-bold font-mono text-lime-accent mt-1 block">
                  {deliveredLots.length}
                </span>
                <span className="text-[10px] text-lime-accent/80 font-mono mt-0.5">
                  {totalDeliveredKg} kg handoff
                </span>
              </div>
              <div className="bg-[#0A271D] border border-red-500/30 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-red-300 font-mono block">Safety Blocked</span>
                <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
                  {blockedLots.length}
                </span>
                <span className="text-[10px] text-red-300/80 font-mono mt-0.5">HACCP Guarded</span>
              </div>
            </div>
          </div>

          {/* Section 2: Clearly Labeled Illustrative Impact Section */}
          <div className="p-4 rounded-xl bg-[#0A271D] border border-[#174333] space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#143B2D] pb-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-400">
                  wb_incandescent
                </span>
                Illustrative Demo Impact Estimates
              </span>
              <span className="text-[10px] font-mono text-amber-200/70">
                Extrapolated from delivered volume
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#061D15] border border-[#143B2D]">
                <span className="text-[#9EB3A2] block text-[11px] font-mono">
                  Meal Equivalents (Delivered Food)
                </span>
                <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                  ~{illustrativeDeliveredMeals} meals
                </span>
                <p className="text-[10px] text-[#7D9682] mt-1 font-mono">
                  Calculated at 0.45 kg / portion benchmark
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#061D15] border border-[#143B2D]">
                <span className="text-[#9EB3A2] block text-[11px] font-mono">
                  Emissions Prevented (Estimated)
                </span>
                <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                  ~{illustrativeCo2OffsetKg} kg CO&#8322;e
                </span>
                <p className="text-[10px] text-[#7D9682] mt-1 font-mono">
                  Calculated at 2.5 kg CO&#8322;e / kg food surplus
                </p>
              </div>
            </div>
            <p className="text-[10px] text-[#7D9682] font-mono leading-relaxed pt-0.5">
              Note: Impact metrics represent illustrative demonstration estimates based on standard
              sustainability benchmarks. Distinct from verified local state.
            </p>
          </div>

          {/* Section 3: Session Preferences */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#9EB3A2] uppercase font-mono tracking-wider">
              Session Preferences
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A271D] border border-[#174333]">
                <div>
                  <span className="text-xs font-semibold text-white block">Temperature Scale</span>
                  <span className="text-[10px] text-[#7D9682] font-mono">Active telemetry unit</span>
                </div>
                <button
                  type="button"
                  onClick={handleTempUnitToggle}
                  className="px-3 py-1 rounded-lg bg-[#0F382B] hover:bg-[#154738] text-lime-accent border border-lime-accent/40 font-mono text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-accent"
                >
                  &deg;{tempUnit} (Toggle)
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A271D] border border-[#174333]">
                <div>
                  <span className="text-xs font-semibold text-white block">High Contrast</span>
                  <span className="text-[10px] text-[#7D9682] font-mono">High-contrast borders</span>
                </div>
                <button
                  type="button"
                  onClick={handleContrastToggle}
                  className={`px-3 py-1 rounded-lg font-mono text-xs font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-lime-accent ${
                    highContrast
                      ? 'bg-lime-accent text-forest border-lime-accent shadow-xs'
                      : 'bg-[#0F382B] text-[#9EB3A2] border-white/15 hover:text-white'
                  }`}
                >
                  {highContrast ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — Pinned at bottom, completely opaque */}
        <div className="flex-shrink-0 px-6 py-3.5 border-t border-[#1E4D3B] bg-[#051811] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportJson}
              className="btn-secondary px-3 py-1.5 text-xs font-bold font-mono flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
              title="Download real JSON operations report"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-secondary px-3 py-1.5 text-xs font-bold font-mono flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
              title="Download real CSV lots dataset"
            >
              <span className="material-symbols-outlined text-[15px]">table_view</span>
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                requestResetDemoData();
              }}
              className="btn-ghost px-3 py-1.5 text-xs font-mono text-red-300 hover:text-red-200 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              <span>Reset Demo State</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary px-4 py-1.5 text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
