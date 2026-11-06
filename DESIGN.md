# Squeeks Status Board design system

## Overview

This is a monitoring tool for Genesis reviewers and holders. Its single visual idea is a warm, quiet instrument panel built around an original hamster wheel. Large numeric readouts establish hierarchy; amber highlights the wheel and primary action, while green communicates enabled protocol flags. The illustration reflects the feed's state and is not a camera stream or game.

The source of truth is `src/styles.css`, followed by the actual components in `src/App.tsx` and `src/components/`. Source and production Chromium renders were reviewed across all six Better Interface domains; evidence and limitations live in `artifacts/validation.md`.

## Colors

The project uses sRGB hex tokens. There is one deliberately dark theme, without a theme switch.

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#141412` | Page and input background |
| `--color-surface` | `#1c1d19` | Metric and section surfaces |
| `--color-raised` | `#252620` | Neutral controls and unknown flags |
| `--color-hover` | `#303129` | Hover and selected range |
| `--color-border` | `#37382e` | Structural edges and dividers |
| `--color-text` | `#f1f0e7` | Main text and data |
| `--color-muted` | `#aaa99b` | Supporting labels, captions and times |
| `--color-accent` | `#f4b653` | Wheel emphasis and primary action |
| `--color-accent-hover` | `#ffcc7e` | Primary hover |
| `--color-accent-ink` | `#261d10` | Text on primary fill |
| `--color-accent-surface` | `#272319` | Wheel status surface |
| `--color-positive` / `--color-positive-surface` | `#b9d897` / `#283121` | On/active status and copy success |
| `--color-negative` / `--color-negative-surface` | `#f2a5a0` / `#3b2423` | Off status and recoverable errors |
| `--color-network` | `#b9b5ee` | Sepolia marker |
| `--color-focus` | `#f4b653` | Two-pixel keyboard outline |

State is also expressed in words and icons. The amber chart line and translucent fill are data artwork; illustration-specific gold, cream and brown fills remain in `Wheel.tsx`. The rendered probe measured normal text against its resolved solid backgrounds and passed the 4.5:1/3:1 thresholds. Those measurements are not a claim about every possible image or forced-color pairing.

## Typography

Local **DM Sans** is the interface face, with `system-ui, sans-serif` fallback. The bundled Latin variable font supplies weights 400, 600 and 700 as used. **DM Mono** 400 is reserved for data, timestamps and addresses, with `ui-monospace, monospace` fallback. Both WOFF2 files and their OFL notices are in `public/fonts/`; no remote font request is needed.

| Token | Size at default root | Use |
| --- | --- | --- |
| `--text-caption` | 12px | Dense labels, hints, units and metadata |
| `--text-body` | 14px | Tool text, controls and support copy |
| `--text-base` | 16px | Input, section subheadings and hero description |
| `--text-section` | 20px | Section headings and protocol totals |
| `--text-kpi` | 32px | KPIs and narrow title |
| `--text-title` | 40px | Desktop title and current RPM |

Body line-height is 1.5, h1 1.15, h2 1.3 and h3 1.4. Headings use balanced wrapping; prose uses pretty wrapping. H1 tracking is `-.045em`; section headings and numeric data use `-.025em`. Unit labels reset tracking and return to the body font. Changing values use tabular numerals. Important numeric values and full addresses wrap rather than truncate. Mobile input text stays at 16px.

## Layout

`.container` centers content within 1328px including padding: 40px inline normally, 28px at 72rem, 20px at 44rem and 16px at 23rem. Repeated spacing uses 4px-derived steps, mainly 8, 12, 16, 20, 24 and 32px. Larger gaps distinguish groups from labels within them.

- The header carries branding and external utilities. The page heading gives the exact product title and requested one-line description, with an address-jump action.
- The overview is five equal columns. At 60rem it becomes a three-plus-two layout; at 44rem it becomes two columns with a compact full-width status row.
- `.activity-grid` pairs the chart and wheel at 1.9:1, adjusting to 1.65:1 and 1.55:1 as space tightens. It stacks at 44rem.
- The protocol strip is three equal columns, stacking into divided rows at 44rem. No data is hidden by this change.
- `.details-grid` pairs lookup and settlement at 1.35:1, becoming 1.3:1 before stacking at 44rem. The form wraps at 60rem.
- Contract chips use three columns above 72rem, labeled rows below that, and full-width wrapping chips at 44rem.
- Mobile retains both Docs and Squeeks links, shortening the latter's visible label. The “testnet” suffix is hidden at 44rem; the network marker is hidden at 23rem. The page still explicitly identifies Sepolia and testnet status.

The chart gets a separate controls row at 23rem. The first 390px screen contains the product, the address-jump action and the live overview. There are no sticky overlays or floating controls over content. Chromium was checked at 320, 390, 720, 960 and 1440 CSS pixels. WebKit, native zoom and physical-device behavior remain unverified.

## Elevation & Depth

The interface is flat. One-pixel borders group surfaces, with tonal fills distinguishing controls and states. There are no card shadows, gradient text, nested card stacks or page entrance sequences. The only gradient belongs to the chart's data fill.

## Shapes

`--radius-panel: 12px` defines major sections; `--radius-control: 8px` defines fields and buttons. Status chips use 5px and the error notice uses 4px. Dots and the wheel are circular. Clipping is limited to the decorative progress track and visually hidden assistive content; address and amount text remains accessible.

## Components

| Component / source | Reuse and behavior |
| --- | --- |
| `Metric`, `src/App.tsx` | Semantic `dt`/`dd` readout, label icon, tabular numeric value and support label. The first has the amber status variant. |
| `Flag`, `src/App.tsx` | Explicit On, Off or Unknown chip. Unknown is never styled as enabled. |
| `Chart`, `src/components/Chart.tsx` | Session-derived SVG history, accessible average/peak summary, 5 min / Session native buttons with `aria-pressed`, pause/resume and pointer inspection. Missing samples split lines. |
| `Wheel`, `src/components/Wheel.tsx` | Decorative original SVG. Rotation runs for ACTIVE only, at 8s per turn, and stops on pause, faults, stale data or reduced motion. |
| `WalletLookup`, `src/components/WalletLookup.tsx` | Labeled address input and the sole amber primary action. Validate on submit, focus invalid input, expose inline errors and a stable polite status region. Loading, populated, confirmed empty, unavailable and retry states are implemented. |
| `CopyContract`, `src/App.tsx` | Full address in both visible content and accessible button name; clipboard feedback or manual-copy recovery. |
| `Icon`, `src/components/Icon.tsx` | One current-color SVG set, 1.7px rounded strokes; icons are decorative beside semantic labels. |
| `.button`, `.icon-button`, `.segmented` | Neutral secondary controls, one filled primary action, named selected state and visible focus. Pointer hover styles are hover-capability gated. Mobile refresh, range and icon controls target 44px. |

Interactive transitions name only background, color and transform, lasting 150ms. Press scale is `.96`; all motion is gated by `prefers-reduced-motion: no-preference`. Focus uses a 2px solid outline with 4px offset, or 2px for inputs; forced-color mode uses system Highlight. External links remain native anchors and open in a separate tab.

## Do's and Don'ts

- Start additional monitoring sections from `.panel`, `.panel-heading` and the existing `dt`/`dd` patterns; keep the aligned container edges.
- Keep numeric displays in DM Mono and explanations in DM Sans. Reuse the six sizes instead of adding one-off steps.
- Use the amber fill for the main action and words alongside every status hue.
- Preserve unknown, paused and stale states. Do not replace them with zeros or invented historical points.
- Keep full contract addresses reachable and selectable. Do not add wallet connections or signing flows to this board.

Design guidance was applied from the pinned Better Interface reference (Jakub Krehel, MIT), and this implementation record follows the pinned Impeccable documentation method (Paul Bakaus, Apache-2.0). Adaptation notices and retained licenses are in `artifacts/ATTRIBUTION.md` and `artifacts/design-guidance-LICENSE.txt`.
