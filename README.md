# Lottery of Life

A day-by-day animal survival game in `quddha16-pixel/lottery-of-life`, separate from Identifier Q and Soccer Pocket GM.

This branch, **`development/phase-3-wildlife-rpg`**, contains the shared Phase 3 wildlife RPG framework and mechanics for all 13 existing species, including the family-friendly presentation requirements. It is for review: **do not merge or deploy without explicit approval**. The existing Pages workflow triggers automatically only from `development/phase-1-foundation`; pushing this branch runs CI without publishing it.

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
- An illustrated, mobile-first active life with contextual decisions and dedicated Life / Explore / Social / Journal / More navigation. Connected locations, escorted travel, persistent nearby animals and focused encounters.
- Distinct biological resource loops and capabilities across all 10 starters and 3 unlockable species. [Species mechanics and reference assumptions](docs/SPECIES_INDIVIDUALITY.md).
- Saved Simple / Detailed narration, optional sourced discoveries, respectful permanent mortality and earned-currency-only progression.
- A persistent local ecosystem: weather, moisture, water, vegetation, prey, predator activity, competition, depletion and regrowth. Outcomes respond to these conditions rather than unrelated event cards.
- Immersive, Balanced and Story Focus pacing through the same rules. Routine nursery care, milestones, mortality, local movement, continuing situations, individual tendencies and experience.
- All original ten starting species, three pack unlocks, earned Coins, duplicates, offspring, inherited traits, permanent death and surviving-offspring continuation.
- Autosave, backup recovery, export/import and deterministic version-1/2-to-3 migration. The old browser storage key is retained so existing progress is discovered.

The biological model remains a transparent game approximation. [Phase 3 scope and remaining work](docs/PHASE3.md), [current validation](docs/PHASE3_VALIDATION.md) and [earlier Phase 2 design snapshot](docs/LIVING_WORLD.md).

## Architecture

- `src/data/species.ts` — biology, development and species behavior.
- `src/data/history.ts` — species-specific supported intervals, regional habitat validity and family circumstances.
- `src/game/history.ts`, `calendar.ts`, `random.ts` — validated historical generation, integer-year BCE/CE/deep-time dates and saved PRNG.
- `src/game/world.ts` — persistent local ecological feedback, resources, movement, situations and contextual narration.
- `src/game/engine.ts` — phase resolution, mortality, pacing/skips, reproduction, rewards, packs and continuation. No React dependency.
- `src/game/wildlife.ts`, `biology.ts`, `narration.ts`, `src/data/species-rules.ts` — connected locations, persistent neighbors, species modules and read-only narration.
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

[Validation results](docs/PHASE3_VALIDATION.md) · [Historical model](docs/HISTORICAL_MODEL.md) · [Living-world model and continuation](docs/LIVING_WORLD.md) · [Model notes](docs/MODEL_NOTES.md) · [Assets](docs/ASSET_CREDITS.md)
