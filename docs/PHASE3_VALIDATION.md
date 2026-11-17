# Phase 3 / 3B validation

Branch: `development/phase-3-wildlife-rpg` (base `79ca0bd`). Validation date: 17 November 2026. No merge, Pages deployment or changes to other repositories are part of this work.

## Checks

- `npm test`: **145 passing unit tests** across the original engine, living world, local wildlife and species modules.
- `npm run lint`: passed.
- `npm run build`: passed TypeScript project checking and Vite production bundling. No new dependencies are required. Current JS is approximately 150 KB gzip and CSS 16 KB gzip; original scenes add no new image requests.
- `npm run test:e2e`: **54 passing browser tests**, 27 scenarios each on desktop and an iPhone-sized Chromium project, using real built assets at `/lottery-of-life/` with external network blocked. A final targeted desktop/mobile bumblebee run also passed after the pollen-resource review.
- `git diff --check`: passed before commit.

## Coverage that establishes mechanical individuality

`src/game/biology.test.ts` exercises public commands, costs and persistent consequences for every species: finite pollen delivery and flight weather; substrate/fungus/waste coupling; finite digestive resources and burrow cover; recruiting and feeding named pack members; water-route memory and finite digging reserves; duckling swimming/flight and plumage/nesting; octopus settlement, location-bound dens, camouflage and fasting/egg care; sentinel/helping effects; aquatic frog restrictions, metamorphosis, food-web change and pond mortality; raccoon diet switching and route costs; location-bound fox caching; robin rivals, reserves and cold nights; and seal pup swimming, sea-only foraging, dive practice and recovery.

Tests verify a unique bounded mastery bonus for each species, catalog-wide v2 migration, exact Simple/Detailed outcome equivalence, unavailable post-death interactions, paid dive costs at their eligibility boundary, and the effect of egg care on an actual sampled offspring cohort. Pollen transfers to brood food without being converted to nectar.

`src/game/wildlife.test.ts` covers graph connectivity and access, distance/time/energy costs, escorted movement, persistent depletion, named caregiver costs and trust, stable NPC identities, independent NPC movement/needs/mortality, peaceful encounters, prey death, rival conflict, adaptive encounter pauses, v1/v2 compatibility and broken-reference rejection. NPC movement is checked against actual adjacent edges. The original tests retain currency, duplicate refunds, locked packs, one-time reward settlement, birth generation, offspring aging and bloodline continuation.

## Browser and visual checks

- Dedicated fullscreen active life with no main-menu sidebar; functional Life/Explore/Social/Journal/More routes, hash refresh and browser Back.
- Elephant calf escorted to water; mother location and relationship persist through refresh and a focused encounter.
- Ant brood cannot leave its chamber; workers tend fungus and harvest leaf substrate through real commands.
- All **13 species** expose a species-specific activity, advance a phase, change saved biology and retain the exact result on refresh. Per-species checks also reject horizontal overflow.
- Simple/Detailed setting persistence, eight optional discovery topics, earned Coins and all three displayed pack odds.
- Actual abandonment followed by a living elephant in the same UI session: the archive notice is absent, while the lifetime record and currency remain intact.
- Death/records, corrupt-save preservation, confirmed reset/import, JSON export, collection dialogs, focus handling and offspring continuation.
- A 390 × 664 usable viewport checks that the first primary action is above the fixed navigation. Keyboard Enter activates navigation. Day/night and heavy-rain scene state is checked and captured.
- Original elephant, wolf and ant scenes were visually inspected in desktop/mobile captures. Vector silhouettes are stylized, not anatomical reference plates. Other species retain credited photo/specimen fallbacks.

Screenshots are generated in ignored `test-results/`, including `active-first-screen-*`, `phase3-elephant-*`, `phase3-wolf-*`, `phase3-ant-*` and `night-rain-*`.

These checks establish software behavior, not ecological calibration or physical iPhone/Safari certification. The production site remains at its previously approved deployment until a separate deployment instruction. Remaining model and art work is recorded in [Phase 3 scope](PHASE3.md) and [species assumptions](SPECIES_INDIVIDUALITY.md).
