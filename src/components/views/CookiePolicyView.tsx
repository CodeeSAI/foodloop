import React, { useEffect } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';

export const CookiePolicyView: React.FC = () => {
  const { setActiveView, requestResetDemoData } = useFoodLoop();

  useEffect(() => {
    document.title = 'Cookie & Storage Policy • FOODLOOP — Zero-Waste Dispatch';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <article
      aria-labelledby="cookie-title"
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
          <span className="material-symbols-outlined text-[15px]">cookie</span>
          <span>Zero Cookies Used &bull; 100% Essential Client Web Storage</span>
        </div>
        <h1
          id="cookie-title"
          className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans"
        >
          Cookie &amp; Client Storage Policy
        </h1>
        <p className="text-sm text-[#9EB3A2] leading-relaxed font-sans">
          This policy explains our data storage practices. In short: <strong>FOODLOOP sets zero tracking cookies</strong> and relies solely on strictly essential client-side web storage (<code className="text-lime-accent">localStorage</code>) to enable application functionality without remote databases.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-6 text-sm text-[#DDE8D8] leading-relaxed">
        {/* Section 1 */}
        <section aria-labelledby="section-cookies-status" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-cookies-status" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">verified</span>
            1. Zero HTTP Cookies Statement
          </h2>
          <p>
            FOODLOOP does <strong>NOT</strong> set, read, or transmit any HTTP cookies to your browser. Specifically:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] pl-1 font-mono">
            <li><strong className="text-white font-sans">No Session Tracking Cookies:</strong> No authentication tokens or session IDs are stored in cookies.</li>
            <li><strong className="text-white font-sans">No Advertising or Marketing Pixels:</strong> We do not deploy Meta Pixel, Google Ads, or affiliate beacons.</li>
            <li><strong className="text-white font-sans">No Third-Party Analytics Scripts:</strong> No telemetry scripts (e.g. Google Analytics, Hotjar, Mixpanel) are loaded or executed.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section aria-labelledby="section-web-storage" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-3">
          <h2 id="section-web-storage" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">inventory_2</span>
            2. Web Storage (HTML5 localStorage) Inventory
          </h2>
          <p>
            Unlike cookies, which are automatically attached to every web request, HTML5 Web Storage (<code className="text-lime-accent">localStorage</code>) stays strictly on your local computer and is never transmitted automatically over HTTP headers.
          </p>
          <p className="text-xs text-[#9EB3A2]">
            Below is the complete, exhaustive audit of every storage key utilized by FOODLOOP:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-lime-accent">
                  <th className="py-2 pr-3 font-bold">Storage Key</th>
                  <th className="py-2 pr-3 font-bold">Category</th>
                  <th className="py-2 pr-3 font-bold">Purpose</th>
                  <th className="py-2 font-bold">Retention / Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sage-pale">
                <tr>
                  <td className="py-2.5 pr-3 text-white font-semibold">foodloop_donations_v2</td>
                  <td className="py-2.5 pr-3 text-emerald-300">Strictly Essential</td>
                  <td className="py-2.5 pr-3">Stores active surplus food batches, preparation timestamps, and delivery milestones.</td>
                  <td className="py-2.5 text-sage-pale/70">Persistent until reset or cache clear</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 text-white font-semibold">foodloop_recipients_v2</td>
                  <td className="py-2.5 pr-3 text-emerald-300">Strictly Essential</td>
                  <td className="py-2.5 pr-3">Maintains shelter intake capacity limits, equipment flags, and dietary mandates.</td>
                  <td className="py-2.5 text-sage-pale/70">Persistent until reset or cache clear</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 text-white font-semibold">foodloop_couriers_v2</td>
                  <td className="py-2.5 pr-3 text-emerald-300">Strictly Essential</td>
                  <td className="py-2.5 pr-3">Tracks courier vehicle plate numbers, compartment temperatures, and assignments.</td>
                  <td className="py-2.5 text-sage-pale/70">Persistent until reset or cache clear</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 text-white font-semibold">foodloop_selected_kitchen_id</td>
                  <td className="py-2.5 pr-3 text-emerald-300">Strictly Essential</td>
                  <td className="py-2.5 pr-3">Remembers the currently selected active kitchen scope (e.g. Grand Hyatt Central).</td>
                  <td className="py-2.5 text-sage-pale/70">Persistent until reset or cache clear</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 text-white font-semibold">foodloop_pref_temp_unit</td>
                  <td className="py-2.5 pr-3 text-lime-accent">User Preference</td>
                  <td className="py-2.5 pr-3">Stores operator preference for temperature telemetry display (&deg;C vs &deg;F).</td>
                  <td className="py-2.5 text-sage-pale/70">Persistent until manual change</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 text-white font-semibold">foodloop_pref_contrast</td>
                  <td className="py-2.5 pr-3 text-lime-accent">Accessibility Preference</td>
                  <td className="py-2.5 pr-3">Stores operator toggle for enhanced high-contrast visual borders.</td>
                  <td className="py-2.5 text-sage-pale/70">Persistent until manual change</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3 */}
        <section aria-labelledby="section-consent-assessment" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-consent-assessment" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">gavel</span>
            3. Regulatory Assessment &amp; Banner Exemption
          </h2>
          <p>
            Under international privacy regulations (such as EU ePrivacy Directive 2002/58/EC and GDPR Recital 30) as well as India&rsquo;s <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>:
          </p>
          <div className="p-3.5 rounded-xl bg-white/4 border border-white/8 text-xs space-y-1.5">
            <span className="text-lime-accent font-mono font-bold block">Why No Annoying Cookie Banner is Displayed:</span>
            <p className="text-sage-pale/90 leading-relaxed">
              Storage mechanisms that are <em>strictly necessary</em> to deliver an explicit service requested by the user (in this case, rendering surplus food lots in an offline-capable web application) are exempt from cookie consent banner mandates. Because FOODLOOP uses zero non-essential marketing, behavioral, or tracking scripts, displaying a deceptive or redundant cookie popup would constitute an unnecessary dark pattern.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section aria-labelledby="section-management" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-3">
          <h2 id="section-management" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">cleaning_services</span>
            4. Managing &amp; Clearing Client Storage
          </h2>
          <p>You maintain complete control over all data stored by FOODLOOP:</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/4 border border-white/8">
            <div>
              <span className="text-white font-bold block text-xs">Instant In-App Data Reset</span>
              <span className="text-[11px] text-sage-pale/70 font-mono">Wipes all custom donations and restores seed demo records.</span>
            </div>
            <button
              type="button"
              onClick={requestResetDemoData}
              className="btn-destructive px-3.5 py-1.5 text-xs font-mono font-bold flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              <span>Reset Demo State</span>
            </button>
          </div>
          <p className="text-xs text-[#9EB3A2]">
            You can also clear all storage at any time via your browser settings: Open Developer Tools (F12) &rarr; Application &rarr; Local Storage &rarr; Clear All, or via your browser&rsquo;s &ldquo;Clear Site Data&rdquo; control.
          </p>
        </section>

        {/* Section 5 */}
        <section aria-labelledby="section-cookie-contact" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-cookie-contact" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">contact_support</span>
            5. Inquiries &amp; Policy Updates
          </h2>
          <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-xs font-mono space-y-1">
            <div className="text-white font-semibold">Author: Team DuoFlash &middot; R Sai Ganesh</div>
            <div className="text-amber-300">[TODO: Dedicated Privacy &amp; Technical Compliance Email]</div>
            <div className="text-amber-300">[TODO: Operating Entity Legal Name]</div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveView('terms')}
          className="text-lime-accent hover:underline flex items-center gap-1"
        >
          &larr; View Terms &amp; Conditions
        </button>
        <button
          type="button"
          onClick={() => setActiveView('accessibility')}
          className="text-sage-pale hover:text-white hover:underline flex items-center gap-1"
        >
          View Accessibility Statement &rarr;
        </button>
      </div>
    </article>
  );
};
