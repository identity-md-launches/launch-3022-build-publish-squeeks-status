# Worker validation and design review

## Scope and result

The delivered application is an original React/TypeScript SPA, with a complete static export in `dist/`. It monitors the specified hamster-wheel API and Sepolia contracts, and provides optional read-only address lookup. No connected wallet, signing, private key, backend, fake live values or seeded historical curve is present.

**Complete for the local implementation and Chromium validation scope.** Repository/demo publication is the assignment pipeline's next stage; no public URL has been fabricated. The observations below are worker checks and have no independent certification authority.

The visual idea is a warm amber instrument panel, with one original hamster wheel illustration carrying the playful theme. The page is a tool, so its product name, live overview and address-jump action lead the first phone screen.

## Requirement coverage

| Requirement | Result / evidence |
| --- | --- |
| Live ACTIVE/IDLE, RPM, height, settled round and work/difficulty | Implemented. Live Chromium received IDLE, zero RPM, confirmed height 366, a changing settled round and onchain NFT supply. These observations are transient, not embedded runtime values. |
| NFT `totalSupply`, `totalIssued`, `mergesOpen` | Direct `eth_call` reads of the exact specified contract. Supply and issued are distinct. |
| Mining started/funding and staking totals | Published tuple layouts decoded; started, active, paused, funded blocks, issued SQK and total staked are displayed. |
| Approximately two-second polling | Independent status/RPC loops; interaction tests record multiple responses, stop on pause/hidden tab and resume afterward. Errors back off. |
| Session RPM sparkline | Actual in-tab samples only; five-minute and retained-session views, average, peak and sample count. History is limited to 1,800 readings. |
| Protocol strip | Explicit On/Off/Unknown labels, with staking labeled as intake and collection merge eligibility caveat. |
| Read-only wallet card | Invalid, loading, populated, confirmed empty, unavailable, incompatible-deployment, rate-limit and canceled-request states checked. Live lookup succeeded with the documented public reserve custody address. |
| Header and links | Product title, ACTIVE/IDLE pill, UTC update timestamp, Docs and Squeeks destinations. Mobile retains both links. |
| Copyable exact addresses and testnet footer | Clipboard equality checked against the complete NFT address; clipboard denial gives manual recovery. All three specified addresses are visible and untruncated. |
| Required English copy and no misleading launch claims | Requested hero, empty and feed-error copy retained. No airdrop, whitelist or mainnet mint claim is made. |
| Mobile-first, usable at 390px | Product, address-jump action and KPI overview visible on the first 390×844 CSS-pixel screen. Screenshot reviewed. |
| Complete relative static export and metadata | Export served under `/preview/`; no missing local resources. Title, description, favicon, og:title and actual 1200×630 PNG og:image checked. |
| Source, lockfile, build, typecheck and documentation | Source/configuration, lockfile, export, README, DESIGN.md and these results are included. Explicit byte budget and final hash manifest are included. |
| GitHub and hosted imd.site/IPFS demo | After handoff to the publication pipeline. Not claimed as already published by these local checks. |

The Sepolia site's API-like paths returned SPA HTML during research. Lookup therefore uses the canonical public account API documented at [Squeekchain API](https://docs.squeekchain.com/developers/api/), validates chain 11155111 and all three returned contract pins, and never treats an unavailable response as zero. Contract layouts and selectors were checked against the [published deployment ABIs](https://docs.squeekchain.com/developers/#deployments).

## Commands and verification

The ordinary rebuild/check commands are in README. During this restricted run, dependency installations stayed under removable `test/scratch/`, with a temporary Vite alias configuration and TypeScript path configuration that resolve the same locked React/type packages there. Neither scratch directory is needed by the delivered source or export.

| Actual invocation | Result |
| --- | --- |
| `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --cache test/scratch/npm-cache` | Passed; root npm lockfile version 3, resolved package hosts only `registry.npmjs.org`. |
| `node test/scratch/build/node_modules/typescript/bin/tsc --noEmit -p test/scratch/tsconfig.json` | Passed with strict checking. An unused helper found in the initial run was removed before the passing check. |
| `node test/scratch/build/node_modules/vite/bin/vite.js build --config test/scratch/vite.config.mjs` | Production build passed. Final export contains only the HTML, CSS/JS, local fonts/licenses, favicon and share assets. |
| `node scripts/generate-share.mjs` | Passed, using installed Playwright via module override. The actual PNG was opened and inspected. |
| `node scripts/validate.mjs` | Chromium fixture suite passed. See `results-fixture.json` for the exact case list and network/console findings. |
| `node scripts/validate.mjs --live` | Chromium real-service checks passed. See `results-live.json`. Live wheel polling, real contract reads, public address lookup and full-address clipboard copy succeeded. |
| `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | **16/16 passed** on the final UI export at 320, 390 and 1440px, including reduced-motion inspection. Exact check summary: `taste-results.json`. |
| `node .imd/reads/skills/design-critic/scripts/taste.mjs --offline --out test/scratch/taste-offline` | **15/16 passed**. The sole glyph warning is the exact required error copy, explained below. Layout, render, contrast, targets and all other checks passed offline. |

Browser commands used the installed Playwright module and the task's network proxy through runtime-only overrides. The taste probe used an unchanged pinned script with a removable Playwright launch adapter. No proxy value or machine-specific configuration is in the application, export or delivered evidence.

The supplied browser connector could not launch because of a local socket-path limit. Direct Playwright headless Chromium was used instead, with bounded foreground scripts that create and close their own static preview and browser. Browser requests were made from a gateway-like `/preview/` subpath. The actual export was also examined at 720 and 960px, in addition to 320, 390 and 1440px. No horizontal overflow was measured at those widths.

The fixture suite exercises actual exported UI interactions with intercepted external data; it does not report fixtures as live state. It checks malformed addresses, canceled lookups, populated/empty/unavailable results, rate limiting, deployment mismatch, keyboard order/focus, range selection, manual pause, hidden-tab pause, IDLE, counter fault, stale readings, feed failure/retry, partial contract failure, wrong-chain RPC rejection, read-only wire methods, motion preferences and clipboard denial. The live suite makes no such interceptions.

## Six-domain review

| Domain | Coverage and evidence | Limits |
| --- | --- | --- |
| Accessibility — Checked | Native landmarks, headings, form, links and buttons; labeled input; complete address button names; field errors and stable status region; keyboard jump, order, Enter/Space actions and visible focus screenshot; axe has no violations; reduced-motion behavior tested. | No native screen-reader session or physical touch test. Forced-color rules inspected in source, not visually exercised. |
| Layout — Checked | Live/error/empty/populated states; shared alignment edges, compact mobile header, wrapping addresses and amounts; five widths; no measured overflow, overlapping text boxes or floating obstruction in final probe. Product and action confirmed on the first 390px screen. | Browser-native zoom, pseudo-localization and RTL mirroring not performed. The product ships English only. |
| Writing — Checked | Exact requested hero/empty/error copy; verb-led actions; explicit unknown, snapshot and retry messages; staking intake and merge eligibility wording; privacy note adjacent to lookup. | External linked content is outside the review. The prescribed em dash is an intentional house-style exception. |
| Typography — Checked | Two loaded local faces, three weights, at most six sizes; 16px input; tabular data; numeric/unit tracking corrected; no address ellipsis; real large SQK totals and long addresses rendered. | Non-Latin fallback fonts and OS-specific font rendering not tested. |
| Colors — Checked | Named role tokens inspected; final probe passed normal text 4.5:1 and large text 3:1 against resolved solid backgrounds. Measured hero description against page background: **7.78:1**; address-jump label against its neutral control: **13.33:1**. Status has text and icons as well as color. | One dark theme by brief; no light theme applies. Ratios over decorative illustration/gradient pixels are not claimed. |
| UI details — Checked | Hover/focus/press, loading, errors, empty, success, copied and denied states; 150ms named transitions; `.96` press scale; ACTIVE-only wheel animation; reduced motion stops it. Flat panels and consistent radii. | Animation-panel playback at 10% speed was not performed. One inline source link is below 44px tall but satisfies the probe's 24px/spacing baseline. |

Wallet connection, transaction simulation/signing, destructive actions, dialogs and localization variants are not applicable to this explicitly read-only dashboard. No wallet connector dependencies or new transaction flow were added.

## Findings fixed and rechecked

| Finding / severity | Source and evidence | Fix and final result |
| --- | --- | --- |
| Accessible address labels omitted visible address / medium | `src/App.tsx:30`. Initial axe scan found three `label-content-name-mismatch` violations. | Names now include both contract name and complete visible address. Final axe scan has no violations; copy equality also passed. |
| Empty-chart label covered the full plot rectangle / low | `src/styles.css:133`. Initial probe reported its oversized box against axis labels, although screenshot glyphs were visually separate. | Restricted the label's actual box to its text region, offset from the axis. Final online and offline layout checks pass. |
| Unit labels inherited overly tight numeric tracking / medium | `src/styles.css:75`. Probe measured `-.042em` at 12px on three protocol unit labels. | Units reset to body face and zero tracking. Final tracking check passes. |
| Required external destination hidden on narrow header / medium | `src/App.tsx:65`, `src/styles.css:274`. Early narrow layout hid the Squeeks link. | Retained a compact visible “Squeeks” link and full accessible destination name. Final 320/390 renders and target checks pass. |
| Mobile chart controls and refresh smaller than comfort target / low | `src/styles.css`, 44rem rules. Early probe noted four controls below 44px. | Mobile icon, refresh and range targets increased to 44px; range labels stay on one line. Final probe notes only the inline source link below 44px. |
| Chart clock disagreed with UTC feed clock / medium | `src/components/Chart.tsx:5`. Live screenshot showed local chart time one hour ahead of UTC metadata. | Explicit UTC formatting and suffix. Final screenshots reviewed with matching clock convention. |
| Counter fault could inherit idle-style explanatory copy / high | `src/App.tsx:48`. Source state review found freshness was being used without gating valid sensor states. | ACTIVE/IDLE are now the only states contributing live RPM; counter faults are labeled explicitly. Dedicated fault case passes and RPM is unknown. |
| Editing during lookup could show a previous request afterward / medium | `src/components/WalletLookup.tsx:58`. Async flow review found input changes did not abort the active request. | Abort on edit, clear old results and leave input usable. Cancellation interaction case passes. Service errors also no longer mark valid address syntax as invalid. |
| Account API could describe a different Sepolia deployment / medium | `src/data.ts:187`. Chain-only validation did not pin API results to the specified contracts. | Verify collection, mining and staking addresses. Wrong-deployment fixture is rejected; live lookup with matching pins succeeds. |

No confirmed source-fixable high or medium finding remains from this review.

The offline glyph warning is retained deliberately: the brief explicitly requires **“Live feed paused — retrying.”** The exact error appears at `src/App.tsx:77`; replacing its em dash merely to satisfy the probe would violate the supplied copy. The alert also uses a flatter 4px radius so it reads as an error notice rather than a heading kicker. Online healthy-state taste checks pass 16/16.

## Evidence and remaining limits

- `screenshots/mobile-first-screen.png`: live first screen at 390 CSS pixels, captured by the pinned probe and visually inspected.
- `screenshots/desktop.png`: live full-page desktop export, visually inspected.
- `screenshots/keyboard-focus.png`: 390px ACTIVE **fixture** state with the visible amber focus perimeter; visually inspected, not presented as real live activity.
- `screenshots/feed-error.png`: deliberate failed-feed **fixture** state, confirming visible retry copy and retained snapshot.
- `results-fixture.json`, `results-live.json`: actual interaction outcomes, including console and network observations.
- `taste-results.json`, `taste-offline-results.json`: actual pinned probe outcomes.

WebKit browser files downloaded, but the runtime reported unavailable system libraries, including GStreamer/GTK-related dependencies. No WebKit rendering or Safari success is claimed. Native screen-reader use, native zoom, forced-colors rendering, physical devices, long-lived sessions beyond the cap, social-platform crawler behavior and the final hosted deployment were not exercised.

Real-service checking observed an idle wheel; ACTIVE, counter-fault and service-failure behavior was checked with explicit fixtures. Public API/RPC availability, browser CORS policy and upstream schema/deployment changes can affect later visitors. Unknown/error states remain usable; no fallback synthesizes data. The UI is static and wallet lookup snapshots do not refresh until resubmitted.

Final typecheck and production rebuild both exited successfully. The export is **407,680 bytes**; the complete 50-file delivery is approximately **1.26 MiB including its hash manifest**, below the **8 MiB** limit. The final fixture suite passed **30 checks** and the live suite passed **13 checks**; the only fixture console messages were the two deliberately induced HTTP errors, while the live run had none.

All source, package files and required runtime assets are retained. Generated installations and caches are excluded at every depth, with an explicit ignore-path budget. `dist/` is only about 0.4 MB; the complete submission is checked against the 8 MiB limit and hashed in `submission-manifest.json`.
