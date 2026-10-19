---
name: Ecological Intelligence
colors:
  surface: '#f3fcef'
  surface-dim: '#d4ddd0'
  surface-bright: '#f3fcef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf6e9'
  surface-container: '#e8f0e4'
  surface-container-high: '#e2ebde'
  surface-container-highest: '#dce5d9'
  on-surface: '#161d16'
  on-surface-variant: '#414844'
  inverse-surface: '#2a322a'
  inverse-on-surface: '#eaf3e7'
  outline: '#717974'
  outline-variant: '#c1c8c2'
  surface-tint: '#3f6655'
  primary: '#00271a'
  on-primary: '#ffffff'
  primary-container: '#153d2e'
  on-primary-container: '#7fa894'
  inverse-primary: '#a6d0bb'
  secondary: '#1d6b49'
  on-secondary: '#ffffff'
  secondary-container: '#a6f3c7'
  on-secondary-container: '#25714e'
  tertiary: '#192500'
  on-tertiary: '#ffffff'
  tertiary-container: '#2b3c00'
  on-tertiary-container: '#87ac2b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecd6'
  primary-fixed-dim: '#a6d0bb'
  on-primary-fixed: '#002115'
  on-primary-fixed-variant: '#274e3e'
  secondary-fixed: '#a6f3c7'
  secondary-fixed-dim: '#8bd6ac'
  on-secondary-fixed: '#002112'
  on-secondary-fixed-variant: '#005234'
  tertiary-fixed: '#c8f169'
  tertiary-fixed-dim: '#add450'
  on-tertiary-fixed: '#151f00'
  on-tertiary-fixed-variant: '#394d00'
  background: '#f3fcef'
  on-background: '#161d16'
  surface-variant: '#dce5d9'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies premium sustainability-tech: an operational interface built for mission-critical logistics, automated surplus redistribution, and high-velocity food rescue coordination. It merges ecological stewardship with technical rigor. 

The aesthetic operates at the intersection of modern enterprise software and restrained editorial publication. It discards playful, low-stakes consumer cues in favor of crisp administrative density, generous spatial rhythm, and absolute information clarity. Visual elements communicate trust, speed, and real-time operational efficiency. Surfaces feel tactile yet digital, leveraging warm, organic background casts framed by precise geometric structure. Micro-interactions are brief, functional, and non-distracting.

## Colors

The palette establishes an authoritative ecological tone backed by precise status markers.

- **Primary Canvas (`#F7F7F0`):** A warm ivory that replaces sterile blue-tinted whites, reducing fatigue while introducing an organic, human substrate.
- **Primary Brand (`#153D2E`):** Deep forest green. Deployed for dominant structural components, prominent headers, primary action buttons, and critical framing.
- **Secondary Green (`#287451`):** A mid-spectrum botanical green used for secondary indicators, active hover states, and navigational accents.
- **Accent Lime (`#C8F169`):** High-energy, luminous chartreuse. Used sparingly for critical attention triggers, AI-matching certainty indicators, real-time dispatch pulses, and high-priority progress metrics. Never used for long-form text.
- **Neutral Charcoal (`#202820`):** A deep, warm-tinted soot engineered for maximum legibility on ivory and muted panels without the harshness of pure black.
- **Muted Surfaces (`#ECEFE5`):** Secondary structural fill for nested tables, stat cards, toolbars, and inactive tags.
- **Border Tone (`#E2E6DC`):** Hairline precision divider used across card perimeters and data grids.
- **Operational Signals:** Warm Amber (`#E6A23C`) for spoilage thresholds and dynamic time windows; Restrained Crimson (`#C94C4C`) for transit failures, allocation dropouts, and urgent inventory alerts.

## Typography

The typographic hierarchy combines **Plus Jakarta Sans** for clear, humanist, editorial precision with **JetBrains Mono** for mission-critical telemetry, data tables, volume counts, and operational status metadata.

Headlines leverage tight tracking (`-0.02em`) and decisive weights to project competence and urgency. Body text maintains comfortable reading proportions against warm neutral containers. Monospaced metadata tags anchor dispatch timestamps, cold-chain temperature metrics, and weight volumes, giving the interface the tactile authority of an industrial flight recorder.

## Layout & Spacing

The system runs on an 8pt structural rhythm integrated into a responsive 12-column fluid grid on desktop displays (collapsing to 8 columns on tablet and 4 columns on mobile). 

- **Outer Margins:** Sized intentionally wide (`margin: 3rem`) on desktop to foster an expansive, unhurried operational layout, framing data density with composed calm. On mobile devices, margins compress to `1rem` to preserve screen real estate.
- **Gutters:** Kept at a standard `1.5rem` between grid columns, providing clear spatial delineation between disparate telemetry streams.
- **Component Padding Scale:** Small spaces (`space-xs: 4px`, `space-sm: 8px`) govern label-to-input pairings and inner tag margins. Base gaps (`space-md: 16px`, `space-lg: 24px`) control card interiors and form row gaps. Large steps (`space-xl: 40px`) define section breaks within operational dashboards.

## Elevation & Depth

Visual hierarchy uses **tonal layering and low-contrast outlines** over dramatic dropshadows. 

- **Surface Tiers:** The canvas root sits at `#F7F7F0`. Primary modules and actionable workspaces rest on stark white (`#FFFFFF`) or soft sage containers (`#ECEFE5`). 
- **Outlines:** All cards, panels, and floating bars rely on a razor-thin `1px` border using `#E2E6DC`. This produces a crisp architectural presence without muddying the visual balance.
- **Ambient Shadow:** Reserved exclusively for floating elements (overlays, active flyout drawers, dropdown menus). When applied, shadows are warm and diffused: `0 8px 30px -4px rgba(21, 61, 46, 0.06), 0 2px 6px -1px rgba(21, 61, 46, 0.04)`. Shadows carry an undertone of the primary forest green, preventing dead gray falloffs.

## Shapes

The interface employs a balanced curvature (`roundedness: 2`). Panels, cards, and modal sheets use a `0.5rem` (8px) base radius, scaling to `1rem` (16px) for major dashboard cards and outer surface groupings (`rounded-lg`). 

Status chips, dispatch tags, and metric indicators use fully rounded pill profiles (`9999px`) to visually contrast against the square geometry of data tables and structural framing. This deliberate contrast makes vital metrics instantly recognizable across high-density logistics dashboards.

## Components

### Buttons
- **Primary:** Forest green background (`#153D2E`), white text, `8px` corner radius, `space-sm` vertical by `space-md` horizontal padding. Hover shifts to `#287451` with a subtle `translateY(-1px)`.
- **Secondary:** Surface tint (`#ECEFE5`), `#153D2E` text, `1px` border (`#E2E6DC`). Hover triggers subtle border darken to `#287451`.
- **Accent / Dispatch:** High-visibility lime (`#C8F169`) paired with `#153D2E` bold typography for critical actions such as "Confirm Route" or "Execute Transfer."

### Chips & Pill Badges
- Pill geometry (`border-radius: 9999px`) with JetBrains Mono `label-sm` tracking.
- **Dynamic Matching Chip:** Pale lime background (`rgba(200, 241, 105, 0.25)`), `#153D2E` text, featuring an animated pulsing dot for real-time AI allocation.
- **Urgent / Spoilage Chip:** Warm Amber (`#E6A23C`) or Restrained Crimson (`#C94C4C`) fill at 15% opacity with solid text color.

### Input Fields
- Flat white surface (`#FFFFFF`), `1px` solid outline (`#E2E6DC`), and `8px` corner radius. 
- Focus state reveals a `1.5px` border in `#287451` accompanied by a soft `2px` ring in `#C8F169` at 40% opacity. 
- Placeholder text sits in `#202820` at 45% opacity.

### Cards & Dashboards
- Pure white container backgrounds floating above the `#F7F7F0` canvas.
- Structured header band featuring a `1px` bottom border (`#E2E6DC`).
- Content interiors use `space-lg` padding to preserve an uncluttered, high-end editorial feel even under heavy information density.

### Checkboxes & Radio Controls
- Custom controls with `#E2E6DC` border that fill with `#153D2E` on check. Checkmark rendered in `#C8F169` for distinct brand identification and instant confirmation.

### Platform-Specific Components
- **Cold-Chain Telemetry Strips:** Horizontal micro-bars tracking transit temperature and route integrity using monospaced indicators.
- **Dynamic Supply Route Cards:** Split-pane logistics indicators tracking surplus pickup windows, destination capacity, and AI confidence intervals.