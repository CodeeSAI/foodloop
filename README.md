# FOODLOOP — Zero-Waste Dispatch
> **Made by Team DuoFlash · R Sai Ganesh**  
> *Deployment: Vercel • Primary Brand: FOODLOOP — Zero-Waste Dispatch*

FOODLOOP is a mission-critical surplus food redistribution engine that bridges commercial surplus kitchens (hotels, convention centers, markets, bakeries) with community recipient shelters. It pairs deterministic food-safety algorithms with **NVIDIA Nemotron** inference for real-time dispatch synthesis, multi-criteria trade-off evaluation, and chain-of-custody tracking.

---

## 🌟 Key Highlights & Engineering Architecture

1. **Google Stitch Design System & Dark Forest Aesthetics**:
   - High-contrast, dark forest-green interface (`#061C14` canvas, `#07241A` surface, `#A3E635` / `#C8F169` lime accent, `#DDE8D8` pale sage).
   - Accessible typographic hierarchy pairing **Plus Jakarta Sans** for UI controls with **JetBrains Mono** for HACCP thermal telemetry, batch tags, and timestamps.
   - Responsive design verified across 390px mobile, 768px tablet, and 1440px desktop viewports.

2. **NVIDIA Nemotron via OpenRouter / Nebius Backend (`/api/ai`)**:
   - **Supported Endpoints**: Serverless API `/api/ai` proxying requests to OpenRouter (`meta-llama/llama-3.1-70b-instruct` / `nvidia/llama-3.1-nemotron-70b-instruct`) or Nebius Token Factory.
   - **Server-Side Security**: All AI inference calls execute strictly on the server-side backend. No API keys or tokens are ever exposed to client bundles or browser storage.
   - **Deterministic Safety Guardrails**: Hard constraints (allergen mandates, shelter physical capacity, HACCP holding temperatures >= 60°C or <= 4°C, safe transit windows) are enforced deterministically in application code (`src/utils/constraintEngine.ts`). AI recommendations never bypass deterministic safety lockouts.
   - **Clear Execution State Distinction**: The platform explicitly distinguishes between live inference, deterministic fallback, and simulation. Latency is measured from actual network round-trips.

3. **Complete End-to-End Operational Lifecycle**:
   - **1. Operations Dashboard**: Metric ribbon, active batches stream, urgent countdown timers (<90m), category & donor organization filters, and shelter intake visualizers.
   - **2. Create Surplus Donation**: Category picker, weight (kg), servings, HACCP temperatures, allergen tags, and dynamic ESG forecast.
   - **3. Recipient Matching**: Deterministic matching matrix evaluating shelter capacity headroom, allergen mandates, equipment, and transit windows, with explicit rejection explanations for ineligible shelters.
   - **4. AI Coordination Planner**: 6-stage decision pipeline (Received → Filtered → Ranked → Synthesized → Verified → Sign-off) with human operator sign-off and safety lockout guards.
   - **5. Chain of Custody & Handoff**: Corridor map, simulated IoT temperature telemetry, courier dispatch, and interactive digital handoff modal (PIN, temp probe, recipient signee).
   - **6. Impact Analytics**: ESG registry with 7d/30d/90d toggles, meal calculations, EPA WARM carbon avoidance estimates, category volume shares, donor leaderboard, and ESG report text export.

4. **Direct SPA Legal & Compliance Routing**:
   - Clean, direct URL routing with full page-refresh support on Vercel:
     - `/privacy-policy` — Comprehensive DPDP Act 2023 / GDPR-aligned privacy disclosure, third-party subprocessor accounting, and local storage lifecycle.
     - `/terms` — Terms of Service detailing operator review responsibilities, deterministic safety hierarchy, and realistic liability limits.
     - `/cookie-policy` — Granular storage audit detailing all `localStorage` keys, lifecycles, and zero-cookie verification.
     - `/accessibility` — WCAG 2.2 Level AA accessibility statement, contrast specifications, keyboard navigation guidelines, and contact channels.
   - Responsive, persistent global footer across all views displaying:
     `FOODLOOP — Zero-Waste Dispatch` &bull; `Made by Team DuoFlash · R Sai Ganesh`.

---

## 🍪 Cookie Consent Assessment & Regulatory Compliance

A comprehensive code-level audit was conducted across the entire FOODLOOP codebase to determine whether a cookie consent banner is legally required:

### Audit Findings:
1. **Zero HTTP Cookies**: The application sets, reads, and transmits **zero** HTTP cookies (`document.cookie` is unused).
2. **Zero Third-Party Tracking**: No analytics scripts (Google Analytics, Mixpanel, Segment), advertising pixels (Meta Pixel), social trackers, or behavioral fingerprinting tools are installed or loaded.
3. **Strictly Essential Client Storage**: Browser storage is confined strictly to functional `localStorage` items essential to provide the user-requested application services:
   - `foodloop_donations_v2`: Persists user-created surplus food rescue lots.
   - `foodloop_recipients_v2`: Persists shelter intake capacities and allocations.
   - `foodloop_couriers_v2`: Persists courier fleet transit assignments.
   - `foodloop_selected_kitchen_id`: Remembers the active commercial donor kitchen context.

### Regulatory Exemption Determination:
- **EU ePrivacy Directive (Directive 2002/58/EC, Art. 5(3))**: Strictly functional storage necessary to provide an Information Society service explicitly requested by the user is **exempt** from consent requirements.
- **India Digital Personal Data Protection (DPDP) Act 2023**: Processing strictly functional operational data for purposes explicitly initiated by the user falls under legitimate operational usage; non-essential profiling or tracking consent mechanisms do not apply.
- **Decision**: Because no non-essential tracking exists, **an intrusive cookie consent banner is not required and would be misleading to users**. A full transparent audit is published on the `/cookie-policy` page and users are provided with an instant, one-click **"Clear Local Application Storage"** control in the application interface.

---

## ♿ Accessibility Engineering Target (WCAG 2.2 Level AA)

Accessibility is treated as an active engineering objective throughout FOODLOOP:

1. **Typographic Legibility & Viewport Freedom**:
   - Scalable typography with minimum body text sizes >= 14–16px.
   - Viewport scaling is enabled (`<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`), supporting seamless user zoom up to 200% without clipping or layout breakage.
2. **Contrast Standards**:
   - High-contrast dark forest palette (`#F5F5EC` on `#07241A`) achieves a contrast ratio exceeding **12.8:1** (far exceeding the 4.5:1 WCAG AA threshold).
   - Secondary labels (`#9EB3A2` on `#07241A`) maintain **~5.2:1** contrast.
   - Status indicators pair colors with text labels and unique Material Symbols icons to ensure no status is conveyed through color alone.
3. **Keyboard & Screen Reader Support**:
   - Visible high-contrast focus rings (`focus-visible:outline-2 focus-visible:outline-lime-accent`) on all interactive controls.
   - The Operational Report / Preferences modal mounts directly to `document.body` via React Portals with solid dark backdrop (`#061D15`), internal scrolling, body scroll locking, trapped Tab focus, and `Escape` key dismissal with focus restoration.
   - Dynamic dispatch updates utilize `aria-live="polite"` regions.
4. **Motion Preferences**:
   - Respects `prefers-reduced-motion` to suppress decorative pulses, radar rings, and transitions for users with vestibular sensitivities.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js `v18+` or `v20+` (tested on Node `v24+`)
- npm `v9+` or `v11+`

### 2. Installation
```bash
git clone <repo-url>
cd stitch_foodloop_surplus_rescue_platform
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your credentials:
```env
# OpenRouter or Nebius API Key
OPENROUTER_API_KEY=your_api_key_here
# Optional: Nebius Token Factory Key
NEBIUS_API_KEY=your_nebius_key_here
```
> **Note**: If no API key is provided, FOODLOOP automatically operates in **Deterministic Fallback Mode**, allowing full evaluation without credentials.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 5. Automated Verification Commands
```bash
# Run deterministic safety tests, workflow state, and regression tests
npm test

# Run TypeScript type check
npm run lint

# Run production build
npm run build
```

---

## ☁️ Vercel Deployment

FOODLOOP is pre-configured for Vercel deployment:
- `vercel.json` provides serverless function routing (`/api/ai`) and client-side SPA routing (`/(.*)` -> `/index.html`) so that direct visits and refreshes on `/privacy-policy`, `/terms`, `/cookie-policy`, and `/accessibility` work out of the box.

---

## ⚖️ Legal & Trust Notices
- **Human Oversight Required**: All AI-generated dispatch routes and recipient pairings are decision-support recommendations. Human operators must inspect and verify food condition, temperature, and allergens before dispatch.
- **Deterministic Food Safety Hierarchy**: In any conflict between AI outputs and HACCP rules, deterministic safety logic strictly overrides AI suggestions.
- **Demonstration Data Notice**: All donor kitchens, shelters, and telemetry streams in this demo dataset are illustrative simulations.
