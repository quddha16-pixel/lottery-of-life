import { SCENARIOS, SPECIES, STARTERS, speciesById } from "../data/species";
import { nextDate } from "./calendar";
import { pick, random, seedFromText } from "./random";
import type {
  Action,
  GameState,
  Individual,
  JournalEntry,
  LifeRecord,
  Phase,
  Priority,
  Traits,
} from "./types";
export const PHASES: Phase[] = ["Morning", "Afternoon", "Evening", "Night"];
export const PACK = {
  cost: 60,
  duplicateRefund: 20,
  drops: [
    { id: "fox", weight: 60 },
    { id: "robin", weight: 30 },
    { id: "seal", weight: 10 },
  ],
};
export const ACTIONS: Record<
  Action,
  { title: string; detail: string; icon: string }
> = {
  feed: {
    title: "Forage for food",
    detail: "Reduce hunger. Searching costs energy and carries risk.",
    icon: "◈",
  },
  drink: {
    title: "Find fresh water",
    detail: "Restore hydration near the water’s edge.",
    icon: "◌",
  },
  rest: {
    title: "Rest & recover",
    detail: "Recover energy and ease stress. Hunger still grows.",
    icon: "☾",
  },
  shelter: {
    title: "Seek cover",
    detail: "Lower exposure and give injuries time to heal.",
    icon: "⌂",
  },
  explore: {
    title: "Explore habitat",
    detail: "Learn the surroundings, with greater exposure to threats.",
    icon: "↗",
  },
  socialize: {
    title: "Tend social bonds",
    detail: "Support family or colony; solitary species cannot use this.",
    icon: "♧",
  },
  evade: {
    title: "Avoid predators",
    detail: "Spend energy to stay out of sight.",
    icon: "≋",
  },
  mate: {
    title: "Seek a mate",
    detail: "An uncertain breeding opportunity with lasting consequences.",
    icon: "♡",
  },
  care: {
    title: "Care for young",
    detail: "Provision offspring and improve their survival prospects.",
    icon: "✧",
  },
  wait: {
    title: "Develop quietly",
    detail: "Remain in the nest or nursery for this phase.",
    icon: "◷",
  },
};
export const current = (s: GameState) =>
  s.currentId ? s.family[s.currentId] : undefined;
export const stageOf = (a: Individual) =>
  [...speciesById(a.speciesId).stages]
    .reverse()
    .find((s) => a.ageDays >= s.fromDay)!;
const clamp = (n: number) => Math.max(0, Math.min(100, n));
const copy = (s: GameState): GameState => structuredClone(s);
const id = (s: GameState) => `i${++s.serial}`;
function log(
  s: GameState,
  text: string,
  kind: JournalEntry["kind"] = "routine",
) {
  const a = current(s)!;
  s.journal.push({
    id: ++s.serial,
    date: { ...s.date },
    phase: PHASES[s.phase],
    age: a.ageDays,
    text,
    kind,
    individualId: a.id,
  });
  // A bounded log keeps browser saves small; permanent family and lifetime records remain.
  if (s.journal.length > 2000) s.journal.splice(0, s.journal.length - 2000);
}
export function createGame(seed = "life-simulator"): GameState {
  return {
    version: 1,
    rng: seedFromText(seed),
    serial: 0,
    coins: 0,
    unlocked: [...STARTERS],
    achievements: [],
    date: { year: 2020, day: 151 },
    phase: 0,
    family: {},
    journal: [],
    records: [],
    priority: "survival",
  };
}
function traits(s: GameState, parent?: Traits): Traits {
  const inherit = (key: keyof Traits) =>
    parent ? clamp(parent[key] + (random(s) - 0.5) * 12) : 35 + random(s) * 30;
  return {
    resilience: inherit("resilience"),
    perception: inherit("perception"),
    sociability: inherit("sociability"),
  };
}
function makeIndividual(
  s: GameState,
  speciesId: string,
  parent?: Individual,
): Individual {
  const sp = speciesById(speciesId);
  const sex = sp.reproductive ? pick(s, ["Female", "Male"] as const) : "Female";
  return {
    id: id(s),
    speciesId,
    name: pick(s, [
      "Aster",
      "Flint",
      "Fern",
      "Reed",
      "Moss",
      "Cedar",
      "Ash",
      "Sage",
      "Ember",
      "Willow",
    ]),
    sex,
    caste: sp.reproductive ? undefined : "Worker",
    birth: { ...s.date },
    ageDays: 0,
    traits: traits(s, parent?.traits),
    stats: {
      health: 90 + random(s) * 10,
      hunger: 20,
      hydration: 90,
      energy: 85,
      stress: 12,
      injury: 0,
      bond: 60,
    },
    generation: parent ? parent.generation + 1 : 1,
    parentId: parent?.id,
    alive: true,
    children: [],
    independentYoung: 0,
    explored: 0,
    colonyService: 0,
  };
}
export function startLife(
  state: GameState,
  options: { speciesId?: string; scenarioId: string; seed: string },
): GameState {
  if (current(state)?.alive)
    throw new Error(
      "Finish or abandon the active life before starting another.",
    );
  const s = copy(state);
  const scenario = SCENARIOS.find((e) => e.id === options.scenarioId);
  if (!scenario) throw new Error("Unknown historical scenario");
  s.rng = seedFromText(options.seed);
  const speciesId = options.speciesId ?? pick(s, s.unlocked);
  if (!s.unlocked.includes(speciesId))
    throw new Error("That species is locked");
  const sp = speciesById(speciesId);
  if (scenario.year < sp.existence[0] || scenario.year > sp.existence[1])
    throw new Error("Species is unavailable in this period");
  // Births are set in a favorable season; southern Africa uses austral spring.
  const location = structuredClone(pick(s, sp.locations));
  s.date = {
    year: scenario.year,
    day:
      location.region === "Southern Africa"
        ? 274
        : 151 + Math.floor(random(s) * 30),
  };
  s.phase = 0;
  s.environment = {
    scenarioId: scenario.id,
    location,
    temperature: location.temperature + scenario.warming,
    food: sp.food * scenario.food,
    pressure: scenario.pressure,
    weather: "Mild",
  };
  const animal = makeIndividual(s, speciesId);
  s.family[animal.id] = animal;
  s.currentId = animal.id;
  log(
    s,
    `${animal.name} begins life as a ${sp.name.toLowerCase()} in ${location.place}. ${animal.caste ? "A female worker, part of a larger colony." : sp.social}`,
    "birth",
  );
  log(s, `${scenario.title}. ${scenario.description}`, "birth");
  return s;
}
export function availableActions(s: GameState): Action[] {
  const a = current(s);
  if (!a?.alive) return [];
  const sp = speciesById(a.speciesId);
  if (stageOf(a).dependent) return ["feed", "rest", "shelter", "wait"];
  const actions: Action[] = [
    "feed",
    ...(sp.water === "fresh" ? ["drink" as const] : []),
    "rest",
    "shelter",
    "explore",
    "evade",
  ];
  if (sp.behavior?.socialAction !== false) actions.push("socialize");
  const interval = sp.behavior?.breedingInterval ?? 365;
  if (
    sp.reproductive &&
    a.ageDays >= sp.adultDay &&
    !a.pregnantUntil &&
    (a.lastReproduction === undefined ||
      (!sp.behavior?.terminalBreeding &&
        a.ageDays - a.lastReproduction >= interval)) &&
    a.stats.health > 50 &&
    a.stats.hunger < 65 &&
    a.stats.bond >= (sp.behavior?.minBreedingBond ?? 0)
  )
    actions.push("mate");
  if (
    a.children.some(
      (child) =>
        s.family[child]?.alive && s.family[child].ageDays < sp.independence,
    )
  )
    actions.push("care");
  return actions;
}
export function actionTitle(s: GameState, action: Action): string {
  const a = current(s);
  if (!a) return ACTIONS[action].title;
  const sp = speciesById(a.speciesId);
  if (action === "feed") {
    if (stageOf(a).dependent)
      return ["Egg", "Pupa"].includes(stageOf(a).name)
        ? "Develop in shelter"
        : "Receive nourishment";
    if (
      sp.behavior?.earlyFeedTitle &&
      a.ageDays < (sp.behavior.feedingTransitionDay ?? sp.adultDay)
    )
      return sp.behavior.earlyFeedTitle;
    return sp.behavior?.feedTitle ?? ACTIONS.feed.title;
  }
  if (action === "socialize" && !sp.reproductive) return "Support the colony";
  return ACTIONS[action].title;
}
export function calculateRewards(
  a: Individual,
): Pick<LifeRecord, "score" | "coins" | "achievements"> {
  const sp = speciesById(a.speciesId);
  const achievements = [];
  let score = Math.min(45, Math.floor((a.ageDays / sp.lifespan) * 30));
  if (a.ageDays >= sp.adultDay) {
    score += 25;
    achievements.push("Reached adulthood");
  }
  if (a.ageDays >= sp.lifespan) {
    score += 20;
    achievements.push("A full life");
  }
  if (a.children.length) {
    score += 15;
    achievements.push("New generation");
  }
  if (a.independentYoung) {
    score += Math.min(20, a.independentYoung * 5);
    achievements.push("Young reached independence");
  }
  if (a.stats.bond >= 75 && a.ageDays >= sp.adultDay) {
    score += 10;
    achievements.push("Strong social bonds");
  }
  if (!sp.reproductive && a.colonyService >= 8) {
    score += 25;
    achievements.push("Colony contributor");
  }
  if (a.explored >= 10) {
    score += 10;
    achievements.push("Habitat knowledge");
  }
  // Lifetime-only settlement, with a juvenile threshold, prevents birth/abandon farming.
  const coins =
    a.ageDays < Math.min(7, sp.adultDay) ? 0 : Math.floor(score * 1.5);
  return { score, coins, achievements };
}
function finish(s: GameState, cause: string, reward = true) {
  const a = current(s)!;
  if (!a.alive) return;
  a.alive = false;
  a.death = { ...s.date };
  a.cause = cause;
  const earned = reward
    ? calculateRewards(a)
    : { score: 0, coins: 0, achievements: [] };
  s.coins += earned.coins;
  s.achievements = [...new Set([...s.achievements, ...earned.achievements])];
  s.records.push({
    individualId: a.id,
    speciesId: a.speciesId,
    name: a.name,
    birth: a.birth,
    death: { ...s.date },
    age: a.ageDays,
    cause,
    ...earned,
    offspring: a.children.length,
    surviving: a.children.filter((child) => s.family[child]?.alive).length,
  });
  log(
    s,
    `${a.name}’s life ends. Cause: ${cause.toLowerCase()}. ${earned.coins} Coins earned.`,
    "death",
  );
}
export function abandonLife(state: GameState): GameState {
  const s = copy(state);
  if (current(s)?.alive) finish(s, "Life abandoned", false);
  return s;
}
function updateWorld(s: GameState) {
  const env = s.environment!;
  const sp = speciesById(current(s)!.speciesId);
  const scenario = SCENARIOS.find((x) => x.id === env.scenarioId)!;
  const tropical = ["Africa", "Central America"].some(
    (x) => env.location.continent === x || env.location.region === x,
  );
  const marine = sp.water === "marine";
  const hemisphere = env.location.region === "Southern Africa" ? -1 : 1;
  const seasonal =
    Math.sin(((s.date.day - 80) / 365) * Math.PI * 2) * hemisphere;
  const warming = Math.max(0, s.date.year - scenario.year) * 0.018;
  env.temperature =
    env.location.temperature +
    seasonal * (marine ? 3 : tropical ? 4 : 10) +
    scenario.warming +
    warming +
    (random(s) - 0.5) * 5;
  env.food = Math.max(
    0.35,
    Math.min(
      0.98,
      sp.food * scenario.food + seasonal * 0.06 + (random(s) - 0.5) * 0.1,
    ),
  );
  env.weather =
    env.temperature > sp.heat - 3
      ? "Hot"
      : env.temperature < sp.cold + 3
        ? "Cold"
        : random(s) < 0.2
          ? "Rain"
          : "Mild";
  env.pressure = Math.min(
    0.8,
    scenario.pressure + Math.max(0, s.date.year - scenario.year) * 0.002,
  );
}
function offspringDaily(s: GameState) {
  const a = current(s)!;
  const root = (animal: Individual): string =>
    animal.parentId ? root(s.family[animal.parentId]) : animal.id;
  for (const relative of Object.values(s.family)) {
    if (!relative.alive || relative.id === a.id || root(relative) !== root(a))
      continue;
    const sp = speciesById(relative.speciesId);
    relative.ageDays++;
    const independent = relative.ageDays >= sp.independence;
    const care = a.alive && a.stats.bond >= 60 && a.stats.hunger < 70;
    const risk = sp.risk * (independent ? 1 : care ? 2 : 5);
    if (random(s) < risk || relative.ageDays >= sp.maxLifespan) {
      relative.alive = false;
      relative.death = { ...s.date };
      relative.cause = "Wild mortality";
      log(s, `${relative.name}, a family member, did not survive.`, "danger");
    } else if (
      relative.parentId === a.id &&
      relative.ageDays === sp.independence
    ) {
      a.independentYoung++;
      log(s, `${relative.name} reached independence.`, "milestone");
    }
    relative.stats.hunger = 20 + random(s) * 25;
    relative.stats.health = clamp(relative.stats.health + (care ? 0.3 : -0.2));
  }
}
function birthOffspring(s: GameState) {
  const a = current(s)!,
    sp = speciesById(a.speciesId);
  if (a.pregnantUntil === undefined || a.ageDays < a.pregnantUntil) return;
  const count = a.pendingOffspring ?? sp.offspring;
  for (let i = 0; i < count; i++) {
    const child = makeIndividual(s, a.speciesId, a);
    s.family[child.id] = child;
    a.children.push(child.id);
    if (sp.independence === 0) a.independentYoung++;
  }
  a.pregnantUntil = undefined;
  a.pendingOffspring = undefined;
  log(
    s,
    `${count} offspring enter the family. Traits reflect modest inherited variation.`,
    "milestone",
  );
}
export function act(state: GameState, action: Action): GameState {
  if (!availableActions(state).includes(action))
    throw new Error("Action unavailable for this life stage or condition");
  const s = copy(state),
    a = current(s)!,
    sp = speciesById(a.speciesId),
    env = s.environment!;
  const dependent = stageOf(a).dependent,
    stats = a.stats;
  const active =
    sp.active === "night"
      ? s.phase >= 2
      : sp.active === "day"
        ? s.phase < 2
        : s.phase === 0 || s.phase === 2;
  stats.hunger += dependent ? 4 : 6;
  stats.hydration -= sp.water === "fresh" ? 5 : 1;
  stats.energy -= active ? 4 : 6;
  stats.stress += 1;
  let exposure = 0.2,
    text = "";
  switch (action) {
    case "feed": {
      const success =
        random(s) <
        Math.min(
          0.98,
          env.food +
            (dependent ? 0.05 : a.traits.perception / 800) +
            (stats.bond - 50) / 500,
        );
      exposure = dependent ? 0.04 : 1;
      stats.energy -= dependent ? 0 : 7;
      if (success) {
        stats.hunger -= dependent ? 27 : 35;
        stats.hydration += sp.water === "fresh" ? 2 : 18;
        text = dependent
          ? "The nursery provides nourishment and protection."
          : `${actionTitle(s, action)}: a successful feeding opportunity.`;
        if (sp.behavior?.colonyForaging) a.colonyService++;
      } else {
        stats.stress += 5;
        text = dependent
          ? "Provisioning is scarce. Hunger grows in the nursery."
          : "The search yields little food. Energy is spent without a meal.";
      }
      break;
    }
    case "drink":
      stats.hydration += 40;
      stats.energy -= 3;
      exposure = 0.7;
      text = "Fresh water restores hydration. The water’s edge is exposed.";
      break;
    case "rest":
      stats.energy += active ? 28 : 38;
      stats.stress -= 9;
      stats.health += stats.hunger < 60 ? 1.5 : 0;
      text = "A quiet phase restores energy. Time and hunger move on.";
      break;
    case "shelter":
      stats.energy += 12;
      stats.stress -= 12;
      stats.injury -= 2;
      exposure = 0.03;
      text = "Cover reduces exposure; injuries begin to heal.";
      break;
    case "explore":
      stats.energy -= 12;
      stats.stress += 4;
      a.explored++;
      exposure = 1.6;
      text =
        "New routes and shelter are discovered, but the journey is exposed.";
      break;
    case "socialize":
      stats.bond += 12;
      stats.stress -= 10;
      stats.energy -= 3;
      a.colonyService += sp.reproductive ? 0 : 1;
      text = sp.reproductive
        ? "Time with companions strengthens social bonds."
        : "Work supports the colony and its shared resources.";
      break;
    case "evade":
      stats.energy -= 9;
      stats.stress -= 3;
      exposure = 0.01;
      text = "You remain out of sight, giving up a feeding opportunity.";
      break;
    case "wait":
      stats.energy += 10;
      exposure = 0.02;
      text = "Development continues in shelter. Resources are still needed.";
      break;
    case "mate":
      stats.energy -= 15;
      exposure = 0.8;
      if (random(s) < 0.65) {
        a.lastReproduction = a.ageDays;
        a.pregnantUntil = a.ageDays + sp.gestation;
        a.pendingOffspring = sp.offspring;
        text = `A successful breeding encounter. A cohort may arrive in about ${sp.gestation} days.`;
      } else text = "No breeding opportunity develops this phase.";
      break;
    case "care":
      stats.energy -= 9;
      stats.hunger += 3;
      stats.bond += 10;
      text = "Food and protection are shared with dependent young.";
      break;
  }
  if (stats.hunger > 75) stats.health -= (stats.hunger - 70) / 9;
  if (stats.hydration < 25) stats.health -= (30 - stats.hydration) / 6;
  if (stats.energy < 15) {
    stats.health -= 2;
    stats.stress += 6;
  }
  stats.health -= stats.injury / 60;
  const thermal = Math.max(
    0,
    sp.cold - env.temperature,
    env.temperature - sp.heat,
  );
  stats.health -= thermal * (action === "shelter" || dependent ? 0.1 : 0.5);
  if (stats.hunger < 55 && stats.hydration > 35 && stats.energy > 35)
    stats.health += 0.5;
  const risk =
    (sp.risk *
      exposure *
      (dependent ? 1.7 : 1) *
      (1 + env.pressure + stats.stress / 100 + stats.injury / 80)) /
    4;
  let emergency = false;
  if (random(s) < risk) {
    const predator = pick(s, sp.predators);
    if (random(s) > 0.3 + a.traits.resilience / 200) {
      log(s, `${predator} encounter proves fatal.`, "danger");
      finish(s, `Predation / conflict: ${predator}`);
      return s;
    }
    stats.injury += 30;
    stats.health -= 18;
    stats.stress += 30;
    emergency = true;
    log(
      s,
      `A ${predator.toLowerCase()} encounter leaves a lasting injury.`,
      "danger",
    );
  }
  if (random(s) < sp.risk / 12) {
    stats.health -= 12;
    stats.stress += 10;
    emergency = true;
    log(
      s,
      "Illness weakens your condition. Rest and feeding now matter more.",
      "danger",
    );
  }
  for (const key of Object.keys(stats) as (keyof typeof stats)[])
    stats[key] = clamp(stats[key]);
  if (s.journal.at(-1)?.text !== text)
    log(s, text, emergency ? "danger" : "routine");
  if (stats.health <= 0) {
    finish(
      s,
      stats.hunger > 80
        ? "Starvation"
        : stats.hydration < 15
          ? "Dehydration"
          : thermal > 0
            ? "Exposure"
            : stats.injury > 40
              ? "Injury"
              : "Declining condition",
    );
    return s;
  }
  s.phase++;
  if (s.phase === 4) {
    const oldStage = stageOf(a).name;
    s.phase = 0;
    s.date = nextDate(s.date);
    a.ageDays++;
    stats.bond = clamp(stats.bond - 0.5);
    updateWorld(s);
    offspringDaily(s);
    birthOffspring(s);
    if (stageOf(a).name !== oldStage)
      log(
        s,
        `A new life stage: ${stageOf(a).name.toLowerCase()}. New behaviors may be available.`,
        "milestone",
      );
    if (
      a.ageDays >= sp.maxLifespan ||
      (a.ageDays > sp.lifespan &&
        random(s) <
          Math.min(0.15, ((a.ageDays - sp.lifespan) / sp.lifespan) * 0.02))
    )
      finish(s, "Age-related decline");
    if (
      sp.behavior?.terminalBreeding &&
      a.lastReproduction !== undefined &&
      a.ageDays > a.lastReproduction + sp.gestation + 7
    )
      finish(s, "Postbreeding senescence");
  }
  return s;
}
export function routineAction(
  s: GameState,
  priority: Priority = s.priority,
): Action {
  const a = current(s)!,
    sp = speciesById(a.speciesId),
    actions = availableActions(s),
    stats = a.stats;
  if (stats.hydration < 40 && actions.includes("drink")) return "drink";
  if (stats.hunger > 35 || (sp.water !== "fresh" && stats.hydration < 55))
    return "feed";
  if (stats.energy < 45) return "rest";
  if (stats.injury > 15 || stats.health < 45) return "shelter";
  if (priority === "reproduction" && actions.includes("mate")) return "mate";
  if (actions.includes("care") && stats.bond < 80) return "care";
  if (
    actions.includes("socialize") &&
    stats.bond < (priority === "reproduction" ? 80 : 65)
  )
    return "socialize";
  if (
    priority === "exploration" &&
    actions.includes("explore") &&
    stats.energy > 65
  )
    return "explore";
  if (priority === "feeding" && stats.hunger > 20) return "feed";
  return "rest";
}
export function skipOptions(s: GameState): number[] {
  const a = current(s);
  if (!a?.alive) return [];
  const sp = speciesById(a.speciesId);
  return [
    1,
    7,
    ...(sp.maxLifespan >= 365 ? [30] : []),
    ...(sp.lifespan >= 1095 && !stageOf(a).dependent ? [365] : []),
  ];
}
export function advanceDays(
  state: GameState,
  days: number,
): { state: GameState; phases: number; interrupted: boolean } {
  if (!Number.isInteger(days) || days < 1 || days > 365)
    throw new Error("Skip must be 1–365 days");
  let s = state;
  let phases = 0;
  let interrupted = false;
  const limit = days * 4 - s.phase;
  while (phases < limit && current(s)?.alive) {
    const before = current(s)!.stats.health;
    s = act(s, routineAction(s));
    phases++;
    if (
      !current(s)!.alive ||
      before - current(s)!.stats.health > 12 ||
      current(s)!.stats.health < 25
    ) {
      interrupted = true;
      break;
    }
  }
  return { state: s, phases, interrupted };
}
export function continueBloodline(
  state: GameState,
  childId: string,
): GameState {
  const parent = current(state),
    child = state.family[childId];
  if (
    !parent ||
    parent.alive ||
    !parent.children.includes(childId) ||
    !child?.alive
  )
    throw new Error("No eligible surviving offspring");
  const s = copy(state);
  s.currentId = childId;
  log(
    s,
    `You continue as ${child.name}, generation ${child.generation}, at their actual age of ${child.ageDays} days. The world has not reset.`,
    "milestone",
  );
  return s;
}
export function openPack(state: GameState): GameState {
  if (state.coins < PACK.cost) throw new Error("Not enough Coins");
  const s = copy(state);
  s.coins -= PACK.cost;
  const roll = random(s) * 100;
  let sum = 0;
  const card = PACK.drops.find((drop) => (sum += drop.weight) > roll)!;
  const duplicate = s.unlocked.includes(card.id);
  if (!duplicate) s.unlocked.push(card.id);
  else s.coins += PACK.duplicateRefund;
  s.lastPack = {
    speciesId: card.id,
    duplicate,
    refund: duplicate ? PACK.duplicateRefund : 0,
  };
  return s;
}
export const unlockedSpecies = (s: GameState) =>
  SPECIES.filter((sp) => s.unlocked.includes(sp.id));
