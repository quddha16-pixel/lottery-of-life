# Lottery of Life

A day-by-day animal survival game in `quddha16-pixel/lottery-of-life`, separate from Identifier Q and Soccer Pocket GM.

This process-review branch starts from the existing Phase 2 production baseline (`79ca0bd`). It prepares protected production releases from `main`, separate development previews and the three-stage completion standard. It does not include Phase 3 gameplay or implement Phase 3C. **Do not merge or publish without Quentin’s explicit approval.**

## Run

Node.js 24 LTS recommended (22.12+), npm.

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

Open the printed URL with `/lottery-of-life/`. No account, keys, backend, paid services or external AI. Fonts/photos are bundled locally. Save data lives in the browser; export backups in Settings.

## Play

- A dedicated main menu with New Life, Continue Life, collection, packs, bloodlines, lifetime records and creator credit.
- A four-stage reveal of species, geography, date and circumstances; choose Begin Life to commit the generated individual.
- Seeded continuous birth-year sampling across each species' supported historical window, including BCE and Late Pleistocene periods. Compatible historical habitats replace modern-location assumptions. [Scope and uncertainty](docs/HISTORICAL_MODEL.md).
- An immersive gameplay screen with animal identity, date, phase, survival indicators, contextual situation and action consequences, plus expandable journal, relationships, family and time controls.
- A persistent local ecosystem: weather, moisture, water, vegetation, prey, predator activity, competition, depletion and regrowth. Outcomes respond to these conditions rather than unrelated event cards.
- Immersive, Balanced and Story Focus pacing through the same rules. Routine nursery care, milestones, mortality, local movement, continuing situations, individual tendencies and experience.
- All original ten starting species, three pack unlocks, earned Coins, duplicates, offspring, inherited traits, permanent death and surviving-offspring continuation.
- Autosave, backup recovery, export/import and deterministic version-1-to-2 migration. The old browser storage key is retained so existing progress is discovered.

The full Phase 2 biological, social and ecological simulation is **not complete or scientifically calibrated**. [Implemented slices, limitations and next stages](docs/LIVING_WORLD.md).

## Architecture

- `src/data/species.ts` — biology, development and species behavior.
- `src/data/history.ts` — species-specific supported intervals, regional habitat validity and family circumstances.
- `src/game/history.ts`, `calendar.ts`, `random.ts` — validated historical generation, integer-year BCE/CE/deep-time dates and saved PRNG.
- `src/game/world.ts` — persistent local ecological feedback, resources, movement, situations and contextual narration.
- `src/game/engine.ts` — phase resolution, mortality, pacing/skips, reproduction, rewards, packs and continuation. No React dependency.
- `src/game/storage.ts` — versioned schema validation, deterministic migration and recovery.
- `src/components/BirthSequence.tsx`, `GameplayScreen.tsx` — dedicated immersive views; `UI.tsx` shares presentation primitives.
- `src/App.tsx` — screen/history navigation, persistence adapter and existing notebook/collection/save screens.

## Validate

```sh
npm test
npm run lint
npm run build
npx playwright install chromium    # once if a system Chromium is unavailable
npm run test:e2e
```

Playwright executes the production bundle at a Pages-style subpath, with external requests blocked. Desktop and iPhone-sized Chromium runs cover the game, navigation, save recovery, progression and layout. The suite uses `/usr/bin/chromium` when available or Playwright's installed Chromium; `PLAYWRIGHT_CHROMIUM_PATH` overrides it. A mobile-emulated run is not physical Safari certification.

Vite's base is `/lottery-of-life/`; hash navigation supports static hosting and browser Back without server rewrites. The deployment workflow's existing source-branch restriction is unchanged. Nothing on this review branch should be published until approved.

[Validation results](docs/OVERHAUL_VALIDATION.md) · [Historical model](docs/HISTORICAL_MODEL.md) · [Living-world model and continuation](docs/LIVING_WORLD.md) · [Model notes](docs/MODEL_NOTES.md) · [Assets](docs/ASSET_CREDITS.md)

## Repository and release process

[Release process and manual setup](docs/RELEASE_PROCESS.md) · [Approved Phase 3C plan](docs/PHASE3C_PLAN.md).

The prepared production and preview workflows are manual-only, require an exact candidate SHA and fail unless their enable flag is true. GitHub settings writes returned 403, so owner setup is still required. No merge or deployment occurred during preparation. All historical phase branches and commits are preserved.

Completion means **Implemented → Playable on Quentin’s iPhone → Released after approval and public verification**. Passing CI alone is not Playable or Released.


## First iPhone preview

[Simple iPhone upload instructions](docs/IPHONE_PREVIEW.md). The artifact-only packaging workflow prepares the tested Phase 3C commit `ebff789` for a separate Cloudflare Pages Free project without merging main or using deployment credentials. The manual deployment workflows remain gated; preparing/downloading a ZIP does not publish a website or establish Playable.
