import { nextMoment } from "./development";
import { snapshot, recordOutcome, urgentNeed, familyLoss } from "./outcomes";
import { SPECIES, STARTERS, speciesById } from "../data/species";
import { generateBirthContext } from "./history";
import {
  createWorld,
  tickWorld,
  applyWorldAction,
  ensureIndividualExperience,
  refreshResources,
} from "./world";
import { nextDate } from "./calendar";
import { pick, random, seedFromText } from "./random";
import {
  initialBiology,
  phaseTemperature,
  filterSpeciesActions,
  speciesFoodFactor,
  speciesRiskFactor,
  speciesThermalFactor,
  tickBiology,
  syncDevelopment,
  reproductionPossible,
  preferredFeedingNode,
  speciesAchievements,
  type BiologyActivityId,
} from "./biology";
import {
  ensureArea,
  locationNow,
  nearby,
  tickAnimals,
  careFactor,
  interactions,
  applyInteraction,
  travelEligibility,
  encounterResponses,
  type InteractionId,
  type ResponseId,
} from "./wildlife";
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
  move: {
    title: "Change local patch",
    detail:
      "Leave depleted ground for another local patch. Movement costs energy and exposure.",
    icon: "↗",
  },
  learn: {
    title: "Observe your caregivers",
    detail: "Limited, age-appropriate learning while routine care continues.",
    icon: "◷",
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
  a.ageDays > speciesById(a.speciesId).lifespan * 1.2
    ? {
        name: "Older adult",
        fromDay: Math.floor(speciesById(a.speciesId).lifespan * 1.2),
        dependent: false,
      }
    : [...speciesById(a.speciesId).stages]
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
export function createGame(seed = "lottery-of-life"): GameState {
  return {
    version: 3,
    pacing: "balanced",
    narration: "simple",
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
  const tendency = (
    key: "caution" | "curiosity" | "learning" | "stressResponse",
  ) =>
    parent?.personality
      ? clamp(parent.personality[key] + (random(s) - 0.5) * 20)
      : 25 + random(s) * 50;
  const individual: Individual = {
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
    personality: {
      caution: tendency("caution"),
      curiosity: tendency("curiosity"),
      learning: tendency("learning"),
      stressResponse: tendency("stressResponse"),
    },
    experience: { foraging: 0, habitatKnowledge: 0, dangerMemory: 0 },
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
  individual.biology = initialBiology(individual);
  return individual;
}
export function startLife(
  state: GameState,
  options: { speciesId?: string; year?: number; seed: string },
): GameState {
  if (current(state)?.alive)
    throw new Error(
      "Finish or abandon the active life before starting another.",
    );
  const s = copy(state);
  s.rng = seedFromText(options.seed);
  const speciesId = options.speciesId ?? pick(s, s.unlocked);
  if (!s.unlocked.includes(speciesId))
    throw new Error("That species is locked");
  const sp = speciesById(speciesId);
  const generated = generateBirthContext(s, sp, options.year);
  s.date = generated.date;
  s.phase = 0;
  s.environment = generated.environment;
  const animal = makeIndividual(s, speciesId);
  animal.circumstances = generated.circumstances;
  animal.stats.bond = 40 + s.environment.careQuality! * 35;
  {
    animal.stats.health = 80 + random(s) * 18;
    animal.stats.hunger = 12 + random(s) * 22;
    animal.stats.energy = 70 + random(s) * 25;
    animal.stats.stress = 8 + random(s) * 18 + s.environment.pressure * 10;
  }
  s.family[animal.id] = animal;
  s.currentId = animal.id;
  s.world = createWorld(s);
  s.area = undefined;
  ensureArea(s);
  animal.biology!.skills["visit:home"] = 1;
  refreshResources(s);
  log(
    s,
    `${animal.name} begins life as a ${sp.name.toLowerCase()} in ${s.environment.location.place}. ${animal.caste ? "A female worker, part of a larger colony." : sp.social}`,
    "birth",
  );
  log(
    s,
    `${s.environment.history!.epoch}. ${animal.circumstances} ${s.environment.history!.description}`,
    "birth",
  );
  return s;
}
export function availableActions(s: GameState): Action[] {
  const a = current(s);
  if (!a?.alive) return [];
  const sp = speciesById(a.speciesId);
  if (stageOf(a).dependent) {
    const actions: Action[] = ["feed", "rest", "shelter", "wait"];
    if (!["Egg", "Pupa"].includes(stageOf(a).name) && a.ageDays > 5)
      actions.push("learn");
    return filterSpeciesActions(s, actions);
  }
  const actions: Action[] = [
    "feed",
    ...(sp.water === "fresh" ? ["drink" as const] : []),
    "rest",
    "shelter",
    "explore",
    "evade",
  ];
  if (
    s.world &&
    a.stats.energy > 25 &&
    a.stats.injury < 55 &&
    (!s.area || s.area.nodes.some((n) => travelEligibility(s, n.id).allowed))
  )
    actions.push("move");
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
    a.stats.bond >= (sp.behavior?.minBreedingBond ?? 0) &&
    reproductionPossible(s)
  )
    actions.push("mate");
  if (
    a.children.some(
      (child) =>
        s.family[child]?.alive && s.family[child].ageDays < sp.independence,
    )
  )
    actions.push("care");
  return filterSpeciesActions(s, actions);
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
  const speciesSuccess = speciesAchievements(a);
  achievements.push(...speciesSuccess);
  score += speciesSuccess.length * 12;
  // Lifetime-only settlement, with a juvenile threshold, prevents birth/abandon farming.
  const coins =
    a.ageDays < Math.min(7, sp.adultDay) ? 0 : Math.floor(score * 1.5);
  return { score, coins, achievements };
}
function finish(s: GameState, cause: string, reward = true) {
  const a = current(s)!;
  if (!a.alive) return;
  for (const key of Object.keys(a.stats) as (keyof typeof a.stats)[])
    a.stats[key] = clamp(a.stats[key]);
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
  s.world ??= createWorld(s);
  for (const message of tickWorld(s)) log(s, message, "milestone");
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
    const risk =
      sp.risk *
      (independent ? 1 : care ? 2 : 5) *
      (s.world
        ? (0.5 + s.world.predators) * (1 + Math.max(0, 0.4 - s.world.water))
        : 1);
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
  let count = a.pendingOffspring ?? sp.offspring;
  if (a.speciesId === "octopus" && a.sex === "Female")
    count = Math.floor(count * (0.5 + (a.biology?.stores.brood ?? 0) / 200));
  if (a.speciesId === "mallard")
    count = Math.floor(count * (0.6 + (a.biology?.stores.nest ?? 35) / 250));
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
  const before = snapshot(state);
  const next = resolvePhase(copy(state), action);
  return recordOutcome(
    next,
    before,
    actionTitle(state, action),
    next.journal.at(-1)?.text ?? "A phase passes.",
    1,
  );
}
function resolvePhase(
  state: GameState,
  action: Action,
  journey?: { destination: string; cost: number; exposure: number },
  activity?: BiologyActivityId,
): GameState {
  ensureArea(state);
  if (action === "move" && !journey) {
    const preferred = preferredFeedingNode(state);
    const route = state
      .area!.nodes.filter(
        (n) => n.distance <= 2 && travelEligibility(state, n.id).allowed,
      )
      .sort(
        (x, y) =>
          (y.id === preferred ? 10 : 0) -
          (x.id === preferred ? 10 : 0) +
          state.world!.patches.find((p) => p.id === y.id)!.food -
          state.world!.patches.find((p) => p.id === x.id)!.food,
      )[0];
    if (!route) throw new Error("No accessible local route.");
    journey = {
      destination: route.id,
      cost: travelEligibility(state, route.id).energy,
      exposure: route.exposure + 0.4,
    };
  }
  if (
    !availableActions(state).includes(action) &&
    !(journey && current(state)?.alive && action === "move") &&
    // Contextual activity eligibility was reserved before its upfront resource costs.
    !(activity && current(state)?.alive)
  )
    throw new Error("Action unavailable for this life stage or condition");
  state.area!.feedback = undefined;
  state.area!.outcome = undefined;
  const s = state,
    a = current(s)!,
    sp = speciesById(a.speciesId),
    env = s.environment!;
  ensureArea(s);
  ensureIndividualExperience(a);
  const dependent = stageOf(a).dependent,
    parentProvided = dependent && /mammal|bird/i.test(sp.group),
    stats = a.stats;
  const caregiver = parentProvided
    ? nearby(s).find((n) => n.role === "mother")
    : undefined;
  const chargeCare = (hunger: number, energy: number) => {
    if (!caregiver) return;
    caregiver.hunger = clamp(caregiver.hunger + hunger);
    caregiver.energy = clamp(caregiver.energy - energy);
    caregiver.bond = clamp(caregiver.bond + 1);
  };
  const active =
    sp.active === "night"
      ? s.phase >= 2
      : sp.active === "day"
        ? s.phase < 2
        : s.phase === 0 || s.phase === 2;
  stats.hunger += dependent ? 4 : 6;
  stats.hydration -=
    sp.water === "fresh" ? 4 + Math.max(0, env.temperature - 25) / 5 : 1;
  stats.energy -= (active ? 4 : 6) * (a.ageDays > sp.lifespan ? 1.2 : 1);
  stats.stress += 0.5 + (a.personality?.stressResponse ?? 50) / 100;
  let exposure = 0.2,
    text = "";
  switch (action) {
    case "move":
      stats.energy -= journey?.cost ?? 12;
      stats.stress += 3;
      exposure = journey?.exposure ?? 1.2;
      text = "You leave the depleted patch and settle on better local ground.";
      break;
    case "learn":
      stats.energy -= 2;
      stats.stress -= 3;
      text =
        "Sensory experience accumulates around your caregivers; independence still lies ahead.";
      break;
    case "feed": {
      // Parent condition represents nutrition already obtained by that animal.
      // Milk/delivered food is not grazing directly from the infant's nest patch.
      const resource = parentProvided
        ? (env.careQuality ?? 0.85) * careFactor(s)
        : env.food * (dependent ? careFactor(s) : speciesFoodFactor(s));
      const success =
        random(s) <
        Math.min(
          0.98,
          resource <= 0.01
            ? 0
            : resource +
                (a.speciesId === "wolf" && !dependent
                  ? Math.min(
                      0.1,
                      nearby(s).filter(
                        (n) =>
                          n.species === sp.name &&
                          ["companion", "mother"].includes(n.role) &&
                          n.bond > 40,
                      ).length * 0.04,
                    )
                  : 0) +
                (dependent
                  ? 0.05
                  : a.traits.perception / 800 +
                    (a.experience?.foraging ?? 0) / 1200) +
                (stats.bond - 50) / 500,
        );
      // A failed request costs a little time/energy, not a meal that never existed.
      if (parentProvided) chargeCare(success ? 9 : 0, success ? 7 : 1);
      exposure = dependent ? 0.04 : 1;
      stats.energy -= dependent ? 0 : 7;
      if (success) {
        stats.hunger -= dependent ? 27 : 35;
        stats.hydration += dependent ? 26 : sp.water === "fresh" ? 2 : 18;
        text = dependent
          ? "The nursery provides nourishment and protection."
          : `${actionTitle(s, action)}: a successful feeding opportunity.`;
        if (!dependent && sp.behavior?.colonyForaging) a.colonyService++;
      } else {
        stats.stress += 5;
        text = dependent
          ? "Provisioning is scarce. Hunger grows in the nursery."
          : "The search yields little food. Energy is spent without a meal.";
      }
      break;
    }
    case "drink":
      stats.hydration +=
        40 *
        (s.world
          ? Math.max(
              0,
              s.world.water *
                s.world.patches.find((p) => p.id === s.world!.activePatch)!
                  .water,
            )
          : 1);
      stats.energy -= 3;
      exposure = 0.7;
      text =
        s.world && s.world.water < 0.3
          ? "Water is scarce; the exposed search yields little hydration."
          : "Fresh water restores hydration. The water’s edge is exposed.";
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
        text = `A successful breeding encounter. ${["bullfrog", "octopus", "mallard", "robin"].includes(a.speciesId) ? "Eggs may hatch" : "Young may be born"} in about ${sp.gestation} days${a.sex === "Male" ? "; this records your partner’s developing cohort" : ""}.`;
      } else text = "No breeding opportunity develops this phase.";
      break;
    case "care":
      stats.energy -= 9;
      stats.hunger += 3;
      stats.bond += 10;
      text = "Food and protection are shared with dependent young.";
      break;
  }
  if (dependent && ["wait", "rest", "learn"].includes(action)) {
    const care =
      (env.careQuality ?? 0.85) *
      careFactor(s) *
      (parentProvided ? 0.35 : env.food);
    if (random(s) < care) {
      stats.hunger -= 10;
      stats.hydration += 5;
      if (parentProvided) {
        chargeCare(4, 3);
        text +=
          " Your caregiver also provides some nourishment, using food reserves and energy.";
      }
    }
  }
  if (journey) {
    const skills = a.biology!.skills;
    if (!Object.keys(skills).some((k) => k.startsWith("visit:")))
      skills["map:legacy"] = 1;
    s.world!.activePatch = journey.destination;
    if (!skills[`visit:${journey.destination}`]) {
      skills[`visit:${journey.destination}`] = 1;
      a.experience!.habitatKnowledge = clamp(
        a.experience!.habitatKnowledge + 1,
      );
    }
  }
  applyWorldAction(s, action, !!journey, parentProvided);
  for (const message of tickAnimals(s)) log(s, message, "milestone");
  if (stats.hunger > 75) stats.health -= (stats.hunger - 70) / 9;
  if (stats.hydration < 25) stats.health -= (30 - stats.hydration) / 6;
  if (stats.energy < 15) {
    stats.health -= 2;
    stats.stress += 6;
  }
  stats.health -= stats.injury / 60;
  const localTemperature = phaseTemperature(s);
  const thermal = Math.max(
    0,
    sp.cold - localTemperature,
    localTemperature - sp.heat,
  );
  stats.health -=
    thermal *
    (action === "shelter" || dependent ? 0.1 : 0.5) *
    speciesThermalFactor(s);
  if (stats.hunger < 55 && stats.hydration > 35 && stats.energy > 35)
    stats.health += 0.5;
  const risk =
    (sp.risk *
      speciesRiskFactor(s) *
      (1 + nearby(s).filter((n) => n.role === "predator").length * 0.4) *
      (s.world ? 0.5 + s.world.predators * 2 : 1) *
      (1 - (a.personality?.caution ?? 50) / 400) *
      (dependent
        ? Math.max(exposure, 0.2 + Math.max(0, 0.7 - env.food) * 0.8)
        : exposure * (0.4 + locationNow(s).exposure)) *
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
    a.experience!.dangerMemory = Math.min(100, a.experience!.dangerMemory + 20);
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
  for (const message of tickBiology(s, action, activity))
    log(s, message, "milestone");
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
              : a.speciesId === "bullfrog" &&
                  a.ageDays < 365 &&
                  s.world!.water < 0.2
                ? "Pond drying"
                : a.speciesId === "ant" && a.biology!.stores.fungus < 15
                  ? "Fungal garden failure"
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
    for (const message of syncDevelopment(s)) log(s, message, "milestone");
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
      a.ageDays >
        a.lastReproduction + sp.gestation + (a.sex === "Female" ? 7 : 75)
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
  const world = s.world;
  if (stageOf(a).dependent && stats.hydration < 55 && actions.includes("feed"))
    return "feed";
  if (stats.hydration < 35 && actions.includes("drink")) return "drink";
  if (stats.energy < 30) return "rest";
  const biology = a.biology!;
  if (a.speciesId === "ant" && !stageOf(a).dependent) {
    if (
      world?.activePatch === "forage" &&
      biology.stores.leafLoad > 5 &&
      actions.includes("move")
    )
      return "move";
    if (
      world?.activePatch === "forage" &&
      biology.stores.substrate < 30 &&
      actions.includes("feed")
    )
      return "feed";
    if (
      biology.stores.substrate < 5 &&
      world?.activePatch !== "forage" &&
      actions.includes("move")
    )
      return "move";
    if (
      biology.stores.fungus < 45 &&
      biology.stores.substrate > 0 &&
      ["home", "shade"].includes(world!.activePatch) &&
      actions.includes("socialize")
    )
      return "socialize";
  }
  if (a.speciesId === "bumblebee" && !stageOf(a).dependent) {
    if (
      biology.stores.pollen >= 10 &&
      ["home", "shade"].includes(world!.activePatch) &&
      actions.includes("socialize")
    )
      return "socialize";
    if (
      biology.stores.pollen > 25 &&
      !["home", "shade"].includes(world!.activePatch) &&
      actions.includes("move")
    )
      return "move";
  }
  if (
    !actions.includes("feed") &&
    stats.hunger > 35 &&
    actions.includes("move")
  )
    return "move";
  if (
    world &&
    world.predators > 0.6 &&
    (a.personality?.caution ?? 50) > 65 &&
    stats.hunger < 35 &&
    stats.energy > 40
  )
    return "shelter";
  if (
    world &&
    actions.includes("move") &&
    stats.energy > 35 &&
    world.patches.find((p) => p.id === world.activePatch)!.food < 0.45
  )
    return "move";
  if (
    (a.experience?.dangerMemory ?? 0) > 15 &&
    stats.energy > 50 &&
    stats.hunger < 35 &&
    actions.includes("shelter")
  )
    return "shelter";
  if (stats.hydration < 40 && actions.includes("drink")) return "drink";
  if (stats.hunger > 35 || (sp.water !== "fresh" && stats.hydration < 55))
    if (actions.includes("feed")) return "feed";
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
  if (priority === "feeding" && stats.hunger > 20 && actions.includes("feed"))
    return "feed";
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
  if (!current(state)?.alive)
    return { state: copy(state), phases: 0, interrupted: false };
  const beforeState = snapshot(state);
  let s = copy(state);
  let phases = 0;
  let interrupted = false;
  const limit = days * 4 - s.phase;
  while (phases < limit && current(s)?.alive) {
    const before = current(s)!.stats.health;
    s = resolvePhase(s, routineAction(s));
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
  recordOutcome(
    s,
    beforeState,
    "Time advance",
    s.journal.at(-1)?.text ?? "Life continues.",
    phases,
  );
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
  if (s.area) {
    s.area.ownerId = childId;
    s.area.animals = s.area.animals.filter((n) => n.familyId !== childId);
    s.area.animals.forEach((n) => {
      if (n.role === "mother") n.role = "companion";
    });
  }
  ensureArea(s);
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

export function advancePaced(state: GameState): {
  state: GameState;
  phases: number;
  interrupted: boolean;
} {
  if (!current(state)?.alive)
    return { state: copy(state), phases: 0, interrupted: false };
  if (
    state.area?.encounter?.status === "active" &&
    ["predator", "rival", "prey", "mate"].includes(state.area.encounter.kind)
  )
    return { state: copy(state), phases: 0, interrupted: true };
  if (state.pacing === "immersive") {
    const next = act(state, routineAction(state));
    return { state: next, phases: 1, interrupted: !current(next)?.alive };
  }
  const dependent = current(state) ? stageOf(current(state)!).dependent : false;
  const budget =
    state.pacing === "balanced" ? (dependent ? 16 : 4) : dependent ? 120 : 28;
  const beforeState = snapshot(state);
  let s = copy(state),
    phases = 0,
    interrupted = false;
  const initialStage = current(s) ? stageOf(current(s)!).name : "";
  const initialSituations = s.world?.situations
    .filter((x) => x.status === "active")
    .map((x) => x.id)
    .join(",");
  while (phases < budget && current(s)?.alive) {
    const health = current(s)!.stats.health;
    s = resolvePhase(s, routineAction(s));
    phases++;
    const changed =
      stageOf(current(s)!).name !== initialStage ||
      s.world?.situations
        .filter((x) => x.status === "active")
        .map((x) => x.id)
        .join(",") !== initialSituations;
    if (
      !current(s)!.alive ||
      (s.area?.encounter?.status === "active" &&
        ["predator", "rival", "prey", "mate"].includes(
          s.area.encounter.kind,
        )) ||
      !!urgentNeed(s) ||
      familyLoss(s, beforeState) ||
      current(s)!.stats.health < 30 ||
      health - current(s)!.stats.health > 12 ||
      changed
    ) {
      interrupted = true;
      break;
    }
  }
  recordOutcome(
    s,
    beforeState,
    "Life unfolds",
    s.area?.feedback ?? s.journal.at(-1)?.text ?? "Life continues.",
    phases,
  );
  return { state: s, phases, interrupted };
}

/** Observe a routine developmental interval; every phase still resolves needs and mortality. */
export function advanceToOpportunity(state: GameState): {
  state: GameState;
  phases: number;
  interrupted: boolean;
} {
  if (!current(state)?.alive)
    return { state: copy(state), phases: 0, interrupted: false };
  const a = current(state)!,
    next = nextMoment(state);
  if (!next) return advancePaced(state);
  if (
    state.area?.encounter?.status === "active" &&
    state.area.encounter.kind !== "companion"
  )
    return { state: copy(state), phases: 0, interrupted: true };
  const before = snapshot(state);
  let s = copy(state),
    phases = 0,
    previousNeed = urgentNeed(s);
  const target = Math.min(1460, (next[0] - a.ageDays) * 4 - state.phase);
  while (phases < target && current(s)!.alive) {
    const health = current(s)!.stats.health;
    s = resolvePhase(s, routineAction(s));
    phases++;
    const need = urgentNeed(s);
    const encounter = s.area?.encounter;
    if (
      !current(s)!.alive ||
      (need && need !== previousNeed) ||
      familyLoss(s, before) ||
      health - current(s)!.stats.health > 12 ||
      (encounter?.status === "active" && encounter.kind !== "companion")
    )
      break;
    previousNeed = need;
  }
  const reached = current(s)!.ageDays >= next[0];
  const summary = reached
    ? `${next[1]}. New choices may now be available. ${s.journal.at(-1)?.text ?? ""}`
    : (urgentNeed(s) ?? s.journal.at(-1)?.text ?? "Routine care continues.");
  recordOutcome(s, before, "Next important moment", summary, phases);
  return { state: s, phases, interrupted: phases < target };
}

/** Contextual commands all pass through the existing phase/mortality resolver. */
export function interact(
  state: GameState,
  interactionId: InteractionId,
): GameState {
  const beforeState = snapshot(state);
  const s = copy(state);
  ensureArea(s);
  const option = interactions(s, availableActions(s)).find(
    (x) => x.id === interactionId,
  );
  if (!option) throw new Error("That interaction is no longer possible here.");
  if (option.id === "follow-group") return travel(s, option.target!);
  const text = applyInteraction(s, option);
  const beforeSerial = s.serial;
  const next = resolvePhase(
    s,
    option.action,
    undefined,
    option.id.startsWith("biology:")
      ? (option.id.slice(8) as BiologyActivityId)
      : undefined,
  );
  if (current(next)?.alive && text) {
    const result =
      option.action === "feed"
        ? next.journal.findLast(
            (j) =>
              j.id > beforeSerial &&
              /successful feeding|search yields|nursery provides|Provisioning is scarce/.test(
                j.text,
              ),
          )?.text
        : undefined;
    const feedback = result
      ? option.id === "cut-leaves" || option.id.startsWith("biology:")
        ? `${text} ${result}`
        : `${result} ${text}`
      : text;
    next.area!.feedback = feedback;
    log(next, feedback);
  } else next.area!.feedback = next.journal.at(-1)?.text;
  return recordOutcome(
    next,
    beforeState,
    option.title,
    next.area!.feedback ?? "A phase passes.",
    1,
  );
}
export function travel(state: GameState, destination: string): GameState {
  const beforeState = snapshot(state);
  let s = copy(state);
  ensureArea(s);
  const route = travelEligibility(s, destination);
  if (!route.allowed) throw new Error(route.reason);
  const node = s.area!.nodes.find((n) => n.id === destination)!;
  const escorts = route.escorted
    ? s.area!.animals.filter(
        (n) =>
          n.alive &&
          ["mother", "companion"].includes(n.role) &&
          n.location === s.world!.activePatch,
      )
    : [];
  for (let step = 0; step < route.phases && current(s)?.alive; step++) {
    const target =
      step === route.phases - 1 ? destination : s.world!.activePatch;
    s = resolvePhase(s, "move", {
      destination: target,
      cost: route.energy / route.phases,
      exposure: route.escorted ? node.exposure * 0.6 : node.exposure + 0.4,
    });
    // Resolve each leg: death can stop a journey before arrival.
  }
  if (current(s)?.alive) {
    for (const escort of escorts) {
      const live = s.area!.animals.find((n) => n.id === escort.id)!;
      if (live.alive) {
        live.location = destination;
        live.energy = clamp(live.energy - route.energy * 0.5);
      }
    }
    const text = `${route.escorted ? "With your caregiver, you reach" : "You reach"} ${node.label.toLowerCase()} after ${route.phases} phase${route.phases === 1 ? "" : "s"}. Travel used ${route.energy} energy plus ordinary metabolism. Food, cover and water now depend on this location.`;
    const unloaded =
      beforeState.stores.leafLoad >
        (current(s)!.biology!.stores.leafLoad ?? 0) &&
      ["home", "shade"].includes(destination);
    const result = unloaded
      ? `You deliver leaf material to the colony. ${text}`
      : text;
    s.area!.feedback = result;
    log(s, result);
  }
  return recordOutcome(
    s,
    beforeState,
    "Travel",
    s.area!.feedback ?? "The journey ends.",
    route.phases,
  );
}
export function respondToEncounter(
  state: GameState,
  response: ResponseId,
): GameState {
  const beforeState = snapshot(state);
  const s = copy(state);
  ensureArea(s);
  const e = s.area!.encounter,
    option = encounterResponses(s).find((x) => x.id === response);
  if (!e || !option) throw new Error("That encounter response is unavailable.");
  const other = s.area!.animals.find((n) => n.id === e.animalId)!;
  if (!other.alive || other.location !== s.world!.activePatch)
    throw new Error("The other animal has moved on.");
  let text =
    "You keep your distance and learn from the encounter. A feeding opportunity passes.";
  if (response === "challenge") {
    const damage = 10 + random(s) * 30;
    current(s)!.stats.injury += damage;
    current(s)!.stats.health -= damage * 0.7;
    current(s)!.stats.energy -= 8;
    other.injury = clamp(other.injury + 15);
    other.bond = 0;
    text =
      "Standing your ground leads to conflict. Injury persists after the rival withdraws.";
  }
  if (response === "retreat") {
    current(s)!.stats.energy -= 4;
    text =
      "You withdraw into cover, spending energy and giving up this opportunity.";
  }
  if (response === "approach") {
    other.bond = clamp(other.bond + 10);
    text = `A quiet approach builds trust with ${other.name}.`;
  }
  const beforeSerial = s.serial;
  const next = resolvePhase(s, option.action);
  if (response === "court") {
    other.bond = clamp(other.bond + 5);
    text =
      next.journal.findLast(
        (j) => j.id > beforeSerial && j.text.includes("breeding"),
      )?.text ?? "The encounter ends without breeding.";
  }
  if (response === "hunt") {
    const ate = next.journal.some(
      (j) => j.id > beforeSerial && j.text.includes("successful feeding"),
    );
    if (ate) {
      other.alive = false;
      other.health = 0;
      text =
        "The hunt succeeds. This individual prey dies; the meal and local depletion persist.";
    } else {
      text =
        "The prey escapes. The failed hunt costs energy and the animal remains nearby.";
      other.energy = clamp(other.energy - 20);
    }
  }
  // Re-find entities in returned state: never mutate references to a previous snapshot.
  if (response === "hunt")
    Object.assign(next.area!.animals.find((n) => n.id === other.id)!, other);
  next.area!.encounter = {
    ...e,
    status: "resolved",
    outcome: text,
    cooldownUntil: next.area!.ticks + 8,
  };
  next.area!.feedback = text;
  if (current(next)?.alive)
    log(next, text, response === "challenge" ? "danger" : "routine");
  return recordOutcome(next, beforeState, option.title, text, 1);
}
export function meetAnimal(state: GameState, animalId: string): GameState {
  const s = copy(state);
  ensureArea(s);
  const n = s.area!.animals.find((x) => x.id === animalId);
  if (!current(s)?.alive || !n?.alive || n.location !== s.world!.activePatch)
    throw new Error("That animal is not nearby.");
  if (
    s.area!.encounter?.status === "active" &&
    ["predator", "rival"].includes(s.area!.encounter.kind)
  )
    throw new Error("Respond to the current encounter first.");
  s.area!.encounter = {
    id: `meet:${n.id}:${s.area!.ticks}`,
    animalId: n.id,
    kind: ["mother", "offspring"].includes(n.role)
      ? "companion"
      : (n.role as "companion" | "mate" | "prey" | "predator" | "rival"),
    location: n.location,
    beganDay: s.area!.ticks,
    cooldownUntil: s.area!.ticks + 8,
    status: "active",
  };
  return s;
}
