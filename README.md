# Lottery of Life — Phase 1

A browser-based, day-by-day animal life simulator in `quddha16-pixel/lottery-of-life`. **Lottery of Life** is the official project name. This project is entirely separate from Identifier Q and Soccer Pocket GM.

## Run locally

Node.js 24 LTS recommended (22.12+), npm.

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

No API keys, backend, paid infrastructure, accounts, or AI services. Species photos and fonts are bundled locally. Browser storage holds progress; export JSON backups in Settings.

## Playable now

- Ten unlocked starting species, with three unlockable additional species.
- Random or manual seeded births in curated range-valid 1900, 1980 and 2020 scenarios.
- Four phases per day, developmental action gating, condition costs, feeding, rest, shelter, exploration and species-appropriate social/reproductive actions.
- Autonomous priorities; next day, seven/thirty days and stage/lifespan-appropriate yearly skips through the same engine.
- Persistent injury and resource consequences, mortality, irreversible individual death, journals, lifetime summaries and earned Coins.
- One real weighted pack, duplicate conversion, persistent collection unlocks.
- Sampled offspring, modest trait inheritance, family history, background family aging/mortality and takeover of a surviving direct offspring at its actual age.
- Nine connected screens with a mobile layout, export/import, confirmation before destructive save changes, and backup recovery.

These systems are **gameplay approximations**, not a validated biological simulation. See [model scope, sources and limitations](docs/MODEL_NOTES.md) before interpreting the numbers.

## Architecture

- `src/data/species.ts` — species records and historical scenario baselines; add data rather than branches in UI components.
- `src/game/types.ts` — explicit simulation/save contracts.
- `src/game/random.ts`, `calendar.ts` — persisted deterministic PRNG and integer-year calendar.
- `src/game/engine.ts` — pure state-in/state-out births, phases, skips, mortality, rewards, packs, families. No React/browser dependency.
- `src/game/storage.ts` — versioned validation, save serialization, prior-save recovery.
- `src/App.tsx` — UI screen orchestration and browser adapter; `BRAND` contains replaceable product naming.
- `src/index.css`, `App.css` — dark field-notebook design system, responsive layouts, focus styling and reduced-motion support.
- `public/species/`, `src/data/image-credits.json` — local licensed photographs and attribution.
- `src/game/engine.test.ts`, `tests/game.spec.ts` — engine and browser integration checks.

## Validate

```sh
npm test
npm run lint
npm run build
npx playwright install chromium    # once, if no system Chromium is available
npm run test:e2e
```

Playwright tests use desktop and mobile Chromium and fulfill static requests from the actual `dist/` bundle at a GitHub Pages-style subpath. They require no preview relay, app server, outside network or service. Set `PLAYWRIGHT_CHROMIUM_PATH` to override a system browser; otherwise `/usr/bin/chromium` is used when available, then Playwright's installed Chromium. The build runs TypeScript checks. Standard Vite preview is also available with `npm run preview`.

Recorded local results and environment limits: [validation report](docs/VALIDATION.md).

## GitHub Pages preparation

Vite explicitly uses `base: '/lottery-of-life/'`. Species photos use `import.meta.env.BASE_URL`; bundled scripts, styles and fonts are emitted under the same repository path. State-based navigation needs no SPA rewrite rules. Existing Phase 1 browser storage keys are retained so changing the title does not erase saves.

`.github/workflows/pages.yml` runs on pushes to `development/phase-1-foundation`, with manual dispatch also configured. It lints, runs the engine and desktop/mobile browser tests, then uploads the exact tested `dist/` artifact. Only the deployment job receives `pages: write` and `id-token: write`. The `github-pages` environment records the deployed URL. `.github/workflows/ci.yml` provides independent CI checks.

The repository's Pages setting must use **GitHub Actions** as its source, and its Pages environment must allow this development branch. Push triggering avoids relying on a manually dispatched workflow being present on the default branch (`main` still has the initial README).

Pages availability for a private repository depends on the account's GitHub plan. Do not enable paid services or change the repository's visibility without authorization. Deployment status and any access blockers are recorded separately from the local test results.

## Scope and next steps

[Implementation sequence](docs/IMPLEMENTATION_PLAN.md) · [Biological assumptions and deferred systems](docs/MODEL_NOTES.md) · [Image and font licensing](docs/ASSET_CREDITS.md)

Milestone A is implemented as a playable foundation, with early functional slices of B/C/D. Next: deepen species-specific survival and ecological consequences (Milestone B), validate the content more rigorously, and balance longer seeded runs. This is not yet the complete historical, ecological or multigenerational simulation envisioned in the full brief.
