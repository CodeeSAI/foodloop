import React, { useState } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';

export const ImpactAnalyticsView: React.FC = () => {
  const { donations, triggerToast, aiStatus } = useFoodLoop();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [certModalOpen, setCertModalOpen] = useState(false);

  // Delivered lots from session & seed
  const deliveredLots = donations.filter(d => d.status === 'DELIVERED');
  const sessionDeliveredKg = deliveredLots.reduce((acc, d) => acc + d.quantityKg, 0);
  const sessionDeliveredMeals = deliveredLots.reduce((acc, d) => acc + d.servings, 0);

  // Timeframe baseline (illustrative historical simulation + live session records)
  const baselineKg = timeframe === '7d' ? 950 : timeframe === '30d' ? 3800 : 11400;
  const baselineMeals = Math.round(baselineKg * 2.6);

  const totalKg = baselineKg + sessionDeliveredKg;
  const totalMeals = baselineMeals + sessionDeliveredMeals;
  const co2eTons = (totalKg * 0.0022).toFixed(2);
  const methaneAvertedKg = Math.round(totalKg * 0.44);

  // Dynamic category breakdown computed directly from current donation store
  const categoryTotals: Record<string, number> = {
    hot_meals: 0,
    produce: 0,
    bakery: 0,
    dairy: 0,
    pantry: 0,
  };
  donations.forEach(d => {
    categoryTotals[d.category] = (categoryTotals[d.category] || 0) + d.quantityKg;
  });
  const sumCategories = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;

  const categoryDisplay = [
    { label: 'Hot Cooked Meals & Entrees', key: 'hot_meals', color: 'bg-amber-600', tag: 'High Nutrient' },
    { label: 'Fresh Farm Produce & Greens', key: 'produce', color: 'bg-emerald-600', tag: 'Zero Preservative' },
    { label: 'Artisan Bakery & Pastries', key: 'bakery', color: 'bg-yellow-600', tag: 'Fast Turnover' },
    { label: 'Chilled Dairy & Yogurts', key: 'dairy', color: 'bg-blue-600', tag: 'Cold-Chain HACCP' },
    { label: 'Pantry Staples & Shelf-Stable', key: 'pantry', color: 'bg-stone-600', tag: 'Long Life' },
  ].map(cat => {
    const kg = categoryTotals[cat.key] || 0;
    const pct = Math.round((kg / sumCategories) * 100);
    return { ...cat, kg, pct };
  });

  // Dynamic Donor Leaderboard computed directly from current donations
  const donorMap: Record<string, { kg: number; meals: number; count: number; sub: string }> = {};
  donations.forEach(d => {
    if (!donorMap[d.donorName]) {
      donorMap[d.donorName] = { kg: 0, meals: 0, count: 0, sub: d.donorLocation };
    }
    donorMap[d.donorName].kg += d.quantityKg;
    donorMap[d.donorName].meals += d.servings;
    donorMap[d.donorName].count += 1;
  });

  const donorLeaderboard = Object.entries(donorMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.kg - a.kg);

  const handleExport = () => {
    setCertModalOpen(true);
    triggerToast('Certificate Generated', 'ISO-14044 compliant surplus diversion ledger compiled.');
  };

  // Handle Escape key for certificate modal
  React.useEffect(() => {
    if (!certModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCertModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [certModalOpen]);

  const handleDownloadCertificate = () => {
    const certText = `===============================================================
FOODLOOP — ZERO-WASTE DISPATCH
ESG IMPACT & CARBON AVOIDANCE REPORT (ILLUSTRATIVE ESTIMATE)
Decision-Support Green Logistics Analysis (Demonstration)
===============================================================

Report Ref: FL-ESG-${Date.now().toString(36).toUpperCase()}
Issued To: Commercial Hospitality & Redistribution Network
Generated: ${new Date().toUTCString()}
Estimation Methodology: EPA WARM / ReFED Food Waste Reduction Factors

---------------------------------------------------------------
KEY PERFORMANCE SUMMARY (Timeframe: ${timeframe.toUpperCase()})
---------------------------------------------------------------
Total Surplus Food Diverted from Landfill: ${totalKg.toLocaleString()} kg
Total Wholesome Meals Provided to Shelters: ${totalMeals.toLocaleString()} meals
Net Greenhouse Gas Emissions Averted (Est.): ${co2eTons} Tonnes CO2e
Estimated Landfill Methane Emissions Averted: ${methaneAvertedKg.toLocaleString()} kg CH4
Delivered Batches Logged in Client State: ${deliveredLots.length} batches

---------------------------------------------------------------
PARTNER RECIPIENT INTAKE SUMMARY
---------------------------------------------------------------
- Hope Community Kitchen: Commercial Holding Capacity Logged
- St. Jude Haven: Large Scale Family Shelter Service
- Downtown Family Mission: Active Evening Dinner Line Plating

---------------------------------------------------------------
HACCP & DIGITAL CHAIN OF CUSTODY SIMULATION
---------------------------------------------------------------
Monitored lots evaluated against core thermal thresholds:
Hot Holding Threshold: >= 60.0°C
Cold Storage Threshold: <= 4.0°C
Fleet & Thermal Telemetry: Simulated Sealed Cambro Tote Readings
Signee Intake Signatures: Operational 4-digit recipient PIN

Generated by:
FOODLOOP Dispatch Logistics Engine (Demonstration Dataset)
===============================================================`;

    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FoodLoop_ESG_Impact_Report_${timeframe}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCertModalOpen(false);
    triggerToast('Report Downloaded', `FoodLoop_ESG_Impact_Report_${timeframe}.txt saved to your downloads.`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-tech-label mb-1.5 border border-emerald-500/40 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-accent animate-pulse"></span>
            <span>Verified ESG Telemetry Registry</span>
          </div>
          <h2 className="text-page-title text-white">
            Ecological &amp; Social Impact Analytics
          </h2>
          <p className="text-supporting text-sage-pale/70 mt-0.5">
            Derived directly from verified donor handoffs, digital intake receipts, and simulated EPA WARM greenhouse diversion models.
          </p>
        </div>

        {/* Timeframe Selector & Export Button */}
        <div className="flex items-center gap-3">
          <div className="bg-black/40 p-1 rounded-2xl border border-white/10 flex items-center gap-1 text-tech-label shadow-inner">
            {(['7d', '30d', '90d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl transition-all duration-150 font-semibold ${
                  timeframe === tf
                    ? 'bg-lime-accent text-forest font-bold shadow-xs'
                    : 'text-sage-pale/70 hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>ESG Audit Certificate</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Impact Metric Cards (Elevated Glass Cards with Gentle Lift) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Food Rescued */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-lime-accent flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">scale</span>
            </div>
            <span className="text-tech-label text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
              {deliveredLots.length} Delivered
            </span>
          </div>
          <div className="mt-4">
            <span className="text-tech-label text-lime-accent/90 block">Total Surplus Diverted</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-metric-value text-white">{totalKg.toLocaleString()}</span>
              <span className="text-metric-unit text-lime-accent">kg</span>
            </div>
            <p className="text-supporting text-sage-pale/70 mt-1">
              Includes {sessionDeliveredKg}kg from current verified session handoffs
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 text-tech-label text-sage-pale/50 font-normal lowercase tracking-normal">
            [Illustrative demo modeling &bull; Not real-world food]
          </div>
        </div>

        {/* Card 2: Meals Delivered */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-lime-accent/15 border border-lime-accent/25 text-lime-accent flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">restaurant</span>
            </div>
            <span className="text-tech-label text-lime-300 bg-lime-950/80 border border-lime-400/40 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
              ~2.6 meals/kg
            </span>
          </div>
          <div className="mt-4">
            <span className="text-tech-label text-lime-accent/90 block">Nourishing Meals Served</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-metric-value text-white">~{totalMeals.toLocaleString()}</span>
              <span className="text-metric-unit text-lime-accent">meals</span>
            </div>
            <p className="text-supporting text-sage-pale/70 mt-1">Distributed across 5 regional shelter hubs</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 text-tech-label text-sage-pale/50 font-normal lowercase tracking-normal">
            [Illustrative demo modeling &bull; Not real-world food]
          </div>
        </div>

        {/* Card 3: GHG Emissions Avoided */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-lime-accent flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">co2</span>
            </div>
            <span className="text-tech-label text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
              EPA WARM
            </span>
          </div>
          <div className="mt-4">
            <span className="text-tech-label text-lime-accent/90 block">CO₂e Emissions Averted</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-metric-value text-white">{co2eTons}</span>
              <span className="text-metric-unit text-lime-accent">tonnes</span>
            </div>
            <p className="text-supporting text-sage-pale/70 mt-1">Calculated at 2.2 kg CO₂e per 1 kg food waste</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 text-tech-label text-sage-pale/50 font-normal lowercase tracking-normal">
            [Illustrative demo modeling &bull; Not real-world food]
          </div>
        </div>

        {/* Card 4: Landfill Methane Suppressed */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/25 text-amber-300 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">eco</span>
            </div>
            <span className="text-tech-label text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
              Zero Landfill
            </span>
          </div>
          <div className="mt-4">
            <span className="text-tech-label text-lime-accent/90 block">Methane Generation Avoided</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-metric-value text-white">{methaneAvertedKg.toLocaleString()}</span>
              <span className="text-metric-unit text-lime-accent">kg CH₄</span>
            </div>
            <p className="text-supporting text-sage-pale/70 mt-1">Anaerobic landfill gas prevention</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 text-tech-label text-sage-pale/50 font-normal lowercase tracking-normal">
            [Illustrative demo modeling &bull; Not real-world food]
          </div>
        </div>
      </div>

      {/* Grid: Category Diversion Breakdown & Donor Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Food Category Diversion Shares (True Dynamic Computation) */}
        <div className="glass-panel-dark rounded-3xl p-6 sm:p-7 shadow-md border border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lime-accent text-[20px]">pie_chart</span>
              <h3 className="text-card-title text-white">Category Volume Distribution</h3>
            </div>
            <span className="text-tech-label text-sage-pale/80 bg-black/40 border border-white/10 px-2.5 py-0.5 rounded-md font-normal">
              Live Store Share
            </span>
          </div>

          <div className="space-y-4">
            {categoryDisplay.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-supporting">
                  <span className="font-bold text-white">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sage-pale/70 text-tech-data">{cat.kg} kg</span>
                    <span className="text-tech-data font-bold text-lime-accent bg-black/40 border border-white/10 px-2 py-0.5 rounded-md">
                      {cat.pct}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                    style={{ width: `${Math.min(100, Math.max(4, cat.pct))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl glass-subcard text-supporting text-sage-pale/80 flex items-start gap-2.5 leading-relaxed">
            <span className="material-symbols-outlined text-[18px] text-lime-accent flex-shrink-0 mt-0.5">
              verified
            </span>
            <span>
              Dynamic distribution updates in real time whenever new lots are published or delivered across the 6 platform screens.
            </span>
          </div>
        </div>

        {/* Right: Donor Leaderboard (Derived from State) */}
        <div className="glass-panel-dark rounded-3xl p-6 sm:p-7 shadow-md border border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lime-accent text-[20px]">military_tech</span>
              <h3 className="text-card-title text-white">Network Donor Leaderboard</h3>
            </div>
            <span className="text-tech-label text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
              Live Ranking
            </span>
          </div>

          <div className="space-y-3">
            {donorLeaderboard.map((donor, idx) => (
              <div
                key={donor.name}
                className="p-3.5 rounded-2xl glass-subcard hover:border-lime-accent/30 flex items-center justify-between gap-3 transition-all duration-150"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 shadow-2xs ${
                    idx === 0
                      ? 'bg-lime-accent text-forest ring-1 ring-lime-accent/50'
                      : 'bg-white/10 text-white border border-white/10'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-card-title text-white truncate">{donor.name}</h5>
                    <p className="text-supporting text-sage-pale/60 font-mono truncate">{donor.sub} &bull; {donor.count} lot{donor.count > 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-card-title text-white font-mono">{donor.kg.toLocaleString()} kg</div>
                  <div className="text-tech-label text-lime-accent font-semibold">~{donor.meals} meals</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ESG Audit Certificate Modal (Frosted Glass Dialog) */}
      {certModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity"
          onClick={() => setCertModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cert-modal-title"
        >
          <div
            className="glass-dropdown rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 border border-lime-accent/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime-accent text-forest flex items-center justify-center font-bold text-lg shadow-inner">
                  N
                </div>
                <div>
                  <h3 id="cert-modal-title" className="text-card-title text-white">Estimated ESG Summary</h3>
                  <p className="text-tech-label text-sage-pale/70 font-normal">FOODLOOP &bull; Zero-Waste Dispatch</p>
                </div>
              </div>
              <button 
                onClick={() => setCertModalOpen(false)} 
                className="text-sage-pale/60 hover:text-white transition-colors p-1 rounded-md"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-black/50 p-4 rounded-2xl border border-white/10 text-tech-data space-y-2.5 text-sage-pale shadow-inner">
              <div className="flex justify-between">
                <span className="text-sage-pale/60">Report Ref:</span>
                <span className="font-bold text-lime-accent">FL-ESG-DEMO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage-pale/60">AI Model:</span>
                <span className="text-white">NVIDIA Nemotron via {aiStatus.provider === 'nebius' ? 'Nebius Token Factory' : 'OpenRouter'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage-pale/60">Reporting Period:</span>
                <span className="text-white">Last {timeframe === '7d' ? '7 Days' : timeframe === '30d' ? '30 Days' : '90 Days'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage-pale/60">Total Rescued:</span>
                <span className="font-bold text-white">{totalKg.toLocaleString()} kg ({totalMeals.toLocaleString()} meals)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage-pale/60">Averted Carbon (Est.):</span>
                <span className="font-bold text-lime-accent">{co2eTons} Tonnes CO₂e</span>
              </div>
            </div>

            <p className="text-supporting text-sage-pale/70 leading-relaxed font-sans">
              This report provides estimated greenhouse gas diversion calculated using standard conversion factors from simulated receiving logs. Figures represent simulated operational estimates.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
                className="btn-ghost px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownloadCertificate}
                className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download Report Text</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

