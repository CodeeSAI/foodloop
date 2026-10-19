import React, { useState } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';
import { evaluateRecipientConstraints } from '../../utils/constraintEngine';

export const RecipientMatchingView: React.FC = () => {
  const {
    donations,
    recipients,
    activeLot,
    setActiveLotId,
    assignMatch,
    setActiveView,
    triggerToast,
  } = useFoodLoop();

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    activeLot?.matchedRecipientId || 'REC-01'
  );
  const [filterMode, setFilterMode] = useState<'all' | 'eligible' | 'urgent'>('all');
  const [shelterSearch, setShelterSearch] = useState<string>('');
  const [expandedShelters, setExpandedShelters] = useState<Record<string, boolean>>({});

  const toggleShelterDetails = (recId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedShelters(prev => ({ ...prev, [recId]: !prev[recId] }));
  };

  if (!activeLot) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-subtle">hub</span>
        <h2 className="text-xl font-bold text-forest font-sans">No Active Donation Lot Selected</h2>
        <p className="text-xs text-subtle max-w-md mx-auto">
          Please create a new surplus food donation or select an existing lot to evaluate matches.
        </p>
        <button
          onClick={() => setActiveView('create')}
          className="btn-primary px-5 py-2.5 text-xs font-bold"
        >
          + Post Surplus Food
        </button>
      </div>
    );
  }

  // Evaluate all recipients against active donation using deterministic safety engine
  const evaluatedRecipients = recipients.map(r => ({
    recipient: r,
    evaluation: evaluateRecipientConstraints(activeLot, r),
  }));

  // Filter based on selected filter pill and search term
  const filteredRecipients = evaluatedRecipients.filter(({ recipient, evaluation }) => {
    if (filterMode === 'eligible' && !evaluation.eligible) return false;
    if (filterMode === 'urgent' && recipient.currentUrgency !== 'High') return false;

    if (shelterSearch.trim()) {
      const q = shelterSearch.toLowerCase().trim();
      const match = recipient.name.toLowerCase().includes(q) ||
                    recipient.address.toLowerCase().includes(q) ||
                    recipient.type.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort: eligible first (sorted by score descending), then ineligible
  const sortedRecipients = [...filteredRecipients].sort((a, b) => {
    if (a.evaluation.eligible && !b.evaluation.eligible) return -1;
    if (!a.evaluation.eligible && b.evaluation.eligible) return 1;
    return b.evaluation.score - a.evaluation.score;
  });

  const handleSelectAndProceed = (recipientId: string) => {
    const target = evaluatedRecipients.find(x => x.recipient.id === recipientId);
    if (!target) return;

    if (!target.evaluation.eligible) {
      triggerToast(
        'Assignment Blocked by Safety Engine',
        target.evaluation.rejectionReasons[0] || 'Violates physical or food-safety rules',
        'alert'
      );
      return;
    }

    const success = assignMatch(activeLot.id, recipientId);
    if (success) {
      setActiveView('planner');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Active Lot Context Bar with Frosted Glass */}
      <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-lime-accent/15 border border-lime-accent/30 text-lime-accent flex items-center justify-center font-mono font-bold text-sm shadow-md">
            {activeLot.id}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-tech-label text-lime-accent">
                Surplus Matching Target
              </span>
              <span className="text-tech-label px-2 py-0.5 rounded-full bg-lime-accent/20 text-lime-accent border border-lime-accent/30 shadow-2xs">
                {activeLot.status}
              </span>
            </div>
            <h2 className="text-card-title sm:text-section-heading text-white font-bold">
              {activeLot.title}
            </h2>
            <p className="text-supporting text-sage-pale/70 font-mono mt-0.5">
              Donor: <span className="text-white font-semibold">{activeLot.donorName}</span> &bull; {activeLot.quantityKg}kg ({activeLot.servings} servings) &bull;{' '}
              {activeLot.storageType.toUpperCase()} ({activeLot.tempTargetC}°C) &bull;{' '}
              Allergens: {activeLot.allergens.length > 0 ? activeLot.allergens.join(', ') : 'None'}
            </p>
          </div>
        </div>

        {/* Change Lot Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-tech-label text-sage-pale/70 hidden sm:inline">Active Lot:</label>
          <select
            value={activeLot.id}
            onChange={(e) => {
              setActiveLotId(e.target.value);
              const lot = donations.find(d => d.id === e.target.value);
              if (lot?.matchedRecipientId) {
                setSelectedRecipientId(lot.matchedRecipientId);
              }
            }}
            className="px-4 py-2 rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-lime-accent/30 transition-all shadow-inner"
          >
            {donations.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0B2A20] text-white">
                {d.id} &bull; {d.title.slice(0, 26)}... [{d.status}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Engine Architecture Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div>
          <h3 className="text-page-title text-white">
            Deterministic Recipient Safety Matrix
          </h3>
          <p className="text-supporting text-sage-pale/70 mt-0.5">
            Strict verification: Physical capacity, food category, allergen restrictions, equipment, and expiry margin.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sage-pale/60 text-[16px]">
              search
            </span>
            <input
              type="text"
              value={shelterSearch}
              onChange={(e) => setShelterSearch(e.target.value)}
              placeholder="Filter shelters..."
              className="pl-8 pr-7 py-1.5 rounded-xl border border-white/15 bg-black/40 text-white text-xs placeholder:text-sage-pale/40 focus:outline-none focus:ring-2 focus:ring-lime-accent/30 font-sans shadow-inner"
            />
            {shelterSearch && (
              <button
                onClick={() => setShelterSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sage-pale/60 hover:text-white"
                aria-label="Clear shelter search"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-tech-label font-semibold transition-all duration-150 ${
              filterMode === 'all'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            All ({recipients.length})
          </button>
          <button
            onClick={() => setFilterMode('eligible')}
            className={`px-3 py-1.5 text-tech-label font-semibold transition-all duration-150 ${
              filterMode === 'eligible'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            Eligible ({evaluatedRecipients.filter(x => x.evaluation.eligible).length})
          </button>
          <button
            onClick={() => setFilterMode('urgent')}
            className={`px-3 py-1.5 text-tech-label font-semibold transition-all duration-150 ${
              filterMode === 'urgent'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            Urgent ({evaluatedRecipients.filter(x => x.recipient.currentUrgency === 'High').length})
          </button>
        </div>
      </div>

      {/* Recipient Cards Grid or Empty Search State */}
      {sortedRecipients.length === 0 ? (
        <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/15 space-y-3">
          <span className="material-symbols-outlined text-4xl text-sage-pale/40">search_off</span>
          <h4 className="text-card-title text-white">No Matching Recipient Shelters</h4>
          <p className="text-supporting max-w-sm mx-auto">
            No shelters match your current search criteria or safety filter.
          </p>
          <button
            onClick={() => {
              setFilterMode('all');
              setShelterSearch('');
            }}
            className="btn-secondary px-4 py-2 text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedRecipients.map(({ recipient, evaluation }, index) => {
          const isSelected = selectedRecipientId === recipient.id;
          const isTopRanked = index === 0 && evaluation.eligible;
          const remainingKg = Math.max(0, recipient.capacityTotalKg - recipient.capacityUsedKg);
          const percentUsed = Math.round((recipient.capacityUsedKg / recipient.capacityTotalKg) * 100);

          return (
            <div
              key={recipient.id}
              onClick={() => setSelectedRecipientId(recipient.id)}
              className={`glass-card rounded-3xl p-5 sm:p-6 cursor-pointer flex flex-col justify-between relative overflow-hidden transition-all duration-200 border ${
                isSelected && evaluation.eligible
                  ? 'border-lime-accent ring-2 ring-lime-accent/40 shadow-xl bg-[rgba(18,62,48,0.85)] translate-y-[-3px]'
                  : isSelected
                  ? 'border-white/30 shadow-md bg-[rgba(15,52,40,0.75)]'
                  : ''
              } ${!evaluation.eligible ? 'border-red-500/40 bg-red-950/30 hover:border-red-400/60' : ''}`}
            >
              {isTopRanked && (
                <div className="absolute top-0 right-0 bg-lime-accent text-forest text-tech-label px-3 py-1 rounded-bl-2xl shadow-xs uppercase tracking-wider flex items-center gap-1 border-b border-l border-lime-accent/30 font-bold">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  Optimal Safety Match
                </div>
              )}

              <div className="space-y-3.5">
                {/* Header: Score & Rejection Badge */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-tech-label font-bold px-2.5 py-1 rounded-xl shadow-2xs ${
                        evaluation.eligible
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-950/80 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {evaluation.eligible ? `${evaluation.score.toFixed(1)}% Match` : 'REJECTED BY SAFETY RULE'}
                    </span>
                    <span className="text-tech-label text-sage-pale/60 font-normal">{recipient.distanceKm} km</span>
                  </div>

                  {recipient.currentUrgency === 'High' && (
                    <span className="text-tech-label text-red-300 bg-red-950/80 border border-red-500/40 px-2 py-0.5 rounded-full">
                      High Need
                    </span>
                  )}
                </div>

                {/* Shelter Title & Type */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-card-title text-white leading-snug">{recipient.name}</h4>
                    <p className="text-supporting text-sage-pale/60 font-mono mt-0.5">{recipient.type} &bull; {recipient.address}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleShelterDetails(recipient.id, e)}
                    className="p-1 rounded-md text-sage-pale/60 hover:text-white hover:bg-white/10 flex items-center gap-0.5 text-[11px] font-mono"
                    title={expandedShelters[recipient.id] ? "Hide facility specifications" : "View facility specifications"}
                  >
                    <span>{expandedShelters[recipient.id] ? 'Hide' : 'Details'}</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {expandedShelters[recipient.id] ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>

                {/* Expandable Disclosure Details */}
                {expandedShelters[recipient.id] && (
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-[11px] space-y-2 animate-in fade-in duration-150">
                    <div>
                      <span className="text-sage-pale/60 block font-mono text-[10px] uppercase">Accepted Categories:</span>
                      <span className="text-white font-mono">{recipient.acceptedCategories.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-sage-pale/60 block font-mono text-[10px] uppercase">Dietary Mandates:</span>
                      <span className="text-emerald-300 font-mono">
                        {recipient.dietaryRequirements && recipient.dietaryRequirements.length > 0
                          ? recipient.dietaryRequirements.join(', ')
                          : 'Standard shelter menu'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sage-pale/60 block font-mono text-[10px] uppercase">Facility Equipment:</span>
                      <span className="text-sage-pale font-mono">
                        {recipient.warmingOvensCapable ? '✓ Commercial warming ovens' : '✗ No warming ovens'} &bull;{' '}
                        {recipient.coldChainCapable ? '✓ Walk-in cold chain' : '✗ Ambient only'}
                      </span>
                    </div>
                    {recipient.diningServiceTime && (
                      <div>
                        <span className="text-sage-pale/60 block font-mono text-[10px] uppercase">Service Window:</span>
                        <span className="text-amber-300 font-mono">{recipient.diningServiceTime}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-sage-pale/60 block font-mono text-[10px] uppercase">Contact Coordinator:</span>
                      <span className="text-white font-mono">{recipient.contactName} ({recipient.phone})</span>
                    </div>
                  </div>
                )}

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 glass-subcard p-3 rounded-2xl hover:border-lime-accent/30">
                  <div className="flex justify-between text-tech-label">
                    <span className="text-sage-pale/70 font-normal">Intake Capacity</span>
                    <span className={`font-bold ${!evaluation.breakdown.capacity.passed ? 'text-red-400' : 'text-lime-accent'}`}>
                      {percentUsed}% ({remainingKg}kg free)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentUsed >= 85 ? 'bg-red-500' : 'bg-lime-accent'
                      }`}
                      style={{ width: `${Math.min(100, percentUsed)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Deterministic Rejection Reasons (If Ineligible) */}
                {!evaluation.eligible && (
                  <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-supporting space-y-1.5 shadow-2xs">
                    <span className="text-tech-label font-bold text-red-300 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">gavel</span>
                      Deterministic Constraint Violations:
                    </span>
                    {evaluation.rejectionReasons.map((reason, i) => (
                      <p key={i} className="text-red-200 text-supporting leading-tight font-sans">
                        &bull; {reason}
                      </p>
                    ))}
                  </div>
                )}

                {/* Positive Highlights (If Eligible) */}
                {evaluation.eligible && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-tech-label text-lime-accent/90 block">
                      Verified Safety Checklist:
                    </span>
                    <ul className="text-supporting space-y-1 text-sage-pale/80">
                      {evaluation.positiveHighlights.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-tight">
                          <span className="material-symbols-outlined text-[16px] text-lime-accent flex-shrink-0">
                            check_circle
                          </span>
                          <span className="text-supporting text-white/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button with Glow */}
              <div className="pt-4 mt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={!evaluation.eligible}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAndProceed(recipient.id);
                  }}
                  className={`w-full py-2.5 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    isSelected && evaluation.eligible
                      ? 'btn-primary'
                      : evaluation.eligible
                      ? 'btn-secondary'
                      : 'btn-destructive cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {evaluation.eligible ? 'psychology' : 'block'}
                  </span>
                  <span>
                    {evaluation.eligible
                      ? 'Select & Synthesize AI Plan \u2192'
                      : 'Ineligible Match (Rejected)'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
