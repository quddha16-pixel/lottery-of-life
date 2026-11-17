# Phase 1 validation archive

For the current review branch, see [overhaul validation](OVERHAUL_VALIDATION.md). The results below describe the original Phase 1 foundation.

Validated in the selected Cloud workspace, using Node.js 24 and system Chromium. Only `quddha16-pixel/lottery-of-life` was changed.

## Results

- `npm run lint`: passed, no diagnostics.
- `npm test`: **58 tests passed**.
- `npm run test:e2e`: TypeScript/production build passed; **14 browser tests passed** (seven flows each on desktop and mobile Chromium).
- `git diff --check`: passed.

Engine tests cover all ten founding species in all three historical scenarios, geographic/range validity, deterministic replays, action restrictions, daily transitions, metamorphosis, skip/manual equivalence, skip interruption, starvation/permanent death/one-time rewards, exposure and hydration consequences, senescence, leap/BCE dates, worker success, pack distributions/unlocks/duplicates, offspring/inheritance, continuation through three generations, serialization/replay and corrupt-save recovery.

Browser tests execute the built bundle from a GitHub Pages-style `/lottery-of-life/` subpath. Requests are fulfilled in process from `dist/`, with external requests blocked. They cover seed/manual birth, decisions/skips, persistence across reload, connected navigation and horizontal-overflow checks, collection field guides, keyboard focus loop/Escape, earned-currency packs, permanent death, corruption preservation/reset confirmations, JSON export/import and offspring takeover at actual age/date.

Desktop overview/daily and mobile overview/collection screenshots were visually inspected. Photography alignment, narrow-screen headings, dialog keyboard handling and unavailable arrow glyphs were corrected. Screenshots and traces are ignored test artifacts.

## Verification limits

- The managed **visible preview relay** failed with `timed out waiting for relay readiness`. The shared preview could not be opened. This does not affect the separate headless Chromium integration suite, which passed without the relay.
- Mobile checks are Chromium device emulation, not tests on a physical phone or Safari. No claim of full assistive-technology or cross-browser certification.
- No GitHub Actions run or Pages publication was requested/executed. Workflow configuration is prepared but must be exercised on GitHub when publishing is authorized. Private-repository Pages availability depends on the account plan.
- No paid infrastructure or paid APIs were used. There is no server-enforced anti-cheat. Biological/ecological balancing remains provisional; software tests do not validate scientific accuracy.

The next highest-value work is deeper Milestone B survival: stage-specific diets/habitats, calibrated juvenile risks, seasonal resource pressures and richer consequential encounters. C/D are functional starter slices, not complete simulations of ecology, family autonomy or genetics.
