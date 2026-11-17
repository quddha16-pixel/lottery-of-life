# Phase 3 and 3B — Wildlife RPG framework

Review branch: `development/phase-3-wildlife-rpg`, based on deployed `79ca0bd`. This work is not merged or deployed. The Pages source branch and workflow are unchanged.

## Playable framework

The active life opens on an original layered SVG habitat, the animal, compact condition indicators, current circumstances and contextual decisions. A five-item navigation bar leads to **Life, Explore, Social, Journal and More**. Explore offers a connected local map with persistent food/water/cover, temperatures, travel costs and stage-dependent access. Destinations remain within the historically generated region; they are habitat archetypes, not reconstructed named landmarks. A day has the existing four phases. Sky, light, rain, water margins and habitat presentation use saved conditions. Motion is restrained and honors reduced-motion preferences.

Travel pays both an explicit distance cost and ordinary phase metabolism. Longer routes resolve two complete phases; death can stop the journey. Young elephants require capable escorts, wolf pups stay at the den until the supported emergence threshold, ant brood cannot choose transport, ducklings can swim but not fly across open water, and nursing seal pups can swim with a mother. Tadpoles cannot use dry bank routes. Adult movement remains connected, including automatic local movement.

Nearby animals have stable identities, species, age/stage, health, hunger, energy, injury, trust, location and priorities. They feed, rest, move along links, incur injuries, reproduce as small sampled local cohorts, and die. Named relationships persist in saves and across a bloodline takeover. Family mirrors use the original family simulation rather than receiving a second mortality roll. Larger populations remain aggregate ecological resources. Encounters arise from actual co-location and developmental capabilities; they include peaceful meetings, prey, rivals, predators and potential mates. Outcomes spend real phases and resources and can cause lasting injury or permanent death. Adaptive pacing pauses for important encounters; an explicit long skip can pass opportunities as before.

## Approachable presentation

**Simple** narration uses short descriptions and familiar vocabulary; **Detailed** adds ecological context. This is a saved presentation preference. No narration function mutates state, consumes random numbers, changes eligibility, or changes survival/rewards. Both modes run the same engine. Mortality stays permanent, non-graphic and respectfully explained. The lifetime record retains the cause, age and story.

Optional **Discover this species** notes in More cover biology, habitat, diet, development, predators, social life, geography and historical context. Each species links to a relevant reference. No mandatory education dialogs interrupt a life. Touch controls and keyboard controls use native buttons, labels, focus indicators and semantic navigation. The layout includes dynamic viewport units, safe-area padding and reduced-motion support. Physical Safari testing remains a separate device check.

Packs still cost 60 earned Coins, with visible 60% fox / 30% robin / 10% seal probabilities and the original 20-Coin duplicate refund. All ten starter species remain free. No real-money purchases, ads, login streaks, real-time waiting, external AI or paid services were added. Species mastery provides one bounded 12-score / 18-Coin lifetime bonus; it is settled by the existing one-time death/reward system and does not pay out repeatedly for clicking an activity.

## Architecture and compatibility

- `src/data/species-rules.ts`: all 13 location profiles, initial biological resources, discovery facts, source links and unique achievement names.
- `src/game/biology.ts`: shared species modules for resource loops, capabilities, feeding webs, movement, reproduction, risk, thermal response, development, experience and mastery. These hooks run inside the original phase resolver for direct and autonomous play.
- `src/game/wildlife.ts`: persistent local graph, nearby animals, contextual interaction eligibility, encounters and scene descriptors.
- `src/game/engine.ts`: the existing authoritative phase, mortality, family, reward and pack systems; new public `interact`, `travel`, `meetAnimal`, `respondToEncounter` commands validate and clone state before changing it.
- `src/game/narration.ts`: read-only presentation and optional discoveries.
- `WildlifeScene.tsx`, `GameplayScreen.tsx`, `Wildlife.css`: scenes and responsive navigation. Simulation logic is outside React.

Save format 3 accepts valid formats 1 and 2. Migration adds deterministic local/biological state without advancing dates, ages, phases or either pre-existing RNG. Coins, unlocked species, traits, health, family, journal and lifetime records remain. The original `life-simulator.save.v1` key and valid-backup recovery are retained. Existing pregnancies/cohorts remain scheduled; migration does not re-run breeding eligibility or rewards. New abilities use the corrected current species thresholds. Corrupt data still pauses autosave instead of being erased.

The archive-notification defect was UI state: abandonment set a general notice which survived navigation into the birth flow. Navigation now clears transient messages; new-life commitment also clears them. Storage failure warnings remain persistent. Browser tests exercise an actual abandonment followed by a new elephant without reloading away the old notice.

## Boundaries and remaining work

Every current species now has an actual mechanical loop, supported abilities, contextual activities and a species mastery reward; no additional species were added. This is a playable simulation, not a calibrated biological model. Remaining work includes richer portraits/illustrations for the ten fallback species, finer-scale habitat geometry, mass/energetics calibration, seasonal reproductive variation by latitude, detailed sex/caste/dominance and dispersal models, explicit pathogens, longer independent NPC life histories and physical iPhone Safari testing. Quantitative costs, probabilities and resource scales are transparent game approximations. Passing software tests does not validate scientific accuracy. See [species assumptions](SPECIES_INDIVIDUALITY.md) and [validation](PHASE3_VALIDATION.md).
