import React, { useEffect } from 'react';
import { useFoodLoop } from '../../context/FoodLoopContext';

export const AccessibilityView: React.FC = () => {
  const { setActiveView } = useFoodLoop();

  useEffect(() => {
    document.title = 'Accessibility Statement • FOODLOOP — Zero-Waste Dispatch';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <article
      aria-labelledby="accessibility-title"
      className="max-w-4xl mx-auto space-y-6 text-[#F5F5EC] pb-8"
    >
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="btn-ghost px-3 py-1.5 text-xs font-mono text-lime-accent flex items-center gap-1.5 rounded-xl border border-lime-accent/30 hover:bg-lime-accent/15 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-accent"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Return to Operations Command</span>
        </button>
        <span className="text-[11px] font-mono text-sage-pale/60">
          Last Updated: October 19, 2026 &bull; Status: In Continuous Evaluation
        </span>
      </div>

      {/* Hero Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-accent/15 text-lime-accent border border-lime-accent/30 text-xs font-mono font-semibold">
          <span className="material-symbols-outlined text-[15px]">accessibility_new</span>
          <span>Accessibility Engineering Target &bull; WCAG 2.2 Level AA</span>
        </div>
        <h1
          id="accessibility-title"
          className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans"
        >
          Accessibility Statement
        </h1>
        <p className="text-sm text-[#9EB3A2] leading-relaxed font-sans">
          <strong>FOODLOOP — Zero-Waste Dispatch</strong> is committed to ensuring digital accessibility for emergency food dispatch coordinators, volunteers, donors, and logistics operators of all abilities. We actively design, engineer, and refine our software targeting the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.
        </p>
      </div>

      {/* Important Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
        <span className="material-symbols-outlined text-amber-400 shrink-0 text-[20px]">info</span>
        <div>
          <span className="font-semibold block text-amber-300">Engineering Goal, Not a Legal or Third-Party Certification:</span>
          Compliance with WCAG 2.2 AA represents our deliberate software engineering standard. FOODLOOP has not undergone formal independent accreditation by an external accessibility audit authority. We treat accessibility as an iterative, continuous operational priority.
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6 text-sm text-[#DDE8D8] leading-relaxed">
        {/* Section 1: Measures Taken */}
        <section aria-labelledby="section-standards" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-standards" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">verified</span>
            1. Standards and Architectural Implementation
          </h2>
          <p>
            We target <strong>WCAG 2.2 Level AA</strong> conformance across all operational views (Dashboard, Create Donation, Recipient Matching, AI Dispatch Planner, Chain of Custody, Impact Analytics, Preferences Modal, and Legal Documentation).
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] font-mono pl-1">
            <li><strong>Perceivable:</strong> All UI elements provide readable text alternatives, clear typographic hierarchy, scalable units (rem/em), and color contrast ratios exceeding 4.5:1 for standard body text and 3:1 for large headlines and interactive boundaries.</li>
            <li><strong>Operable:</strong> The entire workflow is operable via keyboard alone without trapped focus, including modal dialogs, route tabs, and action triggers.</li>
            <li><strong>Understandable:</strong> Clear input labels, visible validation states, and unambiguous status indicators that never rely solely on color to convey meaning.</li>
            <li><strong>Robust:</strong> Strict semantic HTML5 landmarks (<code className="text-lime-accent/90">&lt;header&gt;</code>, <code className="text-lime-accent/90">&lt;main&gt;</code>, <code className="text-lime-accent/90">&lt;nav&gt;</code>, <code className="text-lime-accent/90">&lt;footer&gt;</code>, <code className="text-lime-accent/90">&lt;article&gt;</code>) and ARIA attributes compatible across standard screen readers.</li>
          </ul>
        </section>

        {/* Section 2: Visual and Contrast Auditing */}
        <section aria-labelledby="section-visual" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-visual" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">palette</span>
            2. Typography, Contrast & Color Independence
          </h2>
          <p>
            FOODLOOP employs a high-contrast dark forest palette (<code className="text-lime-accent">#04150F</code> canvas, <code className="text-lime-accent">#07241A</code> surfaces, and high-luminance lime accent <code className="text-lime-accent">#A3E635</code>).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
            <div className="p-3 rounded-lg bg-black/20 border border-white/10 space-y-1">
              <span className="text-white font-bold block">Contrast Compliance:</span>
              <p className="text-[#9EB3A2]">Standard text (#F5F5EC on #07241A) exceeds 12.8:1 contrast. Secondary labels (#9EB3A2 on #07241A) maintain ~5.2:1, surpassing the 4.5:1 minimum threshold.</p>
            </div>
            <div className="p-3 rounded-lg bg-black/20 border border-white/10 space-y-1">
              <span className="text-white font-bold block">Non-Color Signaling:</span>
              <p className="text-[#9EB3A2]">All risk levels (CRITICAL, ELEVATED, NOMINAL) and validation alerts include text labels and distinctive Material Symbols glyphs (warning triangles, shields, checkmarks).</p>
            </div>
          </div>
          <p className="text-xs text-[#9EB3A2]">
            Zooming: The application does not disable viewport scaling. Text and layout scale smoothly up to 200% zoom without clipping or requiring dual-axis scrolling on standard monitors.
          </p>
        </section>

        {/* Section 3: Keyboard and Focus Management */}
        <section aria-labelledby="section-keyboard" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-keyboard" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">keyboard</span>
            3. Keyboard Navigation & Modal Focus Trapping
          </h2>
          <p>
            Keyboards are primary input devices. The following behaviors are strictly engineered:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#9EB3A2] font-mono pl-1">
            <li><strong>Visible Focus Rings:</strong> High-visibility lime outline rings (<code className="text-lime-accent">outline: 2px solid #A3E635</code>) trigger on <code className="text-lime-accent">:focus-visible</code> for all buttons, inputs, links, and cards.</li>
            <li><strong>Modal Focus Containment:</strong> The Operational Report and Preferences dialog mounts at document body level with trapped tab focus. Pressing <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-white">Tab</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-white">Shift+Tab</kbd> cycles inside the dialog without leaking to background elements.</li>
            <li><strong>Escape Key Handling:</strong> Pressing <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-white">Escape</kbd> immediately dismisses active modal dialogues and restores focus to the invoking trigger button.</li>
            <li><strong>Screen Reader Feedback:</strong> Live dispatch pipelines utilize <code className="text-lime-accent">aria-live=&quot;polite&quot;</code> regions for status updates without disorienting audio interruptions.</li>
          </ul>
        </section>

        {/* Section 4: Motion Preferences */}
        <section aria-labelledby="section-motion" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-motion" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">motion_photos_off</span>
            4. Motion & Sensory Considerations
          </h2>
          <p>
            FOODLOOP respects the <code className="text-lime-accent">prefers-reduced-motion</code> operating system setting. When enabled, non-essential transitions, radar pulse rings, and progress animations are automatically suppressed or reduced to instant state changes to prevent vestibular discomfort.
          </p>
        </section>

        {/* Section 5: Known Limitations and Feedback */}
        <section aria-labelledby="section-limitations" className="p-5 rounded-2xl bg-[#07241A]/90 border border-white/10 space-y-2.5">
          <h2 id="section-limitations" className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-accent text-[18px]">contact_support</span>
            5. Accessibility Feedback & Contact
          </h2>
          <p>
            We welcome constructive feedback regarding accessibility barriers encountered during operational usage.
          </p>
          <div className="p-3 rounded-lg bg-black/30 border border-white/10 text-xs font-mono space-y-1">
            <p className="text-white">Engineering & Stewardship Lead: <strong>Team DuoFlash &bull; R Sai Ganesh</strong></p>
            <p className="text-[#9EB3A2]">Repository & Issue Tracking: <a href="https://github.com/duoflash-foodloop" target="_blank" rel="noreferrer" className="text-lime-accent underline focus-visible:outline-lime-accent">GitHub Issues Tracker</a></p>
            <p className="text-[#9EB3A2]">Direct Contact: <span className="text-amber-300 font-bold">[TODO: Insert Dedicated Organization Accessibility Email & Postal Address]</span></p>
            <p className="text-white/60">Expected response window for accessibility inquiries: 3 business days.</p>
          </div>
        </section>
      </div>

      {/* Footer Return Link */}
      <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="text-lime-accent hover:underline flex items-center gap-1 font-mono focus-visible:outline-lime-accent"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          <span>Return to Dashboard</span>
        </button>
        <span className="text-sage-pale/60 font-mono">
          FOODLOOP Accessibility Protocol &bull; Rev 1.1
        </span>
      </div>
    </article>
  );
};
