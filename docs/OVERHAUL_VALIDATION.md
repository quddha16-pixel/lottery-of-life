# Birth, gameplay and living-world validation

Review branch: `development/living-world-overhaul`, based on `b32c4b2`. This branch is not merged or deployed; Pages remains restricted to pushes on `development/phase-1-foundation`.

## Checks

- Unit suite: **91 passed** (58 existing/regression tests, updated for continuous history, plus 33 historical/world/pacing/migration tests).
- Full browser suite: **18 passed**, covering nine flows on desktop and iPhone-sized Chromium.
- A focused desktop/mobile first-screen and pacing recheck: **4 passed** after adding the nursery-care shortcut.
- Lint: passed without diagnostics.
- TypeScript and production build: passed via `npm run build` (`tsc -b && vite build`).
- Whitespace validation: `git diff --check` passed.
- CI repeats the full test/build checks on the pushed review branch, without a deployment job for this branch.

## Behavior covered

History tests sample 180 seeded births for every catalog species, require more than 100 distinct birth years per species, exercise multiple compatible locations, and validate species/habitat bounds. They cover BCE/CE, leap handling, deep-time integer representation, origin/extinction-style bounds, historical environmental differences and approximate seasonal birth windows.

World tests cover persistent weather/resources, rainfall-water-vegetation feedback, local depletion and movement, continuing situations, personality/experience, sensory learning restrictions, juvenile mortality under genuine resource/predator pressure, passive care, colony contribution, and a separate saved weather RNG. Action selection cannot reroll the weather by consuming more player RNG draws.

Pacing tests compare every resolved routine phase with manually executing the identical actions in all three modes; they cover pauses at development and death, and cannot bypass mortality. Multi-year seeded checks run up to five years for three elephant lives, allow real death, validate finite schema-conforming world state, bounded journals and a runtime bound. They exposed an autonomy starvation loop caused by repeatedly feeding at zero energy in a depleted patch; recovery/movement priorities and resource-use rates were corrected. This is a practical stability check, not ecological calibration.

Version-1-shaped save tests preserve currency, unlocks, identity, date, phase, statistics and game RNG; initialize missing experience/world/biome fields deterministically; and verify play can continue. Existing pack distributions, duplicate handling, offspring inheritance, bloodline continuation, permanent death, journal and backup/import/export checks remain.

Browser tests exercise the actual production bundle under `/lottery-of-life/`, with requests fulfilled from `dist/` and external networking blocked. They cover the four-stage reveal, starting the immersive view, first action cards inside the usable mobile viewport, no homepage/sidebar above gameplay, no horizontal overflow, save/reload, return to menu, browser Back, protection against overwriting a living individual, routine pacing, expandable local-world/journal controls, collection/dialog keyboard handling, packs, death, JSON export/import, corrupt-save recovery and actual-age offspring takeover. The mobile layout test caught initially obscured first action cards; the layout was made more compact while keeping 44px routine-care controls.

## Limits

Screenshots of the mobile first screen and desktop/mobile collection/gameplay were inspected. Mobile Chromium emulation is not a physical iPhone/Safari test. The in-process static test host verifies production assets and the Pages subpath but does not publish or certify a new live deployment. No live deployment was attempted for this branch.

No test result establishes scientific accuracy. Historical bounds and climate, resource, social, growth and mortality coefficients remain explicit approximations. See `HISTORICAL_MODEL.md` and `LIVING_WORLD.md` for supported content, incomplete Stage C/D systems and the continuation plan.
