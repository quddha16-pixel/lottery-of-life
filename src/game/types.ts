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
    | "drought"
    | "food-shortage"
    | "predator-pressure"
    | "flood"
    | "breeding";
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
  biology?: SpeciesState;
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
export interface SpeciesState {
  model: 1;
  stage: string;
  stores: Record<string, number>;
  skills: Record<string, number>;
  milestones: string[];
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
  version: 3;
  area?: LocalArea;
  world?: LocalWorld;
  pacing: Pacing;
  narration: "simple" | "detailed";
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
export interface LocalNode {
  id: string;
  label: string;
  kind: "home" | "forage" | "water" | "shade" | "boundary";
  links: string[];
  distance: number;
  exposure: number;
  temperatureOffset: number;
  x: number;
  y: number;
}
export interface NearbyAnimal {
  id: string;
  name: string;
  species: string;
  role:
    | "mother"
    | "companion"
    | "mate"
    | "rival"
    | "predator"
    | "prey"
    | "offspring";
  familyId?: string;
  ageDays: number;
  stage: string;
  health: number;
  hunger: number;
  energy: number;
  injury: number;
  bond: number;
  location: string;
  priority: "feed" | "rest" | "water" | "protect" | "roam";
  alive: boolean;
  reproductive: boolean;
  offspring: number;
  lastBirthDay: number;
  engagedUntil?: number;
}
export interface Encounter {
  id: string;
  animalId: string;
  kind: "predator" | "prey" | "rival" | "companion" | "mate";
  location: string;
  beganDay: number;
  cooldownUntil: number;
  status: "active" | "resolved";
  outcome?: string;
}
export interface LocalArea {
  model: 1;
  ownerId: string;
  rng: number;
  ticks: number;
  nodes: LocalNode[];
  animals: NearbyAnimal[];
  encounter?: Encounter;
  feedback?: string;
  outcome?: { command: string; summary: string; changes: string[]; phases: number };
}
