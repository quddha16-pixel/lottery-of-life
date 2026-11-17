# Biological model, scope and known limitations

## What this build means

The interface is a natural-history game; the simulation is a set of explicit, simplified rules. Passing tests establishes software invariants, not scientific accuracy or predictive validity. No numerical survival probability in the engine is an empirical life table. Do not use this model as a conservation or welfare tool.

Each species profile is data, independent of React: scientific name, range, habitat, stage thresholds, diet and feeding behavior, predators, social behavior, reproduction, mortality, lifespan and modeled thermal constraints. Profiles identify approximation in their `note` fields. Reference lifespans use rounded wild-life ranges and broad upper bounds, not guarantees. Development, typical/max lifespan, hard upper mortality boundaries and thermal tolerances need expert review. Ages run from egg/birth/hatching rather than adult emergence; insect total lifetimes therefore include development.

## Reference reading

The profiles were informed by established natural-history accounts. These are reference links, not claims of a systematic scientific review or exact citations for game coefficients:

- Animal Diversity Web, University of Michigan: https://animaldiversity.org/
- Species accounts under `/accounts/<Scientific_name>/` (linked in each in-game field guide), including _Bombus terrestris_, _Atta cephalotes_, _Oryctolagus cuniculus_, _Canis lupus_, _Loxodonta africana_, _Anas platyrhynchos_, _Octopus vulgaris_, _Suricata suricatta_, _Lithobates catesbeianus_, _Procyon lotor_, _Vulpes vulpes_, _Erithacus rubecula_, _Phoca vitulina_. Older accounts may use taxonomic synonyms.
- IUCN Red List for distribution and ecological context: https://www.iucnredlist.org/
- AmphibiaWeb for bullfrog life history: https://amphibiaweb.org/
- Smithsonian National Zoo species reading: https://nationalzoo.si.edu/animals

Taxonomy is intentionally at the named species level: _Bombus terrestris_ rather than all bumblebees; _Atta cephalotes_ rather than all leafcutters; Mediterranean _O. vulgaris_ sensu stricto rather than the former global species complex.

## Geography and history

There are three **scenario baselines** (1900, 1980, 2020), one curated location per species, and favorable seasonal starts. The scenario sets food, warming and human-pressure coefficients; a deterministic seasonal/weather model changes conditions each day and gradual warming/fragmentation changes them across generations. These are illustrative ecological pressures, not reconstructed local weather or measured historical datasets. There is no global geographic model, dynamic predator population, migration, mapped territory or historical border database.

The existence window `[-10000, 2200]` is a conservative **content compatibility envelope**, not an estimate of species origin, extinction or a prediction of future survival. Only the three listed modern birth years are selectable. Internal astronomical integer years and day-of-year dates accommodate BCE and deep time representations; Gregorian seasonality itself must be replaced for truly ancient settings. No prehistoric species or ecology is implemented.

## Daily survival

Four equal decision phases per day. Low hunger/stress/injury and high health/hydration/energy are desirable. Activity patterns alter energy costs; no automatic claim of daytime-only or nighttime-only behavior. Feeding success reflects food and provisioning, social bonds and perception. Shelter reduces thermal exposure and injuries; these persist. Predation/conflict, illness, starvation, dehydration, exposure, injury, senescence and a maximum-age boundary can end the individual permanently. Threats draw from the profile, never an unrelated global event pool.

Mortality is deliberately provisional and probably too forgiving under routine survival priorities. No calibrated juvenile survivorship, parasite ecology, temperature-dependent growth, mass/size, detailed disease progression, colony collapse, fire/flood disaster event system or predator-prey simulation is present. Generic human conflict is represented through pressure, not historical hunting laws. The nursery abstracts the parent, colony or stored egg/pupal reserves; it is not an interactive adult for an egg. Nursing and provisioning are represented by the same resource meters as adult feeding. Marine hydration is an abstract condition meter; octopuses do not drink fresh water. Metamorphosis lacks explicit habitat transitions.

## Reproduction and family

Worker bumblebees and leafcutter ants are female colony workers, not reproductive queens. They can succeed through service and social contributions. A newborn wolf cannot hunt. Precocial ducklings can forage; development unlocks other actions. All reproductive species use simplified mate encounters and a breeding delay. Male-controlled lives track the partner's ensuing cohort, not male pregnancy. Breeding season, partner identity, dominance beyond a meerkat bond threshold, pair fidelity, weaning, reproductive aging and sex-specific dispersal remain future work.

Common octopuses have a single modeled reproductive episode followed by terminal senescence. Octopus/frog egg production is **not** an eight-egg clutch: only eight sampled descendants are tracked. Other cohort sizes are representative round values. Nest/egg incubation and gestation share a generic delay. Independent offspring require no feeding action; dependent offspring survival uses a caregiver/condition proxy. Offspring get simple stochastic mortality and condition changes, not a full second autonomous agent. Background reproduction is not implemented. Inheritance uses small parent-centered trait variation as a game abstraction; it is not a quantitative genetics model. The other parent's genetics are not tracked.

The tree tracks playable parentage, generation, dates and sampled descendants. Current-family relatives age in the same world; unrelated founders belong to separate timelines, so starting a completely new life may select another historical scenario. Continuing an eligible surviving direct offspring preserves its age, condition, random state, day phase and environment. A dead individual cannot act or be continued. Only controlled individuals get lifetime rewards. Future work should handle dispersal locations, custody, mate/other-parent records, all relative death causes, cohort density and independent families.

## Skips, rewards and collection

Skipping selects a deterministic routine priority and calls the exact same `act` function as manual decisions. It never just increments a date. Serious injury, critical health or death interrupts a skip. No guaranteed rare-opportunity popup system exists yet; unchosen breeding/exploration opportunities can pass. The latest 2,000 phase observations are retained across lives; significant lifetime and family records persist without that journal cap. Very large family/save sizes need further profiling and compaction before thousands of species.

Coins settle once on permanent death, with no reward for abandonment and no trivial newborn reward. Scores are capped per category and normalized by species life expectations rather than raw time. The centralized calculation rewards maturity, relative lifespan, offspring independence, bonds, exploration and colony service. This is initial balancing, not a complete achievement catalog.

One field pack costs 60 earned Coins. One species card is drawn: red fox 60%, European robin 30%, harbor seal 10%. Duplicate cards immediately return 20 Coins. Epic/Legendary exist as type-level rarity tiers and have zero probability in this pack. No real-money purchases. Starter species are not pack filler. Every new unlock enters both selection modes. A seeded PRNG is adequate for game reproducibility, not cryptographic randomness. Browser saves can be edited, cloned or rolled back; there is no server-enforced anti-cheat. Importing a valid old save can roll back death. These local-only limits are intentional, not security guarantees.

## Persistence

Version 1 JSON saves are validated structurally and for parentage, species unlocks and records using Zod. A prior valid autosave is retained for recovery. Unreadable unrecoverable data blocks autosave rather than overwriting it. Export/import and reset are explicit. The current life, environment, traits, relationships, journal, collection, currency, achievements, records and PRNG are persisted. No legacy migration exists because this is the first schema. Unsupported future saves are refused. Browser storage availability and quota can fail; the interface warns and allows export. Export backups regularly.

## Next highest-value milestone

Deepen Milestone B before adding more species: species-specific phase needs, calibrated juvenile risk curves, seasonal food/weather, stage-specific diets and habitat transitions, meaningful emergent threat/opportunity encounters, and richer social consequences. Revisit biological parameters with explicit species-level citations and balance extended seeded runs. Then deepen the existing C/D slices with robust mate identities, parenting and offspring autonomy. Thousands of species and prehistoric scenarios should follow stronger ecological contracts, validation and content tooling.
