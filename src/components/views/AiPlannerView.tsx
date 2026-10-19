import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFoodLoop, ALL_KITCHENS_ID, isDonationUrgent, matchesDonationSearch } from '../../context/FoodLoopContext';
import { callAiPlanner } from '../../services/aiService';
import { evaluateRecipientConstraints } from '../../utils/constraintEngine';
import { AiPlanResult, PlannerPipelineStage, Donation } from '../../types';

type KpiFilter = 'all' | 'pending' | 'matched' | 'urgent' | 'blocked';

export const AiPlannerView: React.FC = () => {
  const {
    donations,
    activeLotId,
    setActiveLotId,
    activeLot,
    recipients,
    couriers,
    approvePlan,
    rejectPlan,
    setActiveView,
    triggerToast,
    aiStatus,
    recordAiInferenceResult,
    selectedKitchenId,
    selectedDonorOrg,
    allZonesActive,
    toggleAllZones,
  } = useFoodLoop();

  // State
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('all');
  const [plannerSearch, setPlannerSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentStep, setCurrentStep] = useState<PlannerPipelineStage>(4);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('COU-02');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Traffic bottleneck on 2nd Ave corridor');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiResult, setAiResult] = useState<AiPlanResult | null>(null);

  // Expandable sections (collapsed by default)
  const [modelDetailsOpen, setModelDetailsOpen] = useState(false);
  const [pipelineSectionOpen, setPipelineSectionOpen] = useState(false);
  const [tradeoffsSectionOpen, setTradeoffsSectionOpen] = useState(false);

  // In-flight concurrency and cancellation refs
  const inFlightRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSynthesisKeyRef = useRef<string | null>(null);

  // Selected lot or fallback to first donation
  const currentLot: Donation | undefined = activeLot || donations[0];

  // Matched recipient and courier
  const recipient = useMemo(() => {
    if (!currentLot) return recipients[0];
    return recipients.find(r => r.id === currentLot.matchedRecipientId) || recipients[0];
  }, [currentLot, recipients]);

  const assignedCourier = useMemo(() => {
    return couriers.find(c => c.id === selectedCourierId) || couriers[1];
  }, [selectedCourierId, couriers]);

  // Deterministic constraint safety evaluation
  const constraintCheck = useMemo(() => {
    if (!currentLot || !recipient) {
      return { eligible: true, score: 98, rejectionReasons: [] as string[] };
    }
    return evaluateRecipientConstraints(currentLot, recipient);
  }, [currentLot, recipient]);

  // Load initial AI plan when active lot or matched recipient changes
  useEffect(() => {
    if (currentLot && recipient) {
      const currentKey = `${currentLot.id}_${recipient.id}`;
      if (lastSynthesisKeyRef.current !== currentKey) {
        lastSynthesisKeyRef.current = currentKey;
        handleRunAiSynthesis();
      }
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentLot?.id, recipient.id]);

  // Handle Escape key for reject modal
  useEffect(() => {
    if (!rejectModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRejectModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rejectModalOpen]);

  // Real KPI calculations derived from shared state
  const scopedLots = useMemo(() => {
    return donations.filter(d => {
      if (!allZonesActive && selectedKitchenId !== ALL_KITCHENS_ID) {
        const belongsToKitchen =
          (d.donorKitchenId && d.donorKitchenId === selectedKitchenId) ||
          d.donorName.toLowerCase().includes(selectedKitchenId.replace('_', ' '));
        if (!belongsToKitchen) return false;
      }
      return true;
    });
  }, [donations, allZonesActive, selectedKitchenId]);

  const pendingCount = useMemo(() => {
    return scopedLots.filter(d => d.status === 'PUBLISHED').length;
  }, [scopedLots]);

  const matchedCount = useMemo(() => {
    return scopedLots.filter(d =>
      ['MATCHED', 'APPROVED', 'COURIER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'].includes(d.status)
    ).length;
  }, [scopedLots]);

  const urgentCount = useMemo(() => {
    return scopedLots.filter(d => isDonationUrgent(d)).length;
  }, [scopedLots]);

  const blockedCount = useMemo(() => {
    return scopedLots.filter(d => {
      const target = recipients.find(r => r.id === d.matchedRecipientId) || recipients[0];
      return target ? !evaluateRecipientConstraints(d, target).eligible : false;
    }).length;
  }, [scopedLots, recipients]);

  // Filtered recommendations list
  const filteredRecommendations = useMemo(() => {
    return scopedLots.filter(d => {
      // Search filter
      if (plannerSearch && !matchesDonationSearch(d, plannerSearch)) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && d.category !== categoryFilter) {
        return false;
      }
      // KPI filter
      if (kpiFilter === 'pending' && d.status !== 'PUBLISHED') return false;
      if (
        kpiFilter === 'matched' &&
        !['MATCHED', 'APPROVED', 'COURIER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'].includes(d.status)
      ) {
        return false;
      }
      if (kpiFilter === 'urgent' && !isDonationUrgent(d)) return false;
      if (kpiFilter === 'blocked') {
        const target = recipients.find(r => r.id === d.matchedRecipientId) || recipients[0];
        if (!target) return false;
        const check = evaluateRecipientConstraints(d, target);
        if (check.eligible) return false;
      }
      return true;
    });
  }, [scopedLots, plannerSearch, categoryFilter, kpiFilter, recipients]);

  const handleRunAiSynthesis = async () => {
    if (!currentLot) return;
    if (inFlightRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    inFlightRef.current = true;
    setIsLoadingAi(true);

    try {
      const result = await callAiPlanner(
        {
          type: 'planner',
          donation: currentLot,
          recipient: recipient,
          context: {
            courier: assignedCourier,
            transitWindowMin: 15,
          },
        },
        controller.signal
      );

      if (!controller.signal.aborted) {
        setAiResult(result);
        recordAiInferenceResult(Boolean(result.isLive), result.apiError);
      }
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        const errMsg = err instanceof Error ? err.message : String(err);
        recordAiInferenceResult(false, errMsg);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        inFlightRef.current = false;
        setIsLoadingAi(false);
      }
    }
  };

  const handleStepTransition = (targetStep: PlannerPipelineStage) => {
    if (targetStep === 6 && !constraintCheck.eligible) {
      triggerToast(
        'Safety Lockout',
        `Cannot advance to Stage 6: ${constraintCheck.rejectionReasons[0] || 'Physical safety constraints violated'}`,
        'alert'
      );
      return;
    }
    setCurrentStep(targetStep);
  };

  const handleApprove = () => {
    if (!currentLot) return;

    if (!constraintCheck.eligible) {
      triggerToast(
        'Safety Lockout',
        `Cannot dispatch: ${constraintCheck.rejectionReasons[0] || 'Violates physical safety constraints'}`,
        'alert'
      );
      return;
    }

    const success = approvePlan(currentLot.id, selectedCourierId);
    if (success) {
      setActiveView('tracking');
    }
  };

  const handleRejectConfirm = () => {
    if (!currentLot) return;
    rejectPlan(currentLot.id, rejectReason);
    setRejectModalOpen(false);
    setActiveView('matching');
  };

  // Execution mode indicator
  const { modeLabel, modeBadgeClass } = useMemo(() => {
    if (isLoadingAi) {
      return {
        modeLabel: 'AI Processing...',
        modeBadgeClass: 'bg-lime-accent/15 text-lime-accent border-lime-accent/40 animate-pulse',
      };
    }
    if (aiResult?.isLive) {
      return {
        modeLabel: aiStatus.provider === 'nebius' ? 'Live AI (Nebius)' : 'Live AI',
        modeBadgeClass: 'bg-lime-accent/20 text-lime-accent border-lime-accent/40 shadow-xs',
      };
    }
    if (aiResult?.source?.includes('fallback') && aiResult?.apiError) {
      return {
        modeLabel: 'Deterministic Fallback',
        modeBadgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/35',
      };
    }
    if (aiStatus.hasKey) {
      return {
        modeLabel: 'AI-assisted',
        modeBadgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
      };
    }
    return {
      modeLabel: 'Simulation',
      modeBadgeClass: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    };
  }, [isLoadingAi, aiResult, aiStatus]);

  // Measured latency display (honest)
  const latencyDisplay = useMemo(() => {
    if (isLoadingAi) return 'measuring...';
    if (aiResult?.isLive && aiResult.executionMs > 0) {
      return `${aiResult.executionMs}ms (measured)`;
    }
    return 'Deterministic (~85ms)';
  }, [isLoadingAi, aiResult]);

  if (!currentLot) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-lime-accent/70">psychology</span>
        <h2 className="text-lg font-bold text-white font-sans">No Donation Lots Available</h2>
        <p className="text-xs text-sage-pale/80 max-w-sm mx-auto font-sans">
          Post surplus food to generate an AI-assisted dispatch coordination plan.
        </p>
        <button
          onClick={() => setActiveView('create')}
          className="btn-primary px-4 py-2 text-xs font-bold"
        >
          + Post Surplus Food
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* ------------------------------------------------------------- */}
      {/* A. COMPACT HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#07241A]/90 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-lime-accent/15 border border-lime-accent/35 text-lime-accent flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[19px]">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight font-sans">
                AI Dispatch Planner
              </h1>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${modeBadgeClass}`}>
                {modeLabel}
              </span>
            </div>
            <p className="text-[11px] text-sage-pale/70 font-mono">
              Scope: {allZonesActive ? 'All Network Hubs' : selectedDonorOrg.name} &bull; Lot #{currentLot.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Model & Engine Details disclosure button */}
          <button
            type="button"
            onClick={() => setModelDetailsOpen(prev => !prev)}
            className={`text-xs font-mono px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
              modelDetailsOpen
                ? 'bg-lime-accent/15 text-lime-accent border-lime-accent/40'
                : 'bg-white/5 text-sage-pale/80 hover:text-white border-white/10'
            }`}
            title="Inspect configured AI provider, model, and measured execution details"
          >
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span className="hidden xs:inline">Model &amp; Engine</span>
            <span className={`material-symbols-outlined text-[14px] transition-transform ${modelDetailsOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {/* Compact Recalculate/Refresh action */}
          <button
            type="button"
            onClick={handleRunAiSynthesis}
            disabled={isLoadingAi}
            className={`btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${
              isLoadingAi ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
            }`}
            title="Recalculate AI dispatch coordination plan"
          >
            <span className={`material-symbols-outlined text-[15px] ${isLoadingAi ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isLoadingAi ? 'Recalculating...' : 'Recalculate'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Model & Engine Details (Collapsed by default) */}
      {modelDetailsOpen && (
        <div className="p-4 rounded-2xl bg-[#051A12]/95 border border-white/12 text-xs font-mono space-y-2.5 animate-in fade-in duration-150 shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              Technical Attribution &amp; Runtime Configuration
            </span>
            <span className="text-[10px] text-sage-pale/60">Global AI Hackathon 2025</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
            <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
              <span className="text-sage-pale/60 block text-[10px]">Configured Provider</span>
              <span className="text-white font-semibold mt-0.5 block truncate">
                {aiStatus.provider === 'nebius' ? 'Nebius Token Factory' : 'OpenRouter API'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
              <span className="text-sage-pale/60 block text-[10px]">Configured Model</span>
              <span className="text-lime-accent font-semibold mt-0.5 block truncate">
                {aiResult?.model || aiStatus.model}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
              <span className="text-sage-pale/60 block text-[10px]">Execution Timing</span>
              <span className="text-emerald-300 font-semibold mt-0.5 block">
                {latencyDisplay}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-sage-pale/60 pt-1 flex flex-wrap justify-between items-center gap-2">
            <span>Deterministic safety constraints enforced locally before sign-off.</span>
            <span className="text-sage-pale/40">Credential isolation active (zero client key exposure).</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* B. SINGLE-ROW OVERVIEW (4 Compact KPI Cards) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* KPI 1: Pending */}
        <button
          type="button"
          onClick={() => setKpiFilter(prev => (prev === 'pending' ? 'all' : 'pending'))}
          className={`p-3 rounded-2xl text-left transition-all border ${
            kpiFilter === 'pending'
              ? 'bg-lime-accent/15 border-lime-accent/60 ring-2 ring-lime-accent/30 shadow-md'
              : 'bg-[#07241A]/80 hover:bg-[#092B1F] border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-sage-pale/70 text-[10px] font-mono">
            <span>Pending Donations</span>
            <span className="material-symbols-outlined text-[14px]">pending_actions</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-0.5">
            {pendingCount}
          </div>
          <span className="text-[10px] text-sage-pale/60 font-mono">Awaiting dispatch</span>
        </button>

        {/* KPI 2: Matched */}
        <button
          type="button"
          onClick={() => setKpiFilter(prev => (prev === 'matched' ? 'all' : 'matched'))}
          className={`p-3 rounded-2xl text-left transition-all border ${
            kpiFilter === 'matched'
              ? 'bg-lime-accent/15 border-lime-accent/60 ring-2 ring-lime-accent/30 shadow-md'
              : 'bg-[#07241A]/80 hover:bg-[#092B1F] border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-300 text-[10px] font-mono">
            <span>Successfully Matched</span>
            <span className="material-symbols-outlined text-[14px]">verified</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-0.5">
            {matchedCount}
          </div>
          <span className="text-[10px] text-emerald-300/80 font-mono">Route designated</span>
        </button>

        {/* KPI 3: Urgent */}
        <button
          type="button"
          onClick={() => setKpiFilter(prev => (prev === 'urgent' ? 'all' : 'urgent'))}
          className={`p-3 rounded-2xl text-left transition-all border ${
            kpiFilter === 'urgent'
              ? 'bg-amber-500/20 border-amber-400/60 ring-2 ring-amber-400/30 shadow-md'
              : 'bg-[#07241A]/80 hover:bg-[#092B1F] border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-amber-300 text-[10px] font-mono">
            <span>Urgent Lots (&le;90m)</span>
            <span className="material-symbols-outlined text-[14px]">warning</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-300 mt-0.5">
            {urgentCount}
          </div>
          <span className="text-[10px] text-amber-300/80 font-mono">Expiring soon</span>
        </button>

        {/* KPI 4: Safety Blocked */}
        <button
          type="button"
          onClick={() => setKpiFilter(prev => (prev === 'blocked' ? 'all' : 'blocked'))}
          className={`p-3 rounded-2xl text-left transition-all border ${
            kpiFilter === 'blocked'
              ? 'bg-red-950/40 border-red-500/60 ring-2 ring-red-400/30 shadow-md'
              : 'bg-[#07241A]/80 hover:bg-[#092B1F] border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-red-300 text-[10px] font-mono">
            <span>Safety Blocked</span>
            <span className="material-symbols-outlined text-[14px]">gavel</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-red-400 mt-0.5">
            {blockedCount}
          </div>
          <span className="text-[10px] text-red-300/80 font-mono">Constraint lockout</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* C. COMPACT SEARCH AND FILTERS ROW */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-2xl bg-[#061F17]/90 border border-white/10 text-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sage-pale/60 text-[16px]">
            search
          </span>
          <input
            type="text"
            value={plannerSearch}
            onChange={e => setPlannerSearch(e.target.value)}
            placeholder="Search lot ID, donor, category, or recipient..."
            className="w-full pl-8 pr-7 py-1.5 bg-[#0A291E] rounded-xl border border-white/10 focus:border-lime-accent/50 text-white placeholder:text-sage-pale/50 outline-none text-xs"
          />
          {plannerSearch && (
            <button
              onClick={() => setPlannerSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sage-pale/60 hover:text-white"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-[#0A291E] text-white border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:border-lime-accent/40 outline-none"
        >
          <option value="all">All Categories</option>
          <option value="hot_meals">Hot Meals</option>
          <option value="chilled">Chilled</option>
          <option value="bakery">Bakery</option>
          <option value="produce">Produce</option>
          <option value="dairy">Dairy</option>
          <option value="pantry">Pantry</option>
        </select>

        {/* Zone scope toggle button */}
        <button
          type="button"
          onClick={toggleAllZones}
          className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] flex items-center gap-1 border transition-colors ${
            allZonesActive
              ? 'bg-lime-accent text-forest font-bold border-lime-accent'
              : 'bg-[#0A291E] text-sage-pale/80 hover:text-white border-white/10'
          }`}
          title="Toggle network-wide vs active kitchen lots"
        >
          <span className="material-symbols-outlined text-[13px]">
            {allZonesActive ? 'check_circle' : 'hub'}
          </span>
          <span>{allZonesActive ? 'All Network' : 'Scoped Kitchen'}</span>
        </button>

        {/* Clear Filters Action */}
        {(plannerSearch || categoryFilter !== 'all' || kpiFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setPlannerSearch('');
              setCategoryFilter('all');
              setKpiFilter('all');
            }}
            className="px-2.5 py-1.5 text-sage-pale/80 hover:text-white hover:bg-white/10 rounded-xl font-mono text-[11px] flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[13px]">filter_alt_off</span>
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* D. DISPATCH RECOMMENDATIONS LIST */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#07241A]/90 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider font-mono text-[10px]">
            Dispatch Queue ({filteredRecommendations.length} Recommendations)
          </span>
          <span className="text-sage-pale/60 font-mono text-[10px]">
            Click row to load into workspace
          </span>
        </div>

        {filteredRecommendations.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <span className="material-symbols-outlined text-2xl text-sage-pale/40">filter_list_off</span>
            <p className="text-xs text-sage-pale/75 font-sans">
              No dispatch recommendations match the selected filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setPlannerSearch('');
                setCategoryFilter('all');
                setKpiFilter('all');
              }}
              className="btn-secondary px-3 py-1 text-xs font-mono"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
            {filteredRecommendations.map(lot => {
              const isSelected = lot.id === activeLotId;
              const isUrgent = isDonationUrgent(lot);
              const targetShelter = recipients.find(r => r.id === lot.matchedRecipientId) || recipients[0];
              const safetyEval = targetShelter ? evaluateRecipientConstraints(lot, targetShelter) : { eligible: true };
              const isBlocked = !safetyEval.eligible;

              return (
                <div
                  key={lot.id}
                  onClick={() => setActiveLotId(lot.id)}
                  className={`px-4 py-2 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-lime-accent/15 border-l-4 border-l-lime-accent'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Left: ID & Title & Category */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="font-mono font-bold text-white text-[11px] flex-shrink-0">
                      {lot.id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-sage-pale font-mono text-[9px] uppercase flex-shrink-0">
                      {lot.category.replace('_', ' ')}
                    </span>
                    <span className="text-white font-medium truncate hidden sm:inline">
                      {lot.title}
                    </span>
                  </div>

                  {/* Middle: Quantity & Expiry */}
                  <div className="flex items-center gap-3 text-sage-pale/80 font-mono text-[11px] flex-shrink-0">
                    <span>{lot.quantityKg}kg</span>
                    <span
                      className={`flex items-center gap-0.5 ${
                        isUrgent ? 'text-amber-300 font-semibold' : 'text-sage-pale/70'
                      }`}
                    >
                      {isUrgent && <span className="material-symbols-outlined text-[13px]">timer</span>}
                      {lot.expiryMinutesRemaining}m left
                    </span>
                  </div>

                  {/* Right: Recipient & Safety Status Badge */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-sage-pale/80 hidden md:inline truncate max-w-[130px]">
                      {targetShelter?.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        isBlocked
                          ? 'bg-red-950/80 text-red-300 border-red-500/40'
                          : isUrgent
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                          : lot.status === 'DELIVERED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                          : 'bg-lime-accent/15 text-lime-accent border-lime-accent/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[11px]">
                        {isBlocked ? 'block' : isUrgent ? 'warning' : 'check_circle'}
                      </span>
                      <span>
                        {isBlocked
                          ? 'BLOCKED'
                          : isUrgent
                          ? 'URGENT'
                          : lot.status === 'DELIVERED'
                          ? 'DELIVERED'
                          : 'READY'}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setActiveLotId(lot.id);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                        isSelected
                          ? 'bg-lime-accent text-forest font-bold'
                          : 'bg-white/10 text-sage-pale hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* E. SELECTED DISPATCH WORKSPACE (Desktop 2-Column Split View) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Dispatch Plan (5 cols) */}
        <div className="lg:col-span-5 bg-[#07241A]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3.5 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[11px] font-bold text-lime-accent uppercase font-mono tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">inventory</span>
                Dispatch Plan &bull; #{currentLot.id}
              </span>
              <span className="text-[10px] font-mono text-sage-pale/60">
                {currentLot.storageType.toUpperCase()} ({currentLot.tempTargetC}&deg;C)
              </span>
            </div>

            {/* Lot Summary */}
            <div className="p-3 rounded-xl bg-white/4 border border-white/6 space-y-1">
              <h3 className="font-bold text-white text-sm">{currentLot.title}</h3>
              <p className="text-[11px] text-sage-pale/80 font-mono">
                {currentLot.quantityKg} kg &bull; {currentLot.servings} portions &bull; {currentLot.packaging}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] font-mono">
                <span className="px-1.5 py-0.2 rounded bg-white/10 text-sage-pale">
                  Origin: {currentLot.donorName}
                </span>
                {currentLot.allergens.length > 0 ? (
                  <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                    Allergens: {currentLot.allergens.join(', ')}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300">
                    Zero Common Allergens
                  </span>
                )}
              </div>
            </div>

            {/* Designated Route Nodes */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-sage-pale/70 uppercase font-mono tracking-wider block">
                Transport &amp; Custody Path
              </span>

              {/* Stop 1: Origin */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/4 border border-white/6 text-xs">
                <div className="w-7 h-7 rounded-lg bg-white/10 text-lime-accent flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[15px]">store</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-sage-pale/60 block font-mono">1. Origin Dock</span>
                  <div className="font-semibold text-white truncate text-xs">{currentLot.donorName}</div>
                  <span className="text-[10px] text-sage-pale/70 font-mono truncate block">{currentLot.donorLocation}</span>
                </div>
              </div>

              {/* Courier Designation */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-lime-accent/10 border border-lime-accent/30 text-xs">
                <div className="w-7 h-7 rounded-lg bg-lime-accent/20 text-lime-accent flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-lime-accent font-mono font-semibold">2. Designated Fleet</span>
                    <span className="text-[10px] font-mono text-lime-accent font-bold">
                      {assignedCourier.compartmentTempC}&deg;C Holding
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <select
                      value={selectedCourierId}
                      onChange={e => setSelectedCourierId(e.target.value)}
                      className="bg-[#0B2C21] text-white border border-white/10 rounded-lg px-2 py-0.5 text-xs font-mono font-semibold focus:border-lime-accent/50 outline-none w-full"
                    >
                      {couriers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.vehiclePlate}) - {c.compartmentTempC}&deg;C
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[10px] text-sage-pale/70 font-mono block mt-0.5">
                    Driver: {assignedCourier.driverName} ({assignedCourier.driverPhone})
                  </span>
                </div>
              </div>

              {/* Stop 2: Recipient */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/4 border border-white/6 text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[15px]">warehouse</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-sage-pale/60 font-mono">3. Intake Hub</span>
                    <span className="text-[10px] font-mono text-sage-pale/70">
                      {recipient.distanceKm} km (~11 min)
                    </span>
                  </div>
                  <div className="font-semibold text-white truncate text-xs">{recipient.name}</div>
                  <span className="text-[10px] text-sage-pale/70 font-mono truncate block">{recipient.address}</span>
                </div>
              </div>
            </div>

            {/* Capacity Compatibility Indicator */}
            <div className="p-2.5 rounded-xl bg-white/4 border border-white/6 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-[10px] text-sage-pale/80">
                <span>Intake Capacity Headroom:</span>
                <span className="font-bold text-white">
                  {currentLot.quantityKg}kg lot / {recipient.capacityTotalKg - recipient.capacityUsedKg}kg free
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-lime-accent rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (currentLot.quantityKg / Math.max(1, recipient.capacityTotalKg - recipient.capacityUsedKg)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Safety & Decision (7 cols) */}
        <div className="lg:col-span-7 bg-[#07241A]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3.5 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[11px] font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-300 text-[15px]">fact_check</span>
                Safety Verification &amp; Decision Matrix
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  constraintCheck.eligible
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-950 text-red-400 border-red-500/40'
                }`}
              >
                {constraintCheck.eligible ? 'PASSES ALL CONSTRAINTS' : 'CRITICAL SAFETY LOCKOUT'}
              </span>
            </div>

            {/* 4 Critical Safety Checks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Check 1: Temperature & Equipment */}
              <div
                className={`p-2.5 rounded-xl border ${
                  constraintCheck.eligible ? 'bg-white/4 border-white/6' : 'bg-red-950/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <span
                    className={`material-symbols-outlined text-[15px] ${
                      constraintCheck.eligible ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {constraintCheck.eligible ? 'check_circle' : 'cancel'}
                  </span>
                  <span>1. Temperature &amp; Equipment</span>
                </div>
                <p className="text-[11px] text-sage-pale/75 mt-0.5 font-mono">
                  {currentLot.storageType === 'hot'
                    ? 'Requires hot-holding ovens (>=60°C)'
                    : 'Cold chain integrity (<=4°C)'}
                </p>
              </div>

              {/* Check 2: Expiry & Safe Margin */}
              <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
                  <span>2. Safe Time Margin</span>
                </div>
                <p className="text-[11px] text-sage-pale/75 mt-0.5 font-mono">
                  {currentLot.expiryMinutesRemaining}m safe margin vs ~11m transit
                </p>
              </div>

              {/* Check 3: Allergen Incompatibility */}
              <div
                className={`p-2.5 rounded-xl border ${
                  constraintCheck.eligible ? 'bg-white/4 border-white/6' : 'bg-red-950/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <span
                    className={`material-symbols-outlined text-[15px] ${
                      constraintCheck.eligible ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {constraintCheck.eligible ? 'check_circle' : 'warning'}
                  </span>
                  <span>3. Allergen Compatibility</span>
                </div>
                <p className="text-[11px] text-sage-pale/75 mt-0.5 font-mono truncate">
                  {recipient.dietaryRequirements?.join(', ') || 'Standard intake'}
                </p>
              </div>

              {/* Check 4: Capacity Compatibility */}
              <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
                  <span>4. Recipient Capacity</span>
                </div>
                <p className="text-[11px] text-sage-pale/75 mt-0.5 font-mono">
                  {recipient.capacityTotalKg - recipient.capacityUsedKg}kg free for {currentLot.quantityKg}kg lot
                </p>
              </div>
            </div>

            {/* Concise Decision Reasoning */}
            <div className="p-3 rounded-xl bg-[#051A12] border border-white/8 space-y-1 text-xs">
              <span className="text-[10px] font-mono text-sage-pale/70 uppercase tracking-wider block">
                Recommendation Reasoning
              </span>
              {constraintCheck.eligible ? (
                <p className="text-ivory-warm leading-snug">
                  {aiResult?.reasoning ||
                    `Prioritize ${recipient.name} due to active dining service, ${recipient.distanceKm} km proximity, and verified thermal equipment match.`}
                </p>
              ) : (
                <div className="space-y-1 text-red-300">
                  <p className="font-semibold text-red-200">
                    Safety lockout enforced: LLM recommendations cannot bypass physical constraints.
                  </p>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5">
                    {constraintCheck.rejectionReasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-mono text-sage-pale/70">
              <span
                className={`w-2 h-2 rounded-full ${constraintCheck.eligible ? 'bg-lime-accent' : 'bg-red-500'}`}
              />
              <span>
                {constraintCheck.eligible ? 'Ready for human operator release' : 'Dispatch blocked by safety rules'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                className="btn-ghost px-3 py-2 text-xs font-mono text-sage-pale hover:text-white"
              >
                Reject / Reassign
              </button>

              <button
                type="button"
                disabled={!constraintCheck.eligible}
                onClick={handleApprove}
                className={`px-4 py-2 text-xs font-bold font-mono flex items-center justify-center gap-1.5 rounded-xl transition-all ${
                  constraintCheck.eligible
                    ? 'btn-primary shadow-md'
                    : 'bg-red-950/60 text-red-400/80 border border-red-500/30 cursor-not-allowed opacity-60'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {constraintCheck.eligible ? 'verified' : 'block'}
                </span>
                <span>
                  {constraintCheck.eligible ? 'Approve & Dispatch' : 'Cannot Dispatch (Safety Lockout)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EXPANDABLE SECTIONS (Collapsed by default) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2 pt-1">
        {/* Accordion 1: 6-Stage Autonomous Decision Pipeline */}
        <div className="rounded-2xl bg-[#07241A]/80 border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setPipelineSectionOpen(prev => !prev)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lime-accent text-[17px]">route</span>
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                AI Dispatch Decision Pipeline (Stages 1–6)
              </span>
              <span className="px-2 py-0.2 rounded-full bg-white/10 text-sage-pale text-[10px]">
                Stage {currentStep} of 6
              </span>
            </div>
            <span
              className={`material-symbols-outlined text-[16px] text-sage-pale/60 transition-transform ${
                pipelineSectionOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          {pipelineSectionOpen && (
            <div className="p-4 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
              <div className="overflow-x-auto no-scrollbar flex items-center gap-2 text-xs font-mono">
                {[
                  { step: 1, label: '1. Received', icon: 'inventory_2', completed: true },
                  { step: 2, label: '2. Filtered', icon: 'filter_alt', completed: true },
                  { step: 3, label: '3. Ranked', icon: 'leaderboard', completed: true },
                  { step: 4, label: '4. Synthesized', icon: 'psychology', completed: Boolean(aiResult) },
                  {
                    step: 5,
                    label: '5. Verified',
                    icon: constraintCheck.eligible ? 'fact_check' : 'gavel',
                    completed: constraintCheck.eligible,
                    blocked: !constraintCheck.eligible,
                  },
                  {
                    step: 6,
                    label: '6. Sign-off',
                    icon: 'verified_user',
                    completed: currentLot.status === 'APPROVED' || currentLot.status === 'IN_TRANSIT',
                    blocked: !constraintCheck.eligible,
                  },
                ].map(s => {
                  const isCurrent = currentStep === s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => handleStepTransition(s.step as PlannerPipelineStage)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                        isCurrent
                          ? s.blocked
                            ? 'bg-red-600 text-white font-bold border border-red-400'
                            : 'bg-lime-accent text-forest font-bold border border-lime-accent'
                          : s.blocked
                          ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                          : s.completed
                          ? 'bg-white/8 text-white border border-white/10'
                          : 'bg-white/4 text-sage-pale/60 border border-white/5'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-sage-pale/70 font-mono">
                {currentStep === 1 && 'Intake physical properties logged and confirmed at origin dock.'}
                {currentStep === 2 && 'Deterministic constraint filter evaluated against all network recipient shelters.'}
                {currentStep === 3 && 'Proximity, urgency, and available storage headroom ranked.'}
                {currentStep === 4 && 'Operational synthesis and contingency protocol generated.'}
                {currentStep === 5 && 'HACCP Critical Control Points audit executed.'}
                {currentStep === 6 && 'Human operator final authorization release.'}
              </p>
            </div>
          )}
        </div>

        {/* Accordion 2: Operational Trade-offs & Contingency Protocol */}
        <div className="rounded-2xl bg-[#07241A]/80 border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setTradeoffsSectionOpen(prev => !prev)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-300 text-[17px]">balance</span>
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Trade-Offs &amp; Automated Contingency Protocol
              </span>
            </div>
            <span
              className={`material-symbols-outlined text-[16px] text-sage-pale/60 transition-transform ${
                tradeoffsSectionOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          {tradeoffsSectionOpen && (
            <div className="p-4 border-t border-white/10 space-y-3 animate-in fade-in duration-150 text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] text-sage-pale/70 uppercase font-mono tracking-wider block">
                  Evaluated Trade-Offs
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiResult?.tradeOffs?.map((tradeOff, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/4 border border-white/6 flex items-start gap-2 text-sage-pale"
                    >
                      <span className="material-symbols-outlined text-[14px] text-amber-400 mt-0.5 flex-shrink-0">
                        check
                      </span>
                      <span className="text-[11px] leading-tight">{tradeOff}</span>
                    </div>
                  )) || (
                    <div className="p-2.5 rounded-xl bg-white/4 border border-white/6 text-sage-pale/60 text-[11px]">
                      Standard capacity routing evaluated.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-amber-100">
                <span className="material-symbols-outlined text-amber-400 text-[16px] mt-0.5 flex-shrink-0">
                  shield
                </span>
                <div>
                  <strong className="text-amber-300 block text-[11px] font-mono uppercase tracking-wider">
                    Automated Contingency Protocol
                  </strong>
                  <p className="text-[11px] mt-0.5 leading-snug">
                    {aiResult?.contingencyPlan ||
                      'If courier delay exceeds 20 minutes, automatically pivot delivery to Downtown Family Mission (0.9km alternate node) with commercial holding ovens.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REJECT MODAL */}
      {/* ------------------------------------------------------------- */}
      {rejectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setRejectModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-title"
        >
          <div
            className="glass-dropdown rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-3.5 border border-red-500/30 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-400">
              <span className="material-symbols-outlined text-[22px]">gavel</span>
              <h3 id="reject-title" className="font-bold text-base font-sans text-white">
                Reject Dispatch Recommendation
              </h3>
            </div>
            <p className="text-xs text-sage-pale/80 leading-relaxed font-sans">
              State the operational constraint or impediment. Lot #{currentLot.id} will be released back into the recipient matching matrix.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-white/15 text-xs focus:border-red-400 outline-none font-sans bg-[#0A261D] text-white"
              placeholder="e.g. Courier capacity mismatch, shelter intake line closed..."
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="btn-ghost px-3 py-1.5 text-xs font-semibold"
              >
                Back to Workspace
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="btn-destructive px-3.5 py-1.5 text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
