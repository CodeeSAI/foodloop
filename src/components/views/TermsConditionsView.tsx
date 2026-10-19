import React, { useEffect } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';

export const TermsConditionsView: React.FC = () => {
  const { setActiveView } = useFoodLoop();

  useEffect(() => {
    document.title = 'Terms & Conditions • FOODLOOP — Zero-Waste Dispatch';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <article
      aria-labelledby="terms-title"
      className="max-w-4xl mx-auto space-y-6 text-[#F5F5EC] pb-8"
    >
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="btn-ghost px-3 py-1.5 text-xs font-mono text-lime-accent flex items-center gap-1.5 rounded-xl border border-lime-accent/30 hover:bg-lime-accent/15 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Return to Operations Command</span>
        </button>
        <span className="text-[11px] font-mono text-sage-pale/60">
          Last Updated: October 19, 2026 &bull; Version 1.2
        </span>
      </div>

      {/* Hero Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-accent/15 text-lime-accent border border-lime-accent/30 text-xs font-mono font-semibold">
          <span className="material-symbols-outlined text-[15px]">gavel</span>
          <span>Operational Terms of Service &bull; Advisory Decision Support</span>
        </div>
        <h1
          id="terms-title"
          className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans"
        >
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-[#9EB3A2] leading-relaxed font-sans">
          Please read these Terms &amp; Conditions carefully before operating <strong>FOODLOOP — Zero-Waste Dispatch</strong>. By accessing or interacting with the platform, you acknowledge and agree to the guidelines, limitations, and operational responsibilities set forth below.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-6 text-sm text-[#DDE8D8] leading-relaxed">
        {/* Section 1 */}
        <section aria-labelledby="terms-purpose" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="terms-purpose" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">verified</span>
            1. Intended Purpose &amp; Advisory Scope
          </h2>
          <p>
            FOODLOOP is designed and deployed as a <strong>logistics coordination and operational decision-support tool</strong>. The platform calculates heuristic matches, evaluates physical recipient headroom, and synthesizes proposed delivery corridors.
          </p>
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1">
            <strong>Mandatory Human-In-The-Loop Principle:</strong>
            <p className="leading-snug">
              All AI proposals and automated dispatch routes are strictly advisory. A qualified human operations lead, chef, or food safety manager must conduct physical inspection, verify food quality, and execute digital sign-off before any physical vehicle release.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section aria-labelledby="terms-safety" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="terms-safety" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">health_and_safety</span>
            2. Food Safety, HACCP &amp; Operational Responsibilities
          </h2>
          <p>
            Users and participating partner organizations retain sole operational responsibility for physical food safety:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] pl-1 font-mono">
            <li><strong className="text-white font-sans">Thermal Profile Compliance:</strong> Donors must ensure hot foods are maintained at or above 60&deg;C and chilled foods at or below 4&deg;C prior to handoff. Insulated containers (e.g. Cambro totes) must be used during transit.</li>
            <li><strong className="text-white font-sans">Allergen Declarations:</strong> Donors are legally responsible for declaring cross-contamination risks and common allergens (peanuts, gluten, dairy, fish, soy). FOODLOOP deterministic algorithms strictly block distribution to shelters with conflicting dietary mandates.</li>
            <li><strong className="text-white font-sans">Physical Receiving Probe Sign-off:</strong> Recipient intake receivers must probe and log temperature upon delivery before clearing the digital chain of custody.</li>
            <li><strong className="text-white font-sans">No Third-Party Certification:</strong> FOODLOOP does NOT provide independent legal food-safety certification (e.g., FDA, FSSAI, or ISO-22000 auditing). Participating kitchens operate under their existing municipal food service licenses.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section aria-labelledby="terms-ai-limitations" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="terms-ai-limitations" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">psychology_alt</span>
            3. AI Recommendations &amp; Deterministic Safety Hierarchy
          </h2>
          <p>
            FOODLOOP integrates large language models (such as NVIDIA Nemotron via OpenRouter/Nebius) to generate natural-language routing reasoning and contingency protocols.
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] pl-1">
            <li><strong>Hard Constraint Hierarchy:</strong> LLM proposals are strictly subordinate to deterministic safety code. If physical constraints fail (such as recipient capacity deficits or missing commercial ovens), the deterministic safety engine enforces a hard lockout that cannot be overridden by AI outputs.</li>
            <li><strong>No Guarantee of Execution:</strong> Route designations do not guarantee volunteer courier availability, real-time traffic conditions, or immediate shelter physical intake capacity.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section aria-labelledby="terms-acceptable-use" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="terms-acceptable-use" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">rule</span>
            4. Acceptable Use &amp; Prohibited Actions
          </h2>
          <p>When operating FOODLOOP, you agree not to:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] pl-1 font-mono">
            <li>Falsify temperature logs, preparation times, or expiry countdowns.</li>
            <li>Input hazardous, adulterated, or compromised food lots unfit for human consumption.</li>
            <li>Attempt to probe, reverse-engineer, or inject malicious payloads into backend AI inference endpoints (<code className="text-lime-accent">/api/ai</code>).</li>
            <li>Bypass deterministic safety lockouts or manipulate client storage to authorize unsafe pairings.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section aria-labelledby="terms-liability" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="terms-liability" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">balance</span>
            5. Limitation of Liability &amp; Disclaimers
          </h2>
          <p className="text-xs text-[#9EB3A2]">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FOODLOOP AND TEAM DUOFLASH PROVIDE THE PLATFORM &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT SHALL THE AUTHORS, CONTRIBUTORS, OR AFFILIATED PARTNERS BE LIABLE FOR DIRECT, INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM FOOD REDISTRIBUTION, INTAKE INCOMPATIBILITY, TRANSPORT DELAYS, OR THIRD-PARTY API OUTAGES.
          </p>
        </section>

        {/* Section 6 */}
        <section aria-labelledby="terms-contact" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="terms-contact" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">contact_mail</span>
            6. Inquiries &amp; Governing Context
          </h2>
          <p>
            Developed by <strong>Team DuoFlash &middot; R Sai Ganesh</strong> for the NVIDIA Global AI Hackathon.
          </p>
          <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-xs font-mono space-y-1">
            <div className="text-white font-semibold">Project: FOODLOOP — Zero-Waste Dispatch</div>
            <div className="text-sage-pale/80">Hosting: Vercel Edge Runtime</div>
            <div className="text-amber-300">[TODO: Jurisdiction &amp; Legal Forum of Record]</div>
            <div className="text-amber-300">[TODO: Registered Business Entity &amp; Official Notice Email]</div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveView('privacy')}
          className="text-lime-accent hover:underline flex items-center gap-1"
        >
          &larr; View Privacy Policy
        </button>
        <button
          type="button"
          onClick={() => setActiveView('cookies')}
          className="text-sage-pale hover:text-white hover:underline flex items-center gap-1"
        >
          View Cookie Policy &rarr;
        </button>
      </div>
    </article>
  );
};
