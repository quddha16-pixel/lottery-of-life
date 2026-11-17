# Phase 3C — Make the living world playable

Status: **approved by Quentin for implementation in reviewable feature milestones.** This document is the design contract, not a completion report. No merge or deployment is authorized by implementation approval.

## Outcome and completion gates

A new player should see an animal in a recognizable place, understand its immediate situation, make an age-appropriate choice, and see what changed. A young child should understand the main choices; an adult should find meaningful ecological and social consequences beneath them. The game keeps permanent death, uncertainty, historical generation, earned progression and interconnected biology.

The three gates are independent:

| Gate | Required evidence |
|---|---|
| Implemented | The agreed scope exists, appropriate automated checks pass, saves/progression remain compatible, and limitations are listed. This is not a claim of enjoyment or scientific validation. |
| Playable | Quentin receives the exact candidate's separately labeled HTTPS preview and personally tests its changed experience on his iPhone. Record the candidate SHA, device/Safari details, paths tested, observations and unresolved problems. Mobile Chromium emulation cannot pass this gate. |
| Released | Quentin explicitly approves that candidate, the approved changes reach main through a reviewed PR, an approved production workflow publishes the tested artifact, and the public commit, assets, navigation and save/reload are verified. |

A phase is not fully complete at Implemented. No Phase 3C release occurs without explicit approval. Preview publication also needs explicit approval; preparing its workflow does not publish it.

## Starting evidence

The latest existing implementation is `170323f831e340c4ee52997dc716cce910070fd5`, descending from deployed Phase 2 `79ca0bd`. The audit demonstrated real travel, persistent named relationships, elephant route memory and ant substrate harvesting. It also found:

- Ten of thirteen species start with one of two shared care/wait interaction sets. Signature loops often appear long after birth.
- A 390 × 664 wolf screen shows only one complete action before navigation covers part of the next. Map destination explanations and consequences are below the fold.
- After an elephant learned a route at age one day, the last-moment message remained unchanged through fourteen more days. Automatic care left the calf at zero hydration at a watering hole in heavy rain.
- An ant reached worker age after twenty Balanced-care clicks with fungus zero and contamination one hundred, while its primary text described a calm situation.
- Leaf harvesting increased substrate, but Simple narration displayed failed-meal feedback and cut off the colony result.
- Only elephant, wolf and ant have original animal vectors. The illustrated animal is decorative; scene taps do not initiate interaction.
- The same five-node graph, common NPC templates, hidden biological resources and distant mastery rewards make different lives feel similar.

These are reproducible examples from a small sample, not estimates of every seed's balance. Existing all-species tests manually prepare adult ages, locations, resources and companions; they do not establish the quality of a fresh life.

## Work package A — Trustworthy survival and consequences

Address these before presentation polish so clearer graphics communicate reliable mechanics.

1. Replace the stale single feedback field with a structured result of the latest command or automatic batch: action, elapsed time, meaningful changes, reason, new opportunities, and critical condition. Show the latest resolved result, not the last manually selected action indefinitely. A quiet batch may summarize quiet progress honestly.
2. Separate food-for-self from colony-resource collection. A successful leaf harvest must say leaves were gathered, how they help the garden, and whether the ant itself ate. Simple mode must retain the important outcome rather than taking the first two sentences of a longer string.
3. Review dependent care and water physiology by species/stage. Automatic care must consider hydration when milk/provisioning is the supported source. Where a young animal cannot drink independently, show the biologically appropriate help/feeding response and its dependence on a caregiver. Rainfall or a nearby pool must not imply automatic access. Do not add a universal drink button or immunity.
4. Stop adaptive pacing before a meaningful response window is passed: development, a critical need, caregiver loss, an actionable encounter, garden deterioration or an emerging resource shortage. Explicit long skips still simulate every phase and may miss opportunities; explain that distinction.
5. Review colony background care while the player is an egg/larva/pupa. A healthy colony should not silently become an unmanageable garden crisis through unavoidable waiting in the sampled opening. Care has finite resources and can fail; both causes and opportunities to respond must be understandable.
6. Examine dependency thresholds and unreachable eligibility checks, including elephant activities hidden by a broad early return. Correct only with a documented biological/play boundary; do not give newborns adult abilities.

Evidence: reproduce the audited elephant and ant seeds through ordinary UI play, then show current feedback and a feasible response. Test depleted/caregiver-absent variants to retain real mortality. Multi-seed reports should show distributions and causes, not just favorable examples.

## Work package B — A different opening for every species

Distinctive from birth means the actual developmental setting, body, care network, resources, constraints and first meaningful opportunity differ. It does not mean an egg can decide to forage or a newborn wolf can hunt.

For immobile/very dependent stages, show a short observable nursery sequence with real simulated development, care and mortality. An explicit “Continue to the next important moment” advances the existing rules and stops for a consequential event. Inspecting a caregiver or selecting what to observe changes the view, not the animal's capabilities. Distinguish observation from a time-spending animal action.

Aim for a recognizable species-specific situation within the first minute and an age-appropriate signature choice or clearly explained developmental transition within the first five minutes of a representative surviving opening. If mortality interrupts, show a grounded explanation instead of guaranteeing survival. Do not require dozens of identical nursery clicks.

| Species | Birth and early experience | First distinctive loop and visible consequence | Later depth retained |
|---|---|---|---|
| Buff-tailed bumblebee | Brood cell, larval food and finite colony stores; visibly different egg/larva/pupa stages. Weather affects the workers bringing food. | At worker emergence choose a reachable flower patch under actual flight conditions, collect a visible pollen load, return and provision brood. Show carrying capacity, nest supply and weather tradeoffs. | Resource depletion, daylight/cold/rain flight limits, repeated provisioning and colony mastery. Worker play does not become queen reproduction. |
| Leafcutter ant | Nursery within a working colony, with garden condition and background workers visible. Automated development reports relevant changes. | Worker duties form a real sequence: harvest leaves, carry substrate, tend fungus, remove waste. The scene and concise condition cues show what each stock does. | Moisture/contamination tradeoffs, garden recovery, travel exposure, colony service and specialist success. No mating for a non-reproductive worker. |
| European rabbit | Sheltered warren nursery and episodic maternal provisioning; care, warmth and exposure matter. | Once development permits, choose a safe grazing edge and return for sheltered digestion/cecotrophy. Show finite digestive stock and warren protection. | Cover maintenance, predators/disease, breeding and finite food rather than free repeated digestion. |
| Gray wolf | Den-bound pup dependent on particular family members. Show caregiver provisioning costs and nearby litter/pack relationships. | Early age-appropriate closeness, care and den emergence lead to following trusted pack members and learning a nearby route. Show which companion joined or could not help. | Recruiting real companions, shared hunting costs/meals, rivals, territory, seasonal breeding and pack losses. No newborn hunt. |
| African savanna elephant | Calf beside identifiable mother/older relatives, with milk needs, heat and herd movement apparent. | Choose an escorted route to shade/water, learn from a trusted relative and later recognize that location. Show who accompanied the calf and how knowledge changed a return journey. | Long family relationships, finite water digging, mud/heat protection, long development and reproduction. Dependence cannot mean years of repetitive care clicks. |
| Mallard | Precocial duckling beside mother/brood; feeding and swimming differ immediately from nursing mammals. | Dabbling in a shallow patch versus keeping plumage in condition; make food, wet/cold exposure and brood proximity visible. | Feather development, open-water access, nesting and seasonal reproduction. Swimming does not imply immediate flight. |
| Common octopus | Small planktonic hatchling in a current, with suitable food and exposure; no adult den behavior before settlement. | Settlement changes body/scene/movement, then choose a real crevice, camouflage and hunt from cover. Show occupied den and protection loss on movement. | Solitary tradeoffs, finite prey, camouflage decay, brood care and terminal reproductive decline handled respectfully. |
| Meerkat | Pup in a group nursery dependent on helpers, with group availability and risks visible. | At suitable development, choose a foraging turn, lookout duty or helping pups. Show the companion who benefits and the feeding opportunity forgone. | Socially restricted breeding, vigilance, provisioning, digging prey and persistent group relationships. |
| American bullfrog | Eggs in actual pond water, followed by a recognizable grazing tadpole. Pond depth/moisture and aquatic-only routes matter. | Choose an algal feeding area versus safer aquatic cover; metamorphosis visibly changes body, diet and bank access. | Pond drying, skin moisture, ambush prey and calling/reproduction. Document the fixed transition as an approximation rather than universal timing. |
| Raccoon | Maternal tree den and dependent kit care, then gradual dexterity/route learning. | Choose fruit gathering or shallow-water searching; show different depleted resources, practiced dexterity and safer return routes. | Seasonal food alternatives, nocturnal opportunities, historical human hazards only when appropriate, and family development. |
| Red fox (unlock) | Family earth and parental provisioning, followed by age-appropriate exploration. | Listen/pounce for prey, then cache surplus at a chosen known location and recover it when needed. Show the actual cache and its changing condition. | Decay/competition, route memory, seasonal breeding and parental care. Retrieval must never create food. |
| European robin (unlock) | Nestling fed by parents, followed by a clearly changed fledgling stage; grounded movement before supported flight. | Forage to build reserves and choose a sheltered roost; later song has a real rival/territory consequence. Show the reserve spent overnight. | Cold nights, seasonal territory/breeding, food access and the cost of singing. |
| Harbor seal (unlock) | Pup on a haul-out with mother; distinguish swimming capability from independent feeding. | Assisted movement while nursing, then shallow foraging bouts after weaning, with visible recovery and haul-out choices. | Learned deeper diving, finite prey, maternal loss, coastal conditions and between-bout recovery. Avoid implying one breath lasts a six-hour phase. |

The table is a design contract, not an assertion that all these player-facing experiences currently exist. Verify biological assumptions against the existing source notes and additional conservation/agency/species references where needed. Document uncertainty, geographic/seasonal variation and gameplay abstractions. Quantitative parameters require calibration; citations alone do not validate them.

## Work package C — Interactive wildlife scenes and exploration

Keep the shared React/TypeScript/Vite architecture and authoritative engine. Scene interactions dispatch the same validated commands as buttons; they must not create a second simulation.

- Provide coherent illustrated bodies and habitats for all thirteen existing species, including relevant developmental forms. Use original vectors or explicitly licensed assets, documented in asset credits. Do not add species or paid art services.
- Give important animals, resources and destinations discoverable hit targets with readable labels. Tapping mother, a leaf trail, a den, a pool or a cache opens the corresponding available interaction or contextual explanation. Keyboard focus/Enter exposes the same operations.
- Distinguish inspection from commitment. Preview a route's time, energy, escort requirement and risk context before travel. An unavailable destination explains the age/condition requirement beside the selection, not below an unseen map.
- Show persistent changes: companions following, a carried pollen/leaf load, depleted food, a healthy or distressed garden, remembered routes, cached food, changing plumage/body and occupied dens. Short action poses and restrained transitions acknowledge outcomes; reduced-motion mode retains the information.
- Use more than renamed copies of the same five-node layout. Vary compatible local routes/opportunities using the existing seed, species, stage and historical habitat, with bounded graph size and validated connectivity. Reveal useful discoveries without obscuring an animal's biologically necessary known surroundings.
- Anchor encounters to actual co-location, needs and relationship history. Keep calm encounters and quiet days. No mandatory drama quotas or disconnected random story cards.
- Retain a readable button alternative to every scene target. Unavailable controls explain themselves; decorative scenery does not pretend to be clickable.

## Work package D — A clear mobile decision loop

Prototype and review the first screen before broad art polish. Target the actual usable iPhone viewport, including Safari controls, safe areas and dynamic height; also verify desktop and keyboard use.

The screen should answer, in order: who/where am I, what matters now, what can I do, and what did the last decision change? Prefer two or three relevant choices with comfortable touch targets, not a long generic action inventory. Keep less frequent actions reachable through a clear expansion. Do not solve space by shrinking text.

- Show the animal and immediate context, a concise critical need when present, and the useful choices without fixed-navigation overlap.
- Place the latest consequence beside the decision area. Avoid stale batch banners and contradictory calm messages during a species-resource crisis.
- Keep four familiar survival cues compact. Surface the one or two species-specific resources that explain the current decision, using a qualitative cue and optional details rather than a second statistics dashboard.
- Simple and Detailed describe the same facts and offer identical eligibility/outcomes. Simple uses short cause/effect explanations, not just generic weather. Detailed adds ecological context and terminology. Narration must remain read-only and consume no random draws.
- Present death clearly and respectfully: what happened, the relevant cause, what the player could know, and a concise life story. No gore, sensationalism or implication that every death was preventable.
- Make optional field notes discoverable from relevant animals/places and through a library. No mandatory educational pop-ups. Facts cover biology, habitat, diet, development, predators, society, geography and historical uncertainty.

## Work package E — Lives, mastery and preserved progression

Make development, learned places, trusted companions, colony contributions and genuine biological successes visible while alive. Show relevant progress without streaks, grind incentives or exaggerated celebration. Preserve the existing one-time reward settlement; milestones must not mint repeatable Coins or alter paid/free economics. Packs remain earned-currency-only with transparent probabilities and duplicate handling.

Generate a concise life timeline from actual simulated events, including calm development, setbacks, choices and relationships. Different outcomes should follow different states and decisions. Do not fill the journal with invented certainty or unrelated stories.

Keep the current storage key and accept all previously supported save versions. Add migration only when new persisted fields are necessary. Migration must preserve identity, age/date/phase, random streams, Coins, unlocks, packs, records, offspring, family and bloodlines. Do not reset progress or silently compensate by granting immunity. Existing difficult states need truthful feedback and supported responses, not deletion. Preview and production use different origins; exporting a backup is optional and explicit, never automatic overwriting.

## Validation and review sequence

1. **Survival/feedback repair PR:** ordinary-UI reproductions of the two audited seeds, structured action outcomes, batch interruptions and caregiver/resource edge cases. Include before/after evidence.
2. **Opening/pacing and interaction prototype PR:** wolf, elephant and ant initially validate the shared design. Show short recordings at newborn, first meaningful movement/work, an encounter and a setback. Do not call all-species work complete at this point.
3. **Catalog completion PRs:** finish the other ten species and developmental forms using shared modules. Each receives a documented fresh-life path, a meaningful resource/social loop, a developmental change and a distinct success condition. Continue to preserve all existing starter/unlock availability.
4. **Accessibility, story and progression review PR:** verify Simple/Detailed facts, keyboard/focus, touch sizes, optional depth, discovery access, non-graphic death and idempotent rewards.
5. **Candidate preview:** after explicit preview approval, publish an exact SHA to the separate host. Provide opening instructions and a short species checklist. Record unresolved issues, not just test totals.
6. **Quentin's iPhone review:** test a new life, a continued/migrated life, scene actions, travel/locks, relationships, key consequences, save/reload and death/continuation. Observe a child and an adult where available; record confusion and revise. Do not claim such sessions occurred without actual observations.
7. **Release review:** after Playable evidence, request approval for a specific candidate. Merge only on approval, then separately obtain any required production-deployment approval. Verify the public SHA and player experience before marking Released.

Automated coverage should include species/stage capabilities and resource transfers, meaningful NPC costs, graph/accessibility, survival failure causes, pacing interruptions, exact narration-mode outcome equivalence, full legacy migration, pack/reward/bloodline regressions, and preview/production artifact labeling. Use several seeds and inspect survival distributions. Fresh-life UI flows must not advance ages, inject stocks, teleport companions or force encounters. Prepared adult fixtures remain useful additional unit/integration coverage, clearly labeled as such.

Browser layout checks must assess a useful set of choices and visible consequences, not merely one button. Include 390 × 664 and other representative mobile/desktop sizes, route explanations, focused dialogs, keyboard-only actions and reduced motion. Track load size, unnecessary re-renders and long-skip time against the baseline; optimize without discarding simulation depth.

## Scope boundaries and decisions reserved for review

No additional species, real-money purchases, ads, paid gambling, daily-login pressure, forced real-time waits, paid AI or paid hosting. No wholesale engine replacement. No guaranteed survival. No claim of scientific calibration from software tests.

Quentin approved this scope and opening-experience contract. During implementation, major changes to biology, save semantics, rewards or release scope require a concrete reviewed proposal. The first deliverable after approval is the survival/feedback repair PR, not a deployment.
