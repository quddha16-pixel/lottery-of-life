# Continuous birth history

The generator no longer selects from three scenario years. It samples an integer year uniformly from the chosen species' supported interval, then samples a valid day of that year and a compatible historical habitat. All unlocked species have equal probability in random mode. The same species selection, seed and unlocked collection reproduce the same result. An optional engine-only `year` override supports deterministic diagnostics and is validated against both species and habitat bounds.

## Supported intervals

Years in the data are **astronomical**: 0 means 1 BCE; -5000 means 5001 BCE. The interface converts these correctly to BCE/CE. Every interval ends at **2025 CE**, the last complete year in the current content edition; it does not sample speculative future births.

| Species                            | Earliest supported astronomical year | Scope and basis                                                                                                                  |
| ---------------------------------- | -----------------------------------: | -------------------------------------------------------------------------------------------------------------------------------- |
| Bumblebee (_Bombus terrestris_)    |                               -5,000 | Conservative Holocene window, western/southern European meadow habitats                                                          |
| Leafcutter ant (_Atta cephalotes_) |                               -2,000 | Conservative late-Holocene Neotropical forest window; species-level fossil chronology is sparse                                  |
| European rabbit                    |                             -100,000 | Conservative Late Pleistocene portion of Quaternary natural history; Iberian refugial mosaics                                    |
| Gray wolf                          |                             -100,000 | Conservative Late Pleistocene Eurasian window, well within the wider wolf fossil history                                         |
| African savanna elephant           |                             -100,000 | Conservative Late Pleistocene African savanna window; no claim of species origin at this bound                                   |
| Mallard                            |                              -50,000 | Conservative Late Pleistocene window; southern wetland refugia, not glaciated northern lakes                                     |
| Common octopus                     |                               -3,000 | Shorter conservative Mediterranean window; the extant species complex and sparse soft-bodied fossil evidence limit deeper claims |
| Meerkat                            |                              -20,000 | Conservative terminal-Pleistocene southern African dryland model; a content assumption requiring specialist review               |
| American bullfrog                  |                              -50,000 | Conservative southern/eastern North American permanent-water refugia; no ancient Great Lakes shoreline claim                     |
| Raccoon                            |                              -50,000 | Conservative southern North American riparian habitats                                                                           |
| Red fox                            |                             -100,000 | Conservative Eurasian Late Pleistocene window                                                                                    |
| European robin                     |                              -20,000 | Conservative woodland-refugium model before postglacial expansion                                                                |
| Harbor seal                        |                              -20,000 | Broad ice-free coastal refugia before postglacial northern coastlines                                                            |

**These are supported content windows within known or reasonably inferred species histories, not calibrated estimates of first appearance.** The differing conservative lower bounds prevent false precision where species-level chronology is weak. They must not be displayed as exact speciation dates. Some bounds and habitat compatibility are explicit modeling assumptions, particularly where local reconstructions and taxonomic histories are incomplete. Content review by a relevant zoologist/palaeoecologist remains future work.

Reference starting points: [Animal Diversity Web](https://animaldiversity.org/), [IUCN Red List](https://www.iucnredlist.org/), [AmphibiaWeb](https://amphibiaweb.org/), and the species-level accounts linked in the in-game field guides. These support taxonomy, distribution, habitat and life history; they do **not** substantiate every numerical coefficient or exact lower bound in this implementation. No claim of a systematic paleontological literature review is made.

## Geographic compatibility

`src/data/history.ts` defines independent validity intervals on habitat records. There are multiple supported geographic choices per species, and glacial/postglacial records where appropriate. Species existence and habitat validity must both contain the sampled year; incompatible combinations are rejected. Locations are broad physical regions and habitats, without invented coordinates, countries, political borders or ancient shorelines. The starter catalog is a curated **subset** of global distribution, not an exhaustive world map.

Before the Holocene, open refugial mosaics replace assumptions of modern northern forest. Southern permanent-water habitats replace glaciated lake basins. Coastal records remain broad enough to avoid invented precise Pleistocene coastlines. Global habitat maps, plate tectonics, sea-level geometry and local archaeological reconstructions are not implemented.

## Dates and world effects

The calendar uses integer years and day-of-year arithmetic, never JavaScript `Date`. Representation and seeded range sampling are tested down to -4.5 billion years. **This does not implement biological/ecological content for those times.** A future species must supply a supported existence range and compatible habitats; the engine refuses unsupported combinations.

Day/month precision in prehistoric lives is a proleptic Gregorian gameplay convention. Ancient organisms did not use that calendar. Years and local conditions are broad reconstructions, not historical records of an exact birth.

The generated region, habitat, season and date initialize temperature, pressure, food conditions, care circumstances and the persistent ecosystem. The year affects coarse climate/land-use pressures; the day and hemisphere affect season/daylight. Subsequent daily weather and resource feedback continue from that state. Industrial pressure increases continuously, rather than selecting a new fixed modern scenario. Ancient climate cycles are coarse illustrative oscillations, not a paleoclimate hindcast. Broad species-specific birth/egg-laying windows avoid obvious seasonal mismatches; southern habitats shift the modeled window by half a year. These proleptic day-of-year bands are approximate content assumptions, not local phenological records. Detailed breeding calendars and historical shifts remain future work.

## Future extinct species and humans

The generic sampler validates inclusive lower/upper species bounds and habitat bounds. Tests exercise origin-style and extinction-style bounds, including rejection of post-extinction years. Humans and extinct species are **not** added to the playable catalog by these tests. Their future profiles require independently reviewed chronology and ecology; a generic range representation alone is insufficient content validation.
