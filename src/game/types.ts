export type Phase = "Morning" | "Afternoon" | "Evening" | "Night";
export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type Priority = "survival" | "feeding" | "reproduction" | "exploration";
export type Action =
  | "feed"
  | "drink"
  | "rest"
  | "shelter"
  | "explore"
  | "socialize"
  | "evade"
  | "mate"
  | "care"
  | "wait"
  | "move"
  | "learn";
export interface WorldDate {
  year: number;
  day: number;
} // Astronomical years; day is zero-based. No JS Date limits.
export interface Location {
  continent: string;
  region: string;
  place: string;
  habitat: string;
  temperature: number;
  id?: string;
  hemisphere?: "north" | "south" | "equatorial";
  climate?: "temperate" | "tropical" | "arid" | "marine";
  precision?: "regional" | "local";
}
export interface HistoricalHabitat extends Location {
  from: number;
  to: number;
  richness: number;
}
export interface SpeciesHistory {
  birthWindow?: [number, number];
  existence: [number, number];
  evidence: string;
  habitats: HistoricalHabitat[];
  family: string[];
  trophic: "plant" | "predator" | "omnivore" | "fungus" | "plankton";
}
export interface HistoricalContext {
  epoch: string;
  description: string;
  climateOffset: number;
  richness: number;
  pressure: number;
  approximation: string;
}
export interface Situation {
  id: string;
  kind:
    "drought" | "food-shortage" | "predator-pressure" | "flood" | "breeding";
  began: WorldDate;
  days: number;
  severity: number;
  cause: string;
  status: "active" | "resolved";
  involvement: number;
  outcome?: string;
}
export interface HabitatPatch {
  id: string;
  label: string;
  food: number;
  cover: number;
  water: number;
}
export interface LocalWorld {
  model: 1;
  rng: number;
  elapsedDays: number;
  precipitation: number;
  daylight: number;
  season: string;
  moisture: number;
  water: number;
  vegetation: number;
  prey: number;
  predators: number;
  competition: number;
  habitat: number;
  patches: HabitatPatch[];
  activePatch: string;
  situations: Situation[];
}
export type Pacing = "immersive" | "balanced" | "story";
export interface Stage {
  name: string;
  fromDay: number;
  dependent: boolean;
}
export interface Species {
  behavior?: {
    feedTitle?: string;
    earlyFeedTitle?: string;
    feedingTransitionDay?: number;
    socialAction?: boolean;
    breedingInterval?: number;
    minBreedingBond?: number;
    terminalBreeding?: boolean;
    colonyForaging?: boolean;
  };
  id: string;
  name: string;
  scientific: string;
  group: string;
  rarity: Rarity;
  starter: boolean;
  image: string;
  range: string;
  existence: [number, number];
  history: SpeciesHistory;
  locations: Location[];
  lifespan: number;
  maxLifespan: number;
  stages: Stage[];
  diet: string;
  feeding: string;
  predators: string[];
  reproduction: string;
  social: string;
  mortality: string[];
  challenge: string;
  active: "day" | "night" | "crepuscular";
  water: "fresh" | "food" | "marine";
  adultDay: number;
  reproductive: boolean;
  offspring: number;
  gestation: number;
  independence: number;
  risk: number;
  food: number;
  cold: number;
  heat: number;
  source: string;
  note: string;
}
export interface Traits {
  resilience: number;
  perception: number;
  sociability: number;
}
export interface Stats {
  health: number;
  hunger: number;
  hydration: number;
  energy: number;
  stress: number;
  injury: number;
  bond: number;
}
export interface Individual {
  id: string;
  speciesId: string;
  name: string;
  sex: "Female" | "Male";
  caste?: string;
  birth: WorldDate;
  ageDays: number;
  traits: Traits;
  circumstances?: string;
  personality?: {
    caution: number;
    curiosity: number;
    learning: number;
    stressResponse: number;
  };
  experience?: {
    foraging: number;
    habitatKnowledge: number;
    dangerMemory: number;
  };
  stats: Stats;
  parentId?: string;
  generation: number;
  alive: boolean;
  death?: WorldDate;
  cause?: string;
  lastReproduction?: number;
  pregnantUntil?: number;
  pendingOffspring?: number;
  children: string[];
  independentYoung: number;
  explored: number;
  colonyService: number;
}
export interface JournalEntry {
  id: number;
  date: WorldDate;
  phase: Phase;
  age: number;
  text: string;
  kind: "birth" | "routine" | "milestone" | "danger" | "death";
  individualId: string;
}
export interface Environment {
  scenarioId: string;
  history?: HistoricalContext;
  careQuality?: number;
  location: Location;
  temperature: number;
  food: number;
  pressure: number;
  weather: string;
}
export interface LifeRecord {
  individualId: string;
  speciesId: string;
  name: string;
  birth: WorldDate;
  death: WorldDate;
  age: number;
  cause: string;
  score: number;
  coins: number;
  achievements: string[];
  offspring: number;
  surviving: number;
}
export interface GameState {
  version: 2;
  world?: LocalWorld;
  pacing: Pacing;
  rng: number;
  serial: number;
  coins: number;
  unlocked: string[];
  achievements: string[];
  date: WorldDate;
  phase: number;
  environment?: Environment;
  currentId?: string;
  family: Record<string, Individual>;
  journal: JournalEntry[];
  records: LifeRecord[];
  priority: Priority;
  lastPack?: { speciesId: string; duplicate: boolean; refund: number };
}
