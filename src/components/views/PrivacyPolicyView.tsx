import React, { useEffect } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';

export const PrivacyPolicyView: React.FC = () => {
  const { setActiveView } = useFoodLoop();

  useEffect(() => {
    document.title = 'Privacy Policy • FOODLOOP — Zero-Waste Dispatch';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <article
      aria-labelledby="privacy-title"
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
          Effective Date: October 19, 2026 &bull; Version 1.2
        </span>
      </div>

      {/* Hero Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-accent/15 text-lime-accent border border-lime-accent/30 text-xs font-mono font-semibold">
          <span className="material-symbols-outlined text-[15px]">security</span>
          <span>Verified Transparency &bull; Zero Tracking Cookies</span>
        </div>
        <h1
          id="privacy-title"
          className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans"
        >
          Privacy Policy
        </h1>
        <p className="text-sm text-[#9EB3A2] leading-relaxed font-sans">
          This Privacy Policy transparently describes how <strong>FOODLOOP — Zero-Waste Dispatch</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;) processes, stores, and handles operational data when you utilize our surplus food logistics coordination platform.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-6 text-sm text-[#DDE8D8] leading-relaxed">
        {/* Section 1 */}
        <section aria-labelledby="section-info-collected" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-info-collected" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">edit_note</span>
            1. Information Users Provide Directly
          </h2>
          <p>
            When utilizing FOODLOOP, users declare perishable surplus batches and configure operations. We collect and store:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] font-mono pl-1">
            <li><strong className="text-white font-sans">Surplus Food Lot Declarations:</strong> Food item title, category (hot meals, bakery, produce, dairy, pantry), quantity in kilograms, estimated serving count, packaging type, storage temperature requirements, expiry timestamps, and declared allergens/dietary restrictions.</li>
            <li><strong className="text-white font-sans">Commercial Kitchen Profiles:</strong> Donor business name, internal prep kitchen identifier, station/loading bay, and street address.</li>
            <li><strong className="text-white font-sans">Recipient Shelter Details:</strong> Facility designation, intake capacity headroom, dietary mandate rules, cold chain capabilities, and warming equipment specifications.</li>
            <li><strong className="text-white font-sans">Digital Chain of Custody Proofs:</strong> Recipient receiving signee names, handoff verification timestamps, digital PIN confirmations, and physical intake probe temperatures.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section aria-labelledby="section-storage" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-storage" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">storage</span>
            2. Local Storage Architecture &amp; Zero Tracking Cookies
          </h2>
          <p>
            FOODLOOP operates on a <strong>client-first local data model</strong>. All surplus lots, recipient states, courier assignments, and UI preferences are stored locally in your web browser&rsquo;s <code className="text-lime-accent font-mono text-xs">localStorage</code>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
              <span className="text-lime-accent font-semibold block">foodloop_donations_v2</span>
              <span className="text-sage-pale/70 text-[11px]">Stores current and newly created surplus batches.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
              <span className="text-lime-accent font-semibold block">foodloop_recipients_v2</span>
              <span className="text-sage-pale/70 text-[11px]">Maintains participating shelter intake loads.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
              <span className="text-lime-accent font-semibold block">foodloop_selected_kitchen_id</span>
              <span className="text-sage-pale/70 text-[11px]">Remembers active commercial kitchen context.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
              <span className="text-lime-accent font-semibold block">foodloop_pref_temp_unit / contrast</span>
              <span className="text-sage-pale/70 text-[11px]">Stores temperature scale and high-contrast toggles.</span>
            </div>
          </div>
          <p className="text-xs text-[#9EB3A2] pt-1">
            <strong>Cookie Guarantee:</strong> We do NOT set HTTP tracking cookies, marketing pixels, or third-party behavioral analytics scripts. Data stored in your browser remains on your device until manually deleted or reset using the platform&rsquo;s &ldquo;Reset Demo Data&rdquo; button.
          </p>
        </section>

        {/* Section 3 */}
        <section aria-labelledby="section-ai-processing" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-ai-processing" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">psychology</span>
            3. Third-Party AI Processing (OpenRouter &amp; NVIDIA Nemotron)
          </h2>
          <p>
            When utilizing the <strong>AI Dispatch Planner</strong>, operational parameters are transmitted to serverless inference endpoints to generate route synthesis and multi-criteria trade-offs:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] pl-1 font-mono">
            <li><strong className="text-white font-sans">Upstream Providers:</strong> OpenRouter API (<code className="text-lime-accent">openrouter.ai</code>) hosting <code className="text-white">nvidia/nemotron-3.5-lightning:free</code>, or Nebius Token Factory (<code className="text-white">tokenfactory.nebius.com</code>).</li>
            <li><strong className="text-white font-sans">Transmitted Payload:</strong> Food category, weight in kilograms, storage temperature requirements, and candidate shelter capacity headroom.</li>
            <li><strong className="text-white font-sans">PII Protection:</strong> No personal donor identification, financial data, or consumer passwords are ever included in AI prompts.</li>
            <li><strong className="text-white font-sans">Deterministic Fallback:</strong> If third-party AI endpoints are unavailable or timed out, processing instantly falls back to an offline deterministic engine without remote transmission.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section aria-labelledby="section-hosting" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-hosting" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">cloud</span>
            4. Hosting &amp; Technical Subprocessors
          </h2>
          <p>
            The platform is hosted and served via:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] pl-1 font-mono">
            <li><strong className="text-white font-sans">Vercel Inc.:</strong> Cloud hosting and Edge network delivery. Vercel processes standard HTTP requests and transient serverless proxy calls without storing application state in persistent databases.</li>
            <li><strong className="text-white font-sans">Google Fonts CDN:</strong> Delivers typography (<code className="text-white">Plus Jakarta Sans</code> and <code className="text-white">JetBrains Mono</code>) directly via Google CDN servers.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section aria-labelledby="section-user-rights" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-user-rights" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">verified_user</span>
            5. User Rights &amp; Data Erasure (DPDP Act &amp; Global Frameworks)
          </h2>
          <p>
            In alignment with India&rsquo;s <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> and international data privacy principles:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] pl-1">
            <li><strong>Right to Access &amp; Portability:</strong> You can view all active lots and export full operational datasets anytime via the &ldquo;Export JSON&rdquo; and &ldquo;Export CSV&rdquo; features in the Session Report.</li>
            <li><strong>Right to Correction &amp; Erasure:</strong> Clicking <em>&ldquo;Reset Demo Data&rdquo;</em> in the sidebar or profile menu immediately and irreversibly wipes all newly created lots and handoff records from your browser.</li>
            <li><strong>No Cloud Accounts:</strong> Because FOODLOOP operates without user accounts or server-side databases, clearing your browser site data immediately removes all session residue.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section aria-labelledby="section-contact" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-contact" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">contact_support</span>
            6. Ownership &amp; Grievance Redressal
          </h2>
          <p>
            FOODLOOP is developed as a hackathon engineering prototype by <strong>Team DuoFlash &middot; R Sai Ganesh</strong>. For questions regarding data processing or technical inquiries, contact:
          </p>
          <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-xs font-mono space-y-1">
            <div className="text-white font-semibold">Development Team: Team DuoFlash (Lead: R Sai Ganesh)</div>
            <div className="text-sage-pale/80">Entity Status: Hackathon Engineering Prototype</div>
            <div className="text-amber-300">[TODO: Operating Entity Legal Name &amp; Registration ID]</div>
            <div className="text-amber-300">[TODO: Official Grievance Officer Email &amp; Postal Address]</div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="text-lime-accent hover:underline flex items-center gap-1"
        >
          &larr; Back to Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveView('terms')}
          className="text-sage-pale hover:text-white hover:underline flex items-center gap-1"
        >
          View Terms &amp; Conditions &rarr;
        </button>
      </div>
    </article>
  );
};
