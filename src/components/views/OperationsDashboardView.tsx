import React, { useState } from 'react';
import { useFoodLoop, isDonationUrgent, matchesDonationSearch } from '../../context/FoodLoopContext';

export const OperationsDashboardView: React.FC = () => {
  const {
    donations,
    recipients,
    searchQuery,
    setSearchQuery,
    allZonesActive,
    toggleAllZones,
    isUrgentOnly,
    toggleUrgentOnly,
    clearAllFilters,
    setActiveView,
    setActiveLotId,
    aiStatus,
    selectedKitchenId,
    selectedDonorOrg,
  } = useFoodLoop();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedLots, setExpandedLots] = useState<Record<string, boolean>>({});
  const [expandedShelters, setExpandedShelters] = useState<Record<string, boolean>>({});

  const toggleLotDetails = (lotId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedLots(prev => ({ ...prev, [lotId]: !prev[lotId] }));
  };

  const toggleShelterDetails = (shelterId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedShelters(prev => ({ ...prev, [shelterId]: !prev[shelterId] }));
  };

  // 1. Kitchen / Zone Scope Resolution
  // When allZonesActive or selectedKitchenId === 'all', all donations network-wide are included.
  // Otherwise, filter strictly by donorKitchenId (or fallback matching donorName).
  const isNetworkScope = allZonesActive || selectedKitchenId === 'all';
  const baseScopedDonations = donations.filter(d => {
    if (isNetworkScope) return true;
    if (d.donorKitchenId) return d.donorKitchenId === selectedKitchenId;
    return d.donorName.toLowerCase().includes(selectedKitchenId.replace('_', ' '));
  });

  // 2. Metrics derived strictly from the current operational scope
  const deliveredLots = baseScopedDonations.filter(d => d.status === 'DELIVERED');
  const deliveredKg = deliveredLots.reduce((acc, d) => acc + d.quantityKg, 0);
  const deliveredMeals = deliveredLots.reduce((acc, d) => acc + d.servings, 0);
  const co2eTons = (deliveredKg * 0.0022).toFixed(2);

  const activeBatches = baseScopedDonations.filter(d => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
  const movingLots = baseScopedDonations.filter(d => d.status === 'IN_TRANSIT');
  const movingKg = movingLots.reduce((acc, d) => acc + d.quantityKg, 0);
  const urgentBatches = baseScopedDonations.filter(isDonationUrgent);
  const pendingApprovals = baseScopedDonations.filter(d => d.status === 'MATCHED' || d.status === 'PUBLISHED');

  // 3. Composed Filter Pipeline:
  // Combines Zone Scope -> Urgency filter -> Category filter -> Search Query
  const filteredDonations = baseScopedDonations.filter(d => {
    if (isUrgentOnly && !isDonationUrgent(d)) return false;
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    return matchesDonationSearch(d, searchQuery);
  });

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    isUrgentOnly ||
    categoryFilter !== 'all' ||
    (allZonesActive && selectedKitchenId !== 'all')
  );

  const handleRowAction = (donationId: string, status: string) => {
    setActiveLotId(donationId);
    if (status === 'PUBLISHED') {
      setActiveView('matching');
    } else if (status === 'MATCHED') {
      setActiveView('planner');
    } else {
      setActiveView('tracking');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Compact Header & Welcome Hero with Frosted Glass & Ambient Mesh */}
      <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 text-ivory-warm relative overflow-hidden">
        {/* Soft radial glow elements */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full bg-emerald-accent/15 blur-3xl"
        />
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute right-1/4 -bottom-16 w-64 h-64 rounded-full bg-lime-accent/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full border text-tech-label flex items-center gap-1.5 shadow-xs ${
                aiStatus.isLiveVerified
                  ? 'bg-lime-accent/20 border-lime-accent/40 text-lime-accent'
                  : 'bg-amber-400/20 border-amber-400/35 text-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${aiStatus.isLiveVerified ? 'bg-lime-accent animate-pulse' : 'bg-amber-400'}`}></span>
                {aiStatus.isLiveVerified
                  ? `LIVE NEMOTRON (${aiStatus.provider === 'nebius' ? 'Nebius' : 'OpenRouter'}) • ${aiStatus.model}`
                  : 'DETERMINISTIC SIMULATION'}
              </span>
              <span className="text-tech-data text-sage-pale/80 font-mono text-xs">
                {aiStatus.isLiveVerified
                  ? 'Live Inference Verified'
                  : `Deterministic Safety Guardrails (${aiStatus.provider === 'nebius' ? 'Nebius' : 'OpenRouter'})`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Operations Command Center
            </h1>
            <p className="text-xs sm:text-sm text-sage-pale/90 leading-relaxed font-sans">
              AI-assisted logistics coordinator for surplus food rescue. Coordinating <strong className="text-white font-mono">{activeBatches.length}</strong> active batches across participating regional recipient kitchens and shelters.
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-tech-label text-sage-pale/70 font-normal">Active Operations Scope:</span>
              <span className="text-tech-label text-lime-accent bg-lime-accent/15 px-2.5 py-0.5 rounded-lg border border-lime-accent/30 font-bold flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-[14px]">
                  {isNetworkScope ? 'hub' : 'restaurant'}
                </span>
                {isNetworkScope ? 'All Regional Hubs (Network-Wide)' : selectedDonorOrg.name} {!isNetworkScope && `\u2022 ${selectedDonorOrg.sub}`}
              </span>
              <button
                type="button"
                onClick={toggleAllZones}
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md border transition-all ${
                  allZonesActive
                    ? 'bg-lime-accent text-forest border-lime-accent font-bold shadow-xs'
                    : 'bg-white/10 text-sage-pale border-white/10 hover:text-white'
                }`}
                title="Toggle between active kitchen and network-wide view"
              >
                {allZonesActive ? '✓ All Zones Active' : 'Switch to All Zones'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            <button
              onClick={() => setActiveView('planner')}
              className="btn-primary px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">psychology</span>
              <span>Open AI Planner</span>
            </button>
            <button
              onClick={() => setActiveView('create')}
              className="btn-secondary px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">add_circle</span>
              <span>Post Surplus Lot</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4-Metric Command Ribbon (Elevated Glass Cards with Gentle Lift) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Batches */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-tech-label text-lime-accent/90">
              Active Batches
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-lime-accent flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-metric-value">{activeBatches.length}</span>
              <span className="text-metric-unit">Lots</span>
            </div>
            <span className="text-tech-label normal-case text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-2xs font-mono">
              {movingLots.length} In-Transit
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/10 text-supporting flex justify-between items-center">
            <span>{movingKg} kg moving</span>
            <span className="font-mono font-medium text-white">{activeBatches.length} in pipeline</span>
          </div>
        </div>

        {/* Metric 2: Food Rescued */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-tech-label text-lime-accent/90">
              Completed Deliveries
            </span>
            <div className="w-8 h-8 rounded-xl bg-lime-accent/15 border border-lime-accent/25 text-lime-accent flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">eco</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-metric-value">{deliveredKg.toLocaleString()}</span>
              <span className="text-metric-unit">kg</span>
            </div>
            <span className="text-tech-label normal-case text-lime-300 bg-lime-950/80 border border-lime-400/40 px-2.5 py-0.5 rounded-full shadow-2xs font-mono">
              {deliveredLots.length} Verified
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/10 text-supporting flex justify-between items-center">
            <span>~{deliveredMeals.toLocaleString()} meals delivered</span>
            <span className="font-mono font-semibold text-lime-accent">{co2eTons} t CO₂e</span>
          </div>
        </div>

        {/* Metric 3: Pending Handoffs */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-tech-label text-lime-accent/90">
              Pending Coordination
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/25 text-amber-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-metric-value">{pendingApprovals.length}</span>
              <span className="text-metric-unit text-amber-300">lots</span>
            </div>
            <span className="text-tech-label normal-case text-amber-300 bg-amber-950/80 border border-amber-400/40 px-2.5 py-0.5 rounded-full shadow-2xs font-mono">
              Action Required
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/10 text-supporting flex justify-between items-center">
            <span>Matching or AI sign-off</span>
            <button onClick={() => setActiveView('matching')} className="text-lime-accent font-semibold hover:underline">
              Resolve &rarr;
            </button>
          </div>
        </div>

        {/* Metric 4: Food at Risk */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-tech-label text-red-300">
              Food at Risk (&lt;90m)
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">timer</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-metric-value text-red-400">{urgentBatches.length} Lots</span>
            </div>
            <span className="text-tech-label normal-case text-white bg-red-600/90 border border-red-500/50 px-2.5 py-0.5 rounded-full animate-pulse shadow-xs font-mono">
              Urgent Window
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/10 text-supporting flex justify-between items-center">
            <span>HACCP Perishable margin</span>
            <span className="font-mono font-medium text-red-400">Immediate Dispatch</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Inventory Stream & Recipient Capacity Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Batches Table / Stream */}
        <div className="lg:col-span-2 glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-lime-accent flex items-center justify-center shadow-2xs">
                <span className="material-symbols-outlined text-[20px]">view_timeline</span>
              </div>
              <div>
                <h3 className="text-section-heading">Live Surplus Lots</h3>
                <p className="text-supporting">Real-time status updates across urban redistribution pipeline</p>
              </div>
            </div>

            <div className="text-tech-label text-sage-pale/70 font-mono">
              Showing <span className="text-white font-bold">{filteredDonations.length}</span> of {baseScopedDonations.length} lots
            </div>
          </div>

          {/* Unified In-Panel Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-black/30 p-2.5 rounded-2xl border border-white/10">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sage-pale/60 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lot ID, food item, kitchen, category, allergens..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-black/40 text-white rounded-xl border border-white/15 focus:border-lime-accent/50 focus:ring-2 focus:ring-lime-accent/20 outline-none font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sage-pale/50 hover:text-white"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-white/15 bg-black/40 text-white font-sans focus:outline-none focus:ring-2 focus:ring-lime-accent/30"
              >
                <option value="all">All Categories</option>
                <option value="hot_meals">Hot Meals</option>
                <option value="bakery">Bakery</option>
                <option value="produce">Produce</option>
                <option value="dairy">Dairy</option>
                <option value="pantry">Pantry</option>
              </select>

              <button
                type="button"
                onClick={toggleAllZones}
                className={`px-2.5 py-1.5 text-xs rounded-xl border font-bold transition-all flex items-center gap-1 ${
                  allZonesActive
                    ? 'btn-primary shadow-xs'
                    : 'bg-white/5 text-sage-pale border-white/10 hover:text-white'
                }`}
                title={allZonesActive ? 'Showing all network zones. Click to isolate to active kitchen.' : 'Expand to all network zones'}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {allZonesActive ? 'check_circle' : 'hub'}
                </span>
                <span>All Zones</span>
              </button>

              <button
                type="button"
                onClick={toggleUrgentOnly}
                className={`px-2.5 py-1.5 text-xs rounded-xl border font-bold transition-all flex items-center gap-1 ${
                  isUrgentOnly
                    ? 'bg-alert-crimson text-white border-red-500 shadow-xs ring-2 ring-red-400/30'
                    : 'bg-red-950/40 text-red-300 border-red-500/30 hover:border-red-400'
                }`}
                title={isUrgentOnly ? 'Urgent filter active (<90m). Click to show all active batches.' : 'Filter to urgent batches expiring in <90m'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isUrgentOnly ? 'bg-white animate-pulse' : 'bg-red-400'}`}></span>
                <span>Urgent (&lt;90m)</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setCategoryFilter('all');
                  }}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-white/20 text-sage-pale hover:text-white bg-white/5 hover:bg-white/10 font-mono flex items-center gap-1"
                  title="Clear active search and filters"
                >
                  <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Chips Strip (When Filters Applied) */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap text-tech-label text-sage-pale/80 pt-0.5">
              <span>Active filters:</span>
              {searchQuery.trim() && (
                <span className="bg-lime-accent/15 text-lime-accent border border-lime-accent/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  Query: "{searchQuery.trim()}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-white font-bold">&times;</button>
                </span>
              )}
              {isUrgentOnly && (
                <span className="bg-red-950 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  Urgent (&lt;90m)
                  <button onClick={toggleUrgentOnly} className="hover:text-white font-bold">&times;</button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  Category: {categoryFilter.replace('_', ' ')}
                  <button onClick={() => setCategoryFilter('all')} className="hover:text-white font-bold">&times;</button>
                </span>
              )}
              {allZonesActive && selectedKitchenId !== 'all' && (
                <span className="bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  Scope: All Zones
                  <button onClick={toggleAllZones} className="hover:text-white font-bold">&times;</button>
                </span>
              )}
            </div>
          )}

          {/* Batches List with Expandable Details */}
          {filteredDonations.length > 0 ? (
            <div className="space-y-3">
              {filteredDonations.map((batch) => {
                const isUrgent = isDonationUrgent(batch);
                const isDelivered = batch.status === 'DELIVERED';
                const isInTransit = batch.status === 'IN_TRANSIT';
                const isExpanded = Boolean(expandedLots[batch.id]);

                return (
                  <div
                    key={batch.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isDelivered
                        ? 'bg-white/[0.03] border-white/5 opacity-75'
                        : isInTransit
                        ? 'bg-emerald-950/60 border-lime-accent/50 shadow-md ring-1 ring-lime-accent/20'
                        : isUrgent
                        ? 'bg-red-950/40 border-red-500/40 shadow-sm'
                        : 'glass-subcard'
                    }`}
                  >
                    {/* Primary Summary Row */}
                    <div 
                      onClick={() => handleRowAction(batch.id, batch.status)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowAction(batch.id, batch.status);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs border ${
                          batch.category === 'hot_meals'
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                            : batch.category === 'dairy'
                            ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30'
                            : batch.category === 'bakery'
                            ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
                            : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {batch.category === 'hot_meals'
                              ? 'soup_kitchen'
                              : batch.category === 'dairy'
                              ? 'ac_unit'
                              : batch.category === 'bakery'
                              ? 'bakery_dining'
                              : 'nutrition'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-tech-data font-bold text-lime-accent bg-black/40 border border-white/10 px-2 py-0.5 rounded-md">
                              {batch.id}
                            </span>
                            <h4 className={`text-card-title truncate ${isDelivered ? 'line-through text-sage-pale/40' : 'text-white'}`}>
                              {batch.title}
                            </h4>
                            <span className="text-tech-data text-sage-pale/80 font-medium">({batch.quantityKg}kg &bull; {batch.servings} servings)</span>
                          </div>
                          <p className="text-supporting truncate mt-1">
                            Donor: <strong className="text-white font-semibold">{batch.donorName}</strong> &bull; {batch.storageType.toUpperCase()} ({batch.tempTargetC}°C) &bull;{' '}
                            {isUrgent ? (
                              <span className="text-red-400 font-bold">Expires in {batch.expiryMinutesRemaining}m</span>
                            ) : (
                              <span>Window: {batch.pickupWindow}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        {/* Status Chip */}
                        <span className={`px-2.5 py-1 rounded-full text-tech-label normal-case flex items-center gap-1.5 shadow-2xs font-mono ${
                          batch.status === 'DELIVERED'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : batch.status === 'IN_TRANSIT'
                            ? 'bg-lime-accent/20 text-lime-accent border border-lime-accent/50'
                            : batch.status === 'APPROVED'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-400/40'
                            : batch.status === 'MATCHED'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-400/40'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-400/40'
                        }`}>
                          {batch.status === 'IN_TRANSIT' && <span className="w-1.5 h-1.5 rounded-full bg-lime-accent animate-pulse"></span>}
                          {batch.status === 'DELIVERED' && <span className="material-symbols-outlined text-[13px]">check</span>}
                          {batch.status}
                        </span>

                        {/* Expandable Disclosure Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleLotDetails(batch.id, e)}
                          aria-expanded={isExpanded}
                          className="p-1.5 rounded-xl border border-white/10 hover:border-lime-accent/40 bg-white/5 hover:bg-white/10 text-sage-pale hover:text-white transition-colors"
                          title={isExpanded ? 'Collapse details' : 'View details'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>

                        {/* Primary Workflow Action Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowAction(batch.id, batch.status);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                            batch.status === 'PUBLISHED'
                              ? 'btn-primary'
                              : batch.status === 'MATCHED'
                              ? 'btn-emerald'
                              : 'btn-secondary'
                          }`}
                        >
                          {batch.status === 'PUBLISHED'
                            ? 'Match Hub'
                            : batch.status === 'MATCHED'
                            ? 'AI Plan'
                            : 'Track'}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Details Panel (Requirement 6) */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-black/40 text-xs space-y-3 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          <div className="space-y-1">
                            <span className="text-tech-label text-sage-pale/70 block">Allergens & Dietary:</span>
                            <div className="flex flex-wrap gap-1">
                              {batch.allergens.length > 0 ? (
                                batch.allergens.map((alg, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                                    {alg}
                                  </span>
                                ))
                              ) : (
                                <span className="text-emerald-400 font-medium">None declared</span>
                              )}
                              {batch.dietaryTags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-tech-label text-sage-pale/70 block">Packaging & Thermal Spec:</span>
                            <p className="text-white font-mono text-[11px]">
                              {batch.packaging} &bull; Target: {batch.tempTargetC}°C ({batch.storageType})
                            </p>
                            <p className="text-sage-pale/75 text-[11px]">
                              Prepared: {batch.cookedOrPackedAt} &bull; Safe margin: {batch.expiryMinutesRemaining}m
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-tech-label text-sage-pale/70 block">Origin Location & Dock:</span>
                            <p className="text-white font-mono text-[11px] truncate">
                              {batch.donorAddress} ({batch.donorLocation})
                            </p>
                            {batch.matchedRecipientId && (
                              <p className="text-lime-accent text-[11px] font-mono">
                                Matched Recipient ID: {batch.matchedRecipientId}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Tracking History Mini Timeline */}
                        {batch.trackingSteps && batch.trackingSteps.length > 0 && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-tech-label text-sage-pale/70 block mb-1.5">Chain of Custody Milestones:</span>
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                              {batch.trackingSteps.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] flex items-center gap-1 ${
                                    step.completed
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                      : step.active
                                      ? 'bg-lime-accent/20 text-lime-accent border border-lime-accent/40 animate-pulse'
                                      : 'bg-white/5 text-sage-pale/50 border border-white/5'
                                  }`}>
                                    <span className="material-symbols-outlined text-[11px]">
                                      {step.completed ? 'check' : step.active ? 'pending' : 'schedule'}
                                    </span>
                                    {step.title}
                                  </span>
                                  {idx < batch.trackingSteps.length - 1 && (
                                    <span className="text-sage-pale/30 text-[10px]">&rarr;</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/15 space-y-3">
              <span className="material-symbols-outlined text-4xl text-sage-pale/40">inbox</span>
              <h4 className="text-card-title text-white">No Matching Donation Lots Found</h4>
              <p className="text-supporting max-w-sm mx-auto">
                No surplus lots match your active filters {searchQuery.trim() ? `for "${searchQuery.trim()}"` : ''}. Clear filters to show all active records.
              </p>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setCategoryFilter('all');
                  }}
                  className="btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Clear Filters &amp; Search
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('create')}
                  className="btn-primary px-4 py-2 text-xs font-bold"
                >
                  + Post New Lot
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 text-right">
            <span className="text-[10px] font-mono text-sage-pale/50">
              [All entries represent illustrative hackathon demonstration data]
            </span>
          </div>
        </div>

        {/* Right Col: Recipient Shelter Capacity Visualizer */}
        <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lime-accent text-[20px]">warehouse</span>
                <h3 className="text-section-heading">Recipient Hub Intake (Shared Network)</h3>
              </div>
              <span className="text-tech-label normal-case text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/40 shadow-2xs font-mono">
                Simulated Sensors
              </span>
            </div>

            <p className="text-supporting leading-relaxed">
              Simulated network-wide telemetry tracking estimated intake capacity load across participating regional shelters and food banks.
            </p>

            {/* Shelter Progress Bars */}
            <div className="space-y-3 pt-1">
              {recipients.map((rec) => {
                const percent = Math.round((rec.capacityUsedKg / rec.capacityTotalKg) * 100);
                const kgLeft = rec.capacityTotalKg - rec.capacityUsedKg;
                const isNearCap = percent >= 80;
                const isShelterExpanded = Boolean(expandedShelters[rec.id]);

                return (
                  <div key={rec.id} className="space-y-1.5 glass-subcard p-3 rounded-2xl hover:border-lime-accent/30 transition-all duration-150">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between">
                          <span className="text-subheading text-white truncate">{rec.name}</span>
                          <button
                            type="button"
                            onClick={(e) => toggleShelterDetails(rec.id, e)}
                            aria-expanded={isShelterExpanded}
                            className="p-1 rounded-md text-sage-pale/60 hover:text-white hover:bg-white/10"
                            title={isShelterExpanded ? 'Hide shelter details' : 'View accepted categories & equipment'}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isShelterExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        </div>
                        <div className="text-[10px] text-sage-pale/60 font-mono">{rec.distanceKm} km away &bull; {rec.type}</div>
                      </div>
                      <span className={`font-mono text-xs font-semibold ${isNearCap ? 'text-red-400' : 'text-lime-accent'}`}>
                        {percent}% ({kgLeft}kg left)
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-black/40 border border-white/10 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isNearCap
                            ? 'bg-red-500 shadow-xs'
                            : percent > 60
                            ? 'bg-emerald-400'
                            : 'bg-lime-accent'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    {rec.diningServiceTime && (
                      <div className="flex items-center gap-1 text-[10px] text-sage-pale/70 font-mono pt-0.5">
                        <span className="material-symbols-outlined text-[12px] text-amber-300">schedule</span>
                        <span>{rec.diningServiceTime}</span>
                      </div>
                    )}

                    {isShelterExpanded && (
                      <div className="pt-2 mt-1 border-t border-white/10 text-[10px] space-y-1 animate-in fade-in duration-150">
                        <div className="flex items-start gap-1">
                          <span className="text-sage-pale/60">Accepted:</span>
                          <span className="text-white font-mono">{rec.acceptedCategories.join(', ')}</span>
                        </div>
                        {rec.dietaryRequirements && rec.dietaryRequirements.length > 0 && (
                          <div className="flex items-start gap-1">
                            <span className="text-emerald-400/80">Dietary:</span>
                            <span className="text-emerald-300 font-mono">{rec.dietaryRequirements.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-1">
                          <span className="text-sage-pale/60">Equipment:</span>
                          <span className="text-sage-pale font-mono">
                            {rec.warmingOvensCapable ? 'Commercial Ovens' : 'No Warming Ovens'} &bull;{' '}
                            {rec.coldChainCapable ? 'Cold-Chain Capable' : 'Ambient / Basic'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => setActiveView('matching')}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">hub</span>
              <span>Open Full Recipient Matrix &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
