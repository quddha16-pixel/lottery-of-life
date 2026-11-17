# Phase 2 design snapshot

This document records the earlier Phase 2 implementation at `79ca0bd`. Several limitations below were addressed in Phase 3 and 3B. Consult [the current scope](PHASE3.md) and [species mechanics](SPECIES_INDIVIDUALITY.md) for present behavior.

That review branch combines the requested birth/gameplay overhaul with a coherent first implementation of Phase 2. It is intentionally a local, aggregate simulation rather than an attempt to reconstruct every organism on Earth.

## Implemented systems

- **A — Living environment:** persistent precipitation, temperature, soil moisture, water, vegetation, prey, predator activity, competition, habitat condition, daylight and season. The world's previous state influences its next state. Daily forcing is seeded; rainfall and evaporation change moisture/water, which affect plant growth and prey, which affect predators and competition. Local patches deplete through use and regenerate over time.
- **B — Connected survival:** feeding success depends on local food, experience and social circumstances. Drinking depends on water. Heat affects hydration costs; temperature thresholds affect health. Predator/conflict risk responds to ecological pressure, condition, caution and shelter. Resource scarcity changes autonomous movement/feeding behavior. Injuries and depleted reserves persist. Family survival responds to world pressures too.
- **C — Life-stage and situation slice:** species-specific stages still gate actions and reproduction; older individuals have additional fatigue. Dependent young get passive provisioning during quiet actions rather than impossible locomotion. Limited sensory learning appears only outside egg/pupal stages. Sampled offspring grow and survive in the same persistent world. Reusable continuing situations track cause, date begun, days, severity, player responses and resolution: drought, shortage, predator pressure, saturation/flood pressure and breeding opportunity.
- **D — Pacing and individuality slice:** Immersive, Balanced and Story Focus share the same phase resolver. Balanced and Story Focus resolve routine decisions in bounded batches and pause for development, situation changes, serious injury, critical condition or death. Dependent periods can progress in longer care batches. Personality tendencies influence caution, exploration, stress and learning; foraging experience and a decaying memory of dangerous encounters influence later behavior. Offspring inherit modest variation in biological traits and tendencies.
- **Narration:** the current situation is composed from actual weather, resources, injuries, fatigue and continuing situations. Consequence and situation records come from resolved rules, without an AI API or an unrelated random story deck. Quiet phases can be quiet.

## Rule consistency and performance

`act` is a pure state-in/state-out API. Its internal mutable phase resolver is also used by time skipping and adaptive pacing. Long advances clone the state once rather than cloning a growing journal every phase. They retain the same random draws and biological/ecological rules as manually executing the selected routine actions. Pacing is a stopping policy, never a survival bonus. Manual skips may pass opportunities, but still resolve needs, ecology, relatives, mortality and journals. Death stops the advance permanently.

An unrelated new founder starts a fresh local historical timeline. Bloodline continuation preserves the current world, calendar and relatives; archived families from other timelines are not co-simulated.

The ecosystem has its own saved PRNG stream, so the number of random draws used by a player action does not reroll the weather. All random state is saved. No server, paid infrastructure, external AI, accounts or analytics are introduced. Aggregate indices and three local patches keep per-phase work bounded; relevant family members remain individual records. The journal retains its existing 2,000-entry cap and situations retain a bounded active/resolved history. Very large family trees still need further profiling.

## Saves and presentation

Save format 2 adds the world, pacing, personality, experience and birth circumstances. The existing browser key is intentionally retained. Valid format-1 imports and autosaves migrate on read: currency, unlocks, active identity, dates, phase, biological statistics, family, records, achievements, journal and PRNG are preserved. Missing world/experience fields are initialized deterministically without consuming random state. Existing corrupted-save/backup protections remain. Future unknown versions are rejected.

The main menu, one-stage-at-a-time birth sequence and immersive active-life screen are separate React views. Static-host-safe hash navigation supports reload and browser Back. Main menu return does not discard the current life. The gameplay view presents animal identity/date, primary condition, phase, situation and actions before notebook drawers. Journals, relationships, family and time controls are expandable. Collection, packs, lifetime records and save management reuse existing systems. The creator credit remains on the main menu.

## Explicit limitations

This is not a scientifically calibrated survival or population model. Ecological quantities are normalized game indices, not census counts, field measurements or exact information an animal knows. Weather coefficients, carrying capacities, mortality hazards and personality inheritance are provisional. Software tests do not validate them scientifically.

- No agent-based neighboring predator, prey or mate identities; larger populations use simple resource-limited aggregate dynamics. Local patch changes are not continental migration or an actual territory map.
- Social bonds and nursery quality are compact proxies. Detailed group hierarchy, rival/territorial identities, kin-specific caregiving, dispersal and persistent relationships with non-family NPCs remain incomplete.
- Illness currently causes health/stress consequences under the existing provisional risk rule; there are no explicit pathogen, diagnosis or epidemiological states. Flood pressure is a continuing environmental signal, not a spatial flood simulation.
- Development uses fixed species-specific thresholds. Growth, mass, sensory maturation, stage-specific temperature curves, larval habitat transitions and diet quality require deeper models. Passive nursery care abstracts milk, provisioning and stored reserves; it does not give eggs conscious agency.
- Reproductive seasonality is a continuing opportunity signal; the older direct mating mechanic is not yet fully season-gated. There are no actual mate agents, dominance breeding hierarchies or autonomous reproduction among all relatives. High-fecundity species retain sampled cohorts rather than full clutches. Male-played breeding tracks a partner's cohort, not male pregnancy.
- Experience is a bounded local index and decaying danger association. It is not human-like episodic memory, universal emotional reasoning, or a complete species-specific cognition model.
- Simulation advances through player actions/pacing, not real elapsed time while the browser is closed. The world's persisted state resumes exactly; no offline catch-up is attempted.
- See `HISTORICAL_MODEL.md` for the supported birth windows, geographic subset and uncalibrated historical reconstruction. Geological time is supported as a date representation, not as a planet-scale ecosystem database.

## Next coherent stages

1. Review and calibrate species-level juvenile survival, resource requirements, thermoregulation and development with explicit primary references. Add longer, species-diverse seeded balance reports; keep plausible deaths rather than tuning for guaranteed success.
2. Replace family/bond proxies with a small set of persistent nearby caregiver, mate and rival agents. Connect care, dispersal, hierarchy, reproductive seasonality and offspring independence to their resources and health.
3. Add stage-specific diets, water physiology, sensory/mobility limits, illness states and habitat transitions. Flesh out continuing situations with organisms, spatial context and multiple rule-derived responses.
4. Extend movement and memory to a connected habitat graph, with actual local territories and seasonal migration. Improve quiet-period journal summarization and opportunity interruptions.
5. Expand historical/species content only after range/biome contracts and content review are stronger. Do not equate passing tests with validated realism.

The current work completes the local environment/connected-survival foundation and functional slices of situations, pacing and individuality. The full Phase 2 ecological/social realism milestone remains ongoing.
