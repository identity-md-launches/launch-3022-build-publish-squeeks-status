# Submission path and byte budget

The hard limit is **8,388,608 bytes** added to the Git submission bundle. This explicit path budget authorizes the new `.gitignore` and each exclusion below. `dist/` is intentionally included.

| Submitted path | Budget |
| --- | ---: |
| `.gitignore` | 1,024 bytes |
| `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html` combined | 100,000 bytes |
| `src/**` | 200,000 bytes |
| `public/**` including complete runtime fonts, licenses and share assets | 300,000 bytes |
| `dist/**` complete static export | 700,000 bytes |
| `scripts/**` | 100,000 bytes |
| `README.md`, `DESIGN.md` combined | 100,000 bytes |
| `artifacts/**` including reports and screenshots | 2,000,000 bytes |
| Unallocated headroom | 4,887,584 bytes |
| **Total** | **8,388,608 bytes** |

Every `.gitignore` exclusion has a **zero-byte submission budget**:

- `**/node_modules/`: installed dependency trees at every depth.
- `**/.cache/`, `**/.npm/`, `**/.vite/`, `**/.pnpm-store/`: generated package/build/browser caches at every depth.
- `**/*.tsbuildinfo`: generated TypeScript incremental cache files.
- `test/scratch/`: removable research, temporary dependency installations, browser binaries, test outputs and local verification configurations.

No source, runtime asset, lockfile or required export is excluded. No submodule, registry mirror or dependency archive is delivered. Pinned `.imd/reads/` inputs are removed by the assignment and are not deliverables. Protected Git, workflow and environment paths were not modified.

The two `/artifacts/` negations explicitly include the budgeted reports and screenshots even if inherited ignores would omit them. Generated/cache exclusions follow those negations, so their zero-byte budget still applies inside artifacts as well.

Actual final file sizes and SHA-256 hashes are recorded in `submission-manifest.json`, generated after validation. The manifest excludes itself from its per-file list; its own bytes are included when reporting the final bundle total in the validation record.
