import React, { useState, useEffect } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';
import { ProofOfDelivery } from '../../types';
import {
  evaluateThermalSafety,
  SIMULATED_SENSOR_LABEL,
  SIMULATED_DISCLAIMER,
  TELEMETRY_THRESHOLDS,
} from '../../utils/telemetryEngine';

export const TrackingHandoffView: React.FC = () => {
  const {
    donations,
    activeLot,
    setActiveLotId,
    recipients,
    couriers,
    advanceDeliveryMilestone,
    completeHandoff,
    simulateTelemetryReading,
    setActiveView,
    triggerToast,
  } = useFoodLoop();

  const [statusFilter, setStatusFilter] = useState<'all' | 'in_transit' | 'completed'>('all');
  const [signoffModalOpen, setSignoffModalOpen] = useState(false);
  const [signeeName, setSigneeName] = useState('Sister Maria Vance');
  const [handoffTemp, setHandoffTemp] = useState<number>(64.8);
  const [verificationPin, setVerificationPin] = useState('8920');
  const [deliveryNotes, setDeliveryNotes] = useState('All trays verified under HACCP standard. Direct transfer into cafeteria holding units.');
  const [isSimulatingProbe, setIsSimulatingProbe] = useState(false);

  const recipient = recipients.find(r => r.id === activeLot?.matchedRecipientId) || recipients[0];
  const courier = couriers.find(c => c.id === activeLot?.assignedCourierId) || couriers[1];

  // Derive counts from the exact dataset
  const inTransitStatuses = ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED'];
  const allCount = donations.length;
  const inTransitCount = donations.filter(d => inTransitStatuses.includes(d.status)).length;
  const completedCount = donations.filter(d => d.status === 'DELIVERED').length;

  const filteredLots = donations.filter(d => {
    if (statusFilter === 'in_transit') return inTransitStatuses.includes(d.status);
    if (statusFilter === 'completed') return d.status === 'DELIVERED';
    return true;
  });

  // Automatically keep activeLot in sync when filter tab changes
  useEffect(() => {
    if (filteredLots.length > 0 && !filteredLots.some(d => d.id === activeLot?.id)) {
      setActiveLotId(filteredLots[0].id);
    }
  }, [statusFilter, filteredLots, activeLot?.id, setActiveLotId]);

  // Set default handoff temp based on storage type
  useEffect(() => {
    if (activeLot) {
      if (activeLot.storageType === 'hot') {
        setHandoffTemp(64.2);
      } else if (activeLot.storageType === 'chilled') {
        setHandoffTemp(3.8);
      } else {
        setHandoffTemp(20.5);
      }
    }
  }, [activeLot?.id, activeLot?.storageType]);

  // Handle Escape key for signoff modal
  useEffect(() => {
    if (!signoffModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSignoffModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [signoffModalOpen]);

  // Latest telemetry reading & thermal safety evaluation
  const latestReading = activeLot?.tempTelemetry?.[activeLot.tempTelemetry.length - 1];
  const safetyEval = evaluateThermalSafety(latestReading, activeLot?.storageType || 'hot');
  const thresholdInfo = TELEMETRY_THRESHOLDS[activeLot?.storageType || 'hot'] || TELEMETRY_THRESHOLDS.hot;

  const handleSimulateProbe = () => {
    if (!activeLot) return;
    setIsSimulatingProbe(true);
    simulateTelemetryReading(activeLot.id);
    setTimeout(() => setIsSimulatingProbe(false), 300);
  };

  const handleAdvanceMilestone = () => {
    if (!activeLot) return;

    if (activeLot.status === 'APPROVED' || activeLot.status === 'COURIER_ASSIGNED') {
      advanceDeliveryMilestone(activeLot.id, 'PICKED_UP');
    } else if (activeLot.status === 'PICKED_UP') {
      advanceDeliveryMilestone(activeLot.id, 'IN_TRANSIT');
    } else if (activeLot.status === 'IN_TRANSIT') {
      advanceDeliveryMilestone(activeLot.id, 'ARRIVED');
    } else if (activeLot.status === 'ARRIVED') {
      setSignoffModalOpen(true);
    }
  };

  const handleConfirmHandoff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLot) return;

    if (!signeeName.trim()) {
      triggerToast('Validation Error', 'Recipient intake signee name is required for custody transfer.', 'alert');
      return;
    }

    const tempNum = Number(handoffTemp);
    if (isNaN(tempNum)) {
      triggerToast('Validation Error', 'Valid intake temperature reading is required.', 'alert');
      return;
    }

    const proof: ProofOfDelivery = {
      recipientSignee: signeeName.trim(),
      signatureDate: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      handoffTempC: tempNum,
      verificationPin,
      notes: deliveryNotes,
    };

    const success = completeHandoff(activeLot.id, proof);
    if (success) {
      setSignoffModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* 1. Header Bar: Title, Subtitle, & Active Lot Selector */}
      <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-tech-label text-lime-accent">
            HACCP Chain of Custody &amp; Telemetry
          </span>
          <h1 className="text-page-title text-white mt-0.5">
            Real-Time Courier &amp; Handoff Verification
          </h1>
          <p className="text-supporting text-sage-pale/75 mt-0.5">
            Continuous core temperature monitoring from donor loading dock to recipient shelter intake.
          </p>
        </div>

        {/* Lot Selector */}
        <div className="flex items-center gap-2.5">
          <label className="text-tech-label text-sage-pale/80 hidden sm:inline">Active Lot:</label>
          <select
            value={activeLot?.id}
            onChange={(e) => setActiveLotId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-lime-accent/30 transition-all shadow-inner"
          >
            {filteredLots.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0B2A20] text-white">
                {d.id} &bull; {d.title.slice(0, 26)}... [{d.status}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Status Filter Tabs with Exact Derived Counts */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all' as const, label: `All Lots (${allCount})` },
          { id: 'in_transit' as const, label: `In-Transit (${inTransitCount})` },
          { id: 'completed' as const, label: `Completed (${completedCount})` },
        ].map((pill) => (
          <button
            key={pill.id}
            onClick={() => setStatusFilter(pill.id)}
            className={`px-4 py-2 rounded-xl text-tech-label font-bold transition-all duration-150 ${
              statusFilter === pill.id
                ? 'btn-primary shadow-xs'
                : 'btn-secondary opacity-80 hover:opacity-100'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Filtered Lots Quick-Select Bar (Horizontal Cards) */}
      {filteredLots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {filteredLots.map((lot) => {
            const isSelected = activeLot?.id === lot.id;
            return (
              <button
                key={lot.id}
                onClick={() => setActiveLotId(lot.id)}
                className={`p-3 rounded-2xl text-left transition-all border ${
                  isSelected
                    ? 'bg-lime-accent/15 border-lime-accent/50 shadow-[0_0_15px_rgba(200,241,105,0.15)] ring-1 ring-lime-accent/30'
                    : 'glass-card border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">{lot.id}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                    lot.status === 'DELIVERED'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                      : lot.status === 'IN_TRANSIT' || lot.status === 'ARRIVED'
                      ? 'bg-lime-accent/20 text-lime-accent border border-lime-accent/40'
                      : lot.status === 'PICKED_UP'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-400/40'
                      : 'bg-white/10 text-sage-pale border border-white/10'
                  }`}>
                    {lot.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-white text-xs font-semibold truncate mt-1">{lot.title}</div>
                <div className="text-sage-pale/70 text-[11px] font-mono mt-0.5 flex justify-between">
                  <span>{lot.quantityKg} kg</span>
                  <span>{lot.storageType.toUpperCase()}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center glass-panel-dark rounded-3xl border border-white/10 space-y-2">
          <span className="material-symbols-outlined text-3xl text-sage-pale/50">inbox</span>
          <p className="text-white font-medium text-sm">No donation lots match the "{statusFilter.replace('_', ' ')}" filter.</p>
          <button onClick={() => setStatusFilter('all')} className="btn-secondary px-3 py-1.5 text-xs font-bold">
            Show All Lots
          </button>
        </div>
      )}

      {/* 3. Hero Card for Selected Lot */}
      {activeLot && (
        <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-3.5 py-1 rounded-full text-tech-label font-bold flex items-center gap-1.5 shadow-2xs ${
                activeLot.status === 'DELIVERED'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : activeLot.status === 'ARRIVED'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/40'
                  : activeLot.status === 'IN_TRANSIT'
                  ? 'bg-lime-accent/25 text-lime-accent border border-lime-accent/50'
                  : activeLot.status === 'PICKED_UP'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-400/40'
                  : 'bg-white/10 text-white border border-white/15'
              }`}>
                {(activeLot.status === 'IN_TRANSIT' || activeLot.status === 'PICKED_UP') && (
                  <span className="w-2 h-2 rounded-full bg-lime-accent animate-ping"></span>
                )}
                <span>#{activeLot.id} &bull; {activeLot.status.replace('_', ' ')}</span>
              </span>
              <span className="text-tech-label text-sage-pale/80 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                HACCP Monitored Chain
              </span>
            </div>

            {/* Contextual Action Button */}
            <div>
              {activeLot.status === 'PUBLISHED' && (
                <button
                  onClick={() => setActiveView('matching')}
                  className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">hub</span>
                  <span>Find Recipient Match &rarr;</span>
                </button>
              )}

              {activeLot.status === 'MATCHED' && (
                <button
                  onClick={() => setActiveView('planner')}
                  className="btn-emerald px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span>Review AI Dispatch Plan &rarr;</span>
                </button>
              )}

              {(activeLot.status === 'APPROVED' || activeLot.status === 'COURIER_ASSIGNED') && (
                <button
                  onClick={handleAdvanceMilestone}
                  className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">forklift</span>
                  <span>Simulate Dock Pickup &rarr;</span>
                </button>
              )}

              {activeLot.status === 'PICKED_UP' && (
                <button
                  onClick={handleAdvanceMilestone}
                  className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  <span>Depart Loading Dock (In-Transit) &rarr;</span>
                </button>
              )}

              {activeLot.status === 'IN_TRANSIT' && (
                <button
                  onClick={handleAdvanceMilestone}
                  className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">where_to_vote</span>
                  <span>Confirm Recipient Arrival &rarr;</span>
                </button>
              )}

              {activeLot.status === 'ARRIVED' && (
                <button
                  onClick={handleAdvanceMilestone}
                  className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Execute Shelter Intake Sign-off &rarr;</span>
                </button>
              )}

              {activeLot.status === 'DELIVERED' && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 text-tech-label text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-2xs font-bold">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Handoff Verified</span>
                  </div>
                  <button
                    onClick={() => setActiveView('analytics')}
                    className="btn-primary px-3.5 py-1.5 text-xs font-bold"
                  >
                    View Impact Registry &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lot Title & Origin -> Recipient Specs */}
          <div>
            <h2 className="text-section-heading text-white">{activeLot.title}</h2>
            <p className="text-supporting text-sage-pale/80 font-mono mt-1">
              Origin: <strong className="text-white font-semibold">{activeLot.donorName}</strong> ({activeLot.donorLocation}) &rarr; Recipient:{' '}
              <strong className="text-white font-semibold">{recipient.name}</strong> ({recipient.address})
            </p>

            <div className="flex flex-wrap gap-2 pt-3">
              <span className="px-3 py-1 bg-white/[0.06] rounded-xl text-tech-label text-white flex items-center gap-1.5 border border-white/10">
                <span className="material-symbols-outlined text-[15px] text-lime-accent">scale</span>
                {activeLot.quantityKg} kg
              </span>
              <span className="px-3 py-1 bg-white/[0.06] rounded-xl text-tech-label text-white flex items-center gap-1.5 border border-white/10">
                <span className="material-symbols-outlined text-[15px] text-lime-accent">restaurant</span>
                ~{activeLot.servings} Servings
              </span>
              <span className="px-3 py-1 bg-white/[0.06] rounded-xl text-tech-label text-white flex items-center gap-1.5 border border-white/10">
                <span className="material-symbols-outlined text-[15px] text-lime-accent">thermostat</span>
                Target: {activeLot.tempTargetC}°C ({activeLot.storageType.toUpperCase()})
              </span>
              <span className="px-3 py-1 bg-white/[0.06] rounded-xl text-tech-label text-white flex items-center gap-1.5 border border-white/10">
                <span className="material-symbols-outlined text-[15px] text-lime-accent">inventory_2</span>
                {activeLot.packaging}
              </span>
            </div>
          </div>

          {/* Proof of Delivery Card (If Delivered) */}
          {activeLot.proofOfDelivery && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-tech-label">
                <span className="font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">fact_check</span>
                  Verified Digital Handshake Record
                </span>
                <span className="text-emerald-400 font-mono">{activeLot.proofOfDelivery.signatureDate}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-sage-pale/60 text-tech-label block">Recipient Signee:</span>
                  <span className="font-bold text-white text-subheading">{activeLot.proofOfDelivery.recipientSignee}</span>
                </div>
                <div>
                  <span className="text-sage-pale/60 text-tech-label block">Dock Intake Temp:</span>
                  <span className="font-bold text-lime-accent text-tech-data">{activeLot.proofOfDelivery.handoffTempC}°C (Verified Safe)</span>
                </div>
                <div>
                  <span className="text-sage-pale/60 text-tech-label block">Verification PIN:</span>
                  <span className="font-bold text-white text-tech-data">{activeLot.proofOfDelivery.verificationPin || '8920'}</span>
                </div>
              </div>
              {activeLot.proofOfDelivery.notes && (
                <p className="text-supporting text-sage-pale/80 pt-1.5 border-t border-white/10 font-sans">
                  "{activeLot.proofOfDelivery.notes}"
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Grid: Chain of Custody Timeline & Temperature Telemetry Strip */}
      {activeLot && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Tracking Steps Timeline */}
          <div className="lg:col-span-2 glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lime-accent text-[20px]">timeline</span>
                <h3 className="text-card-title text-white">HACCP Chain of Custody Timeline</h3>
              </div>
              <span className="text-tech-label text-sage-pale/80 bg-black/40 border border-white/10 px-2.5 py-0.5 rounded-md font-mono">
                Persisted chronological log
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/15">
              {activeLot.trackingSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-[#061C14] shadow-2xs ${
                    step.completed
                      ? 'bg-emerald-500 text-white'
                      : step.active
                      ? 'bg-lime-accent text-forest animate-pulse font-bold'
                      : 'bg-white/20 text-sage-pale/60'
                  }`}>
                    <span className="material-symbols-outlined text-[12px] font-bold">
                      {step.completed ? 'check' : step.active ? 'radio_button_checked' : 'circle'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 glass-subcard hover:border-lime-accent/30 p-3.5 rounded-2xl transition-all">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className={`text-subheading font-bold ${step.completed ? 'text-white' : step.active ? 'text-lime-accent' : 'text-sage-pale/60'}`}>
                        {step.title}
                      </h4>
                      <span className="text-tech-label text-sage-pale/70 font-mono">{step.timestamp}</span>
                    </div>
                    {step.details && (
                      <p className="text-supporting text-sage-pale/80 mt-1 leading-snug">{step.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Temperature Telemetry Strip & Transport Courier */}
          <div className="space-y-5">
            {/* Temperature Telemetry Strip */}
            <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lime-accent text-[20px]">sensors</span>
                  <h3 className="text-card-title text-white">Thermal Telemetry Probe</h3>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateProbe}
                  disabled={isSimulatingProbe}
                  className="btn-secondary px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                  title="Generate simulated probe reading with current timestamp"
                >
                  <span className={`material-symbols-outlined text-[14px] ${isSimulatingProbe ? 'animate-spin' : ''}`}>sync</span>
                  <span>Sample</span>
                </button>
              </div>

              {/* Thermal Safety Banner (If Out of Threshold) */}
              {safetyEval.violatesThreshold && (
                <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 space-y-1 shadow-md">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    <span>Thermal Safety Warning</span>
                  </div>
                  <p className="text-[11px] text-red-200 leading-snug">{safetyEval.message}</p>
                </div>
              )}

              {/* Main Core Temp Gauge */}
              <div className={`p-4 rounded-2xl flex items-center justify-between shadow-inner relative overflow-hidden border ${
                safetyEval.status === 'safe'
                  ? 'bg-[#07241A]/80 border-lime-accent/30'
                  : safetyEval.status === 'warning'
                  ? 'bg-amber-950/50 border-amber-400/40'
                  : 'bg-red-950/60 border-red-500/50'
              }`}>
                <div className="relative z-10">
                  <span className="text-tech-label text-sage-pale/80 block">Current Core Temp</span>
                  <div className={`text-metric-value ${
                    safetyEval.status === 'safe'
                      ? 'text-lime-accent'
                      : safetyEval.status === 'warning'
                      ? 'text-amber-300'
                      : 'text-red-400'
                  }`}>
                    {latestReading ? `${latestReading.tempC}°C` : 'N/A'}
                  </div>
                  <span className="text-tech-label text-sage-pale/80 block font-normal mt-0.5">
                    Target: {thresholdInfo.label}
                  </span>
                </div>

                <div className="text-right relative z-10">
                  <span className="text-tech-label text-sage-pale/80 block">Probe Source</span>
                  <span className="text-[11px] font-mono font-bold text-lime-accent/90 block">
                    {SIMULATED_SENSOR_LABEL}
                  </span>
                  <span className="text-tech-label text-sage-pale/70 block font-mono mt-0.5">
                    Sync: {latestReading?.time || 'Just now'}
                  </span>
                </div>
              </div>

              {/* Transparent Disclaimer */}
              <p className="text-[11px] text-sage-pale/60 leading-normal font-sans italic p-2 rounded-xl bg-black/20 border border-white/5">
                {SIMULATED_DISCLAIMER}
              </p>

              {/* Logged Thermal Samples List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-tech-label text-sage-pale/80 block">
                  Logged Thermal Samples ({activeLot.tempTelemetry.length}):
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {activeLot.tempTelemetry.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center text-tech-data py-1 border-b border-white/5 text-xs font-mono">
                      <span className="text-sage-pale/70">{t.time}</span>
                      <span className="font-bold text-white">{t.tempC}°C</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${
                        t.status === 'safe'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : t.status === 'warning'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-400/40'
                          : 'bg-red-950 text-red-300 border border-red-500/40'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Assigned Courier Dispatch Card */}
            <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md border border-white/10 space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-tech-label text-lime-accent/90">
                  Transport Courier
                </span>
                <span className="text-tech-label text-forest bg-lime-accent px-2 py-0.5 rounded font-bold shadow-2xs font-mono">
                  {courier.vehiclePlate}
                </span>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-10 h-10 rounded-xl bg-lime-accent/15 border border-lime-accent/30 text-lime-accent flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <span className="material-symbols-outlined text-[22px]">directions_car</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-card-title text-white truncate">{courier.name}</h4>
                  <p className="text-supporting text-sage-pale/75 truncate mt-0.5">Driver: {courier.driverName} &bull; {courier.driverPhone}</p>
                </div>
              </div>

              <div className="pt-2 text-supporting font-mono text-sage-pale/80 flex justify-between items-center border-t border-white/10 text-xs">
                <span>Status: <strong className="text-white font-semibold">{courier.currentStatus}</strong></span>
                <span>Cargo Temp: <strong className="text-lime-accent font-semibold">{courier.compartmentTempC}°C</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Digital Handshake Sign-off Modal */}
      {signoffModalOpen && activeLot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity"
          onClick={() => setSignoffModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="signoff-modal-title"
        >
          <div
            className="glass-dropdown rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-lime-accent/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lime-accent text-[24px]">verified</span>
                <h3 id="signoff-modal-title" className="text-card-title text-white">Digital Intake Handoff &amp; Sign-off</h3>
              </div>
              <button
                type="button"
                onClick={() => setSignoffModalOpen(false)}
                className="text-sage-pale/60 hover:text-white transition-colors p-1 rounded-md"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-supporting text-sage-pale/80 leading-relaxed font-sans">
              Complete destination handover to <strong className="text-white">{recipient.name}</strong>. Verifying food temperature and recipient authorization updates the verified ESG registry.
            </p>

            <form onSubmit={handleConfirmHandoff} className="space-y-4 pt-1">
              <div>
                <label className="block text-supporting font-bold text-sage-pale mb-1">
                  Recipient Intake Signee Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signeeName}
                  onChange={(e) => setSigneeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/15 text-body-default focus:border-lime-accent focus:ring-2 focus:ring-lime-accent/30 outline-none bg-black/40 text-white placeholder-white/35 shadow-inner"
                  placeholder="e.g. Sister Maria Vance"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-supporting font-bold text-sage-pale mb-1">
                    Dock Core Temp (°C) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={handoffTemp}
                    onChange={(e) => setHandoffTemp(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/15 text-body-default focus:border-lime-accent focus:ring-2 focus:ring-lime-accent/30 outline-none bg-black/40 text-white font-mono shadow-inner"
                  />
                  <span className="text-[11px] text-sage-pale/70 block mt-1">
                    Req: {thresholdInfo.label}
                  </span>
                </div>

                <div>
                  <label className="block text-supporting font-bold text-sage-pale mb-1">
                    Verification PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationPin}
                    onChange={(e) => setVerificationPin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/15 text-body-default focus:border-lime-accent focus:ring-2 focus:ring-lime-accent/30 outline-none bg-black/40 text-white font-mono tracking-widest text-center shadow-inner"
                  />
                  <span className="text-[11px] text-sage-pale/70 block mt-1">
                    Intake terminal PIN
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-supporting font-bold text-sage-pale mb-1">
                  Intake Inspection Notes
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/15 text-body-default focus:border-lime-accent focus:ring-2 focus:ring-lime-accent/30 outline-none bg-black/40 text-white font-sans shadow-inner"
                  placeholder="Packaging condition, container seals, temperature probe confirmation..."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSignoffModalOpen(false)}
                  className="btn-ghost px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Confirm Handshake &amp; Sign-Off</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
