# Lottery of Life

A day-by-day animal survival game in `quddha16-pixel/lottery-of-life`, separate from Identifier Q and Soccer Pocket GM.

This infrastructure-review branch starts at `170323f`, preserving the Phase 3/3B framework and all earlier work. It prepares CI, separately labeled development previews and the approved Phase 3C plan. **This infrastructure branch changes no gameplay. Phase 3C is implemented in separate feature PRs; do not merge or publish without Quentin’s explicit approval.**

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

Vite's base is `/lottery-of-life/`; hash navigation supports static hosting and browser Back without server rewrites. The prepared production and preview workflows are manual-only, require an exact candidate SHA and fail unless their enable flag is true. Nothing on this review branch should be merged or published until explicitly approved.

[Validation results](docs/PHASE3_VALIDATION.md) · [Historical model](docs/HISTORICAL_MODEL.md) · [Living-world model and continuation](docs/LIVING_WORLD.md) · [Model notes](docs/MODEL_NOTES.md) · [Assets](docs/ASSET_CREDITS.md)

## Repository and release process

[Release process and manual setup](docs/RELEASE_PROCESS.md) · [Approved Phase 3C plan](docs/PHASE3C_PLAN.md).

GitHub settings writes returned 403, so owner setup is still required. The integration branch is `develop`, created at exactly `170323f`; historical `development/...` branches are preserved. No merge or deployment occurred during preparation.

Completion means **Implemented → Playable on Quentin’s iPhone → Released after approval and public verification**. Passing CI alone is not Playable or Released.


## First iPhone preview

[Simple iPhone upload instructions](docs/IPHONE_PREVIEW.md). The artifact-only packaging workflow prepares the tested Phase 3C commit `ebff789` for a separate Cloudflare Pages Free project without merging main or using deployment credentials. The manual deployment workflows remain gated; preparing/downloading a ZIP does not publish a website or establish Playable.
