export interface SpeciesRules {
  locations: [string, string, string, string, string];
  stores: Record<string, number>;
  achievement: string;
  source: string;
  discovery: string;
}
// Quantities are bounded game abstractions, not measured physiological units.
export const SPECIES_RULES: Record<string, SpeciesRules> = {
  bumblebee: {
    locations: [
      "Brood nest",
      "Flower meadow",
      "Dew margin",
      "Nest stores",
      "Hedgerow",
    ],
    stores: { pollen: 0, nectar: 45, broodFood: 60 },
    achievement: "Provisioned the next workers",
    source:
      "https://www.bumblebeeconservation.org/learn-about-bumblebees/beginners/lifecycle/",
    discovery:
      "Workers carry pollen to the nest. Rain, cold and darkness limit safe flight; nest stores buffer missed trips.",
  },
  ant: {
    locations: [
      "Brood chamber",
      "Leaf trail",
      "Damp root hollow",
      "Fungus garden",
      "Colony entrance",
    ],
    stores: { substrate: 40, fungus: 75, contamination: 10 },
    achievement: "Kept a fungus garden growing",
    source: "https://ielc.libguides.com/sdzg/factsheets/leafcutter-ant/diet",
    discovery:
      "Leaf fragments feed the cultivated fungus. Gardening, harvesting and waste removal form a connected food system; the playable worker does not found a new colony.",
  },
  rabbit: {
    locations: [
      "Warren nursery",
      "Grazing verge",
      "Drinking margin",
      "Deep warren",
      "Exposed meadow",
    ],
    stores: { fiber: 0, burrow: 55 },
    achievement: "A well-fed warren dweller",
    source: "https://animaldiversity.org/accounts/Oryctolagus_cuniculus/",
    discovery:
      "Rabbits recover additional nutrients through cecotrophy. Sheltered digestion and maintained burrows support survival, but do not remove disease or predation.",
  },
  wolf: {
    locations: [
      "Pack den",
      "Hunting grounds",
      "River bend",
      "Forest clearing",
      "Territory boundary",
    ],
    stores: { coordination: 0 },
    achievement: "Shared a cooperative hunt",
    source: "https://www.nps.gov/yell/learn/nature/wolf.htm",
    discovery:
      "Family packs cooperate in hunting and pup care. A hunt draws energy from the participating individuals and can feed companions as well as the player.",
  },
  elephant: {
    locations: [
      "Herd gathering area",
      "Acacia browse",
      "Watering hole",
      "Shaded grove",
      "Open grassland",
    ],
    stores: { mud: 0, groundwater: 40 },
    achievement: "Learned the herd’s water routes",
    source: "https://animaldiversity.org/accounts/Loxodonta_africana/",
    discovery:
      "Family knowledge helps elephants find water. Mud and shade reduce heat exposure; digging accesses a finite local reserve rather than creating water.",
  },
  mallard: {
    locations: [
      "Brood shore",
      "Dabbling shallows",
      "Reed channel",
      "Reed nest",
      "Open lake",
    ],
    stores: { plumage: 65, nest: 35 },
    achievement: "Ready for life on the wetland",
    source: "https://animaldiversity.org/accounts/Anas_platyrhynchos/",
    discovery:
      "Ducklings feed themselves and swim while remaining close to their mother. Flight develops later. Preening maintains plumage; hens incubate eggs near water.",
  },
  octopus: {
    locations: [
      "Nursery current",
      "Rocky prey ground",
      "Open current",
      "Crevice den",
      "Reef margin",
    ],
    stores: { camouflage: 0, den: 0, brood: 0 },
    achievement: "An experienced den keeper",
    source: "https://www.mcsuk.org/ocean-learning/wildlife-a-z/common-octopus/",
    discovery:
      "Planktonic hatchlings settle onto the seabed. Larger octopuses use camouflage and crevice dens. Females guard a single brood, then decline; camouflage is not invulnerability.",
  },
  meerkat: {
    locations: [
      "Group burrow",
      "Digging ground",
      "Moist root patch",
      "Pup nursery",
      "Sentinel rise",
    ],
    stores: { vigilance: 0, help: 0 },
    achievement: "A dependable group helper",
    source: "https://animaldiversity.org/accounts/Suricata_suricatta/",
    discovery:
      "Sentinel duty costs feeding time while helping companions detect danger. Helpers provision pups; breeding opportunities depend on the social group.",
  },
  bullfrog: {
    locations: [
      "Egg shallows",
      "Algal shelf",
      "Deep pond",
      "Reedy bank",
      "Calling bank",
    ],
    stores: { development: 0, skin: 80, territory: 0 },
    achievement: "From pond grazer to ambush hunter",
    source: "https://animaldiversity.org/accounts/Lithobates_catesbeianus/",
    discovery:
      "Tadpoles graze in water and cannot use terrestrial routes. Metamorphosis changes diet and movement. Pond drying threatens eggs and larvae; adult skin also needs moisture.",
  },
  raccoon: {
    locations: [
      "Maternal tree den",
      "Fruit grove",
      "Crayfish shallows",
      "Hollow tree",
      "Woodland edge",
    ],
    stores: { dexterity: 0 },
    achievement: "A resourceful night forager",
    source: "https://animaldiversity.org/accounts/Procyon_lotor/",
    discovery:
      "Raccoons switch between plant and animal foods. Skilled shallow-water searching accesses different resources from fruit gathering, and known routes become easier to travel.",
  },
  fox: {
    locations: [
      "Family earth",
      "Rodent meadow",
      "Stream margin",
      "Sheltered cache ground",
      "Woodland boundary",
    ],
    stores: { parcel: 0 },
    achievement: "Recovered a remembered food cache",
    source: "https://animaldiversity.org/accounts/Vulpes_vulpes/",
    discovery:
      "Foxes listen for small prey and store surplus food. Caches remain at a particular location, decay over time and can be recovered when fresh hunting fails.",
  },
  robin: {
    locations: [
      "Nest under cover",
      "Leaf-litter feeding ground",
      "Damp woodland floor",
      "Sheltered roost",
      "Song perch",
    ],
    stores: { fat: 40, territory: 0 },
    achievement: "Held a territory through a cold night",
    source: "https://www.rspb.org.uk/birds-and-wildlife/robin",
    discovery:
      "Robins defend feeding territories, including in winter. Singing costs energy; food reserves help sustain a small bird through cold nights. Nestlings cannot fly.",
  },
  seal: {
    locations: [
      "Pupping haul-out",
      "Shallow fishing bay",
      "Coastal water",
      "Resting rocks",
      "Deeper fishing ground",
    ],
    stores: { diveRecovery: 100 },
    achievement: "A practiced coastal diver",
    source: "https://www.fisheries.noaa.gov/species/harbor-seal/management",
    discovery:
      "Harbor seal pups can swim from birth but still nurse. Weaned seals forage at sea and haul out to rest. Deep foraging needs practice and recovery between dive bouts.",
  },
};
