# Squeeks Status Board

A read-only, single-page observatory for the hamster wheel and the specified Sepolia Genesis contracts. No wallet connection, signing, keys, account registration or backend is needed. The hamster illustration and dashboard are original work.

## Install, preview and rebuild

Use Node **22.12+** and npm.

```sh
npm ci
npm run dev
```

For the production site:

```sh
npm run typecheck
npm run build
npm run preview
```

`dist/` is the complete production export and is included alongside the source and lockfile. Vite uses `base: './'`; scripts, CSS, fonts, favicon and share image resolve relative to the export. Serve the contents of `dist/` on a static host or IPFS gateway subpath. There are no server routes or runtime environment variables.

The assignment's publication pipeline receives this export and source bundle for the GitHub repository and imd.site/IPFS demo. A public deployment URL is not assigned by this source build; no publication URL is invented here.

## What is live

Configuration is in `src/config.ts`; reads and response validation are in `src/data.ts`.

| Source | Used for |
| --- | --- |
| [Status API](https://api.squeekchain.com/v1/status) | ACTIVE/IDLE, `rpmMilli / 1000`, confirmed block height, settled round, work, difficulty, block progress, oracle and queue |
| [PublicNode Sepolia RPC](https://ethereum-sepolia-rpc.publicnode.com) | Direct, read-only contract snapshots; [dRPC](https://sepolia.drpc.org) is the fallback |
| [Public account API](https://docs.squeekchain.com/developers/api/#account-get-v1accountsaddress) | Submitted address's NFT counts, staked SQK and claimable SQK |

The account API's canonical public origin is `https://api.squeekchain.com/v1/accounts/{address}`. It is the documented API behind the Sepolia application; the Sepolia website itself returns HTML for API-like SPA paths.

| Contract | Sepolia address | Views |
| --- | --- | --- |
| SqueekNFT | `0xC4C7982657f00509548F3a3a41db7FA439a6856B` | `totalSupply`, `totalIssued`, `mergesOpen` |
| SqueekMining | `0x2dccb11fcc2defdd188555e45acb52231e82e218` | `state`: start round, active/paused flags, minted SQK and funded blocks |
| SqueekStaking | `0x50fd1780526c3186a0c037c7622203bc4fb611ca` | `paused`, `totalStaked`, `rewardState` |

Selectors and fixed-width output layouts were checked against the [published ABIs and deployment record](https://docs.squeekchain.com/developers/#deployments). Contract snapshots first verify chain ID **11155111**, then pin all seven `eth_call` reads to one Ethereum block. No state-changing RPC method exists in the app. Mining is on when started, active and unpaused; staking's flag means intake is unpaused, and the merge flag describes the collection, not individual eligibility.

The status and contract feeds poll independently, normally two seconds after each completed read. They use timeouts, exponential retry backoff, public RPC fallback and API `Retry-After` when exposed. Hidden tabs and the pause control stop polling; resuming requests fresh data. Refresh now restarts both reads.

Confirmed Squeek block height is deliberately separate from Ethereum block height and optimistic projections. Sensor freshness is checked against the API's receipt time and timeout. Stale readings and counter faults never masquerade as live RPM. Failed reads are unknown, not zero; the last successful confirmed snapshot remains visible with its timestamp and warning. Partial contract failures affect only their fields.

The chart is made exclusively from responses observed in the current tab, keeps the latest 1,800 readings in memory, and provides a five-minute view and the retained session view. It does not seed a historical curve. Chart, feed and sensor timestamps use UTC. History disappears on reload. SQK amounts use 18-decimal integer arithmetic, truncated to three displayed decimals; positive dust is shown as `<0.001`.

## Address lookup and privacy

Paste a nonzero `0x` address and select **Look up address**. The request is read-only and normalized to lowercase. The API receives that address. Neither addresses nor results are persisted, and no analytics or wallet SDK is included.

The lookup verifies schema version, chain, returned address and all three deployment pins. Counts use `tokenCounts`, not the length of a paginated NFT list. A confirmed zero count shows “No Squeeks in this address.” Unavailable or incompatible responses show an error and unknown values. Each successful result is a snapshot; look up again to refresh it. Editing the field cancels an outstanding lookup.

## Checks

```sh
npx playwright install chromium
npm run test:browser
npm run test:browser -- --live
```

The default suite serves the actual export under `/preview/` and intercepts external requests with clearly isolated test fixtures. `--live` exercises the real public API, RPC and documented reserve address. Fixtures are in the validation script, never in the production app. Browser output goes to `test/scratch/validation/` and is excluded from the submission.

For a WebKit-equipped system, install its browser/dependencies and run `npm run test:browser -- --webkit`. The share image can be regenerated with `node scripts/generate-share.mjs`; its editable source is `public/share.svg`.

Actual worker checks: production build and TypeScript check passed; Chromium interaction and live checks passed; the pinned taste probe passed **16/16**. No local asset failures, page exceptions or axe violations were found. The offline probe's required error message is an intentional copy exception. See [the validation record](artifacts/validation.md), [raw check summaries](artifacts/taste-results.json), and [implemented design system](DESIGN.md).

WebKit rendering was not verified because its runtime dependencies were unavailable. Native screen-reader sessions, physical devices and browser-native zoom were not tested. Public services and final hosted deployment remain external dependencies. These are worker observations, not independent certification.

## Source map

- `src/App.tsx`: overview, protocol strip, settlement and copy controls.
- `src/components/`: chart, original wheel artwork, lookup and shared icons.
- `src/hooks.ts`: polling lifecycle and session history.
- `src/styles.css`: tokens, component states and responsive layouts.
- `public/`: locally bundled fonts, font licenses, favicon and share assets.
- `scripts/`: reproducible browser checks and share-image generator.

Font licenses are alongside the fonts. Design-reference attribution and retained notices are in [artifacts/ATTRIBUTION.md](artifacts/ATTRIBUTION.md). Dependency, browser and package-manager caches are excluded at every nesting level; the explicit ignore-path and byte budget is [documented here](artifacts/submission-budget.md).

Testnet only / not financial advice.
