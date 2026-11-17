import { daysInYear } from "./calendar";
import { contextAt } from "./history";
import { random, seedFromText } from "./random";
import { speciesById } from "../data/species";
import type {
  Action,
  GameState,
  Individual,
  LocalWorld,
  Situation,
} from "./types";
const unit = (n: number) => Math.max(0, Math.min(1, n));
const animal = (s: GameState) => s.family[s.currentId!];
export function createWorld(s: GameState): LocalWorld {
  const env = s.environment!;
  const seasonal =
    Math.sin(((s.date.day - 80) / daysInYear(s.date.year)) * Math.PI * 2) *
    (env.location.hemisphere === "south" ? -1 : 1);
  return {
    model: 1,
    rng: seedFromText(
      `${s.rng}:${s.date.year}:${s.date.day}:${env.location.region}`,
    ),
    elapsedDays: 0,
    precipitation: 2,
    daylight: 12 + seasonal * (env.location.climate === "tropical" ? 0.5 : 4),
    season:
      Math.abs(seasonal) < 0.25
        ? "Seasonal transition"
        : seasonal > 0
          ? "Warm season"
          : "Cool season",
    moisture: 0.65,
    water: 0.7,
    vegetation: env.food,
    prey: 0.7,
    predators: 0.35,
    competition: 0.25,
    habitat: 1 - env.pressure * 0.3,
    activePatch: "home",
    patches: [
      {
        id: "home",
        label: "Nursery & shelter",
        food: 0.8,
        cover: 0.88,
        water: 0.65,
      },
      {
        id: "forage",
        label: "Foraging area",
        food: 1,
        cover: 0.35,
        water: 0.45,
      },
      {
        id: "water",
        label: "Resource margin",
        food: 0.8,
        cover: 0.25,
        water: 0.95,
      },
    ],
    situations: [],
  };
}
export function refreshResources(s: GameState): void {
  if (!s.world || !s.environment) return;
  const w = s.world,
    env = s.environment,
    sp = speciesById(animal(s).speciesId);
  const patch = w.patches.find((p) => p.id === w.activePatch)!;
  const resource =
    sp.history.trophic === "plant" || sp.history.trophic === "fungus"
      ? w.vegetation
      : sp.history.trophic === "predator" || sp.history.trophic === "plankton"
        ? w.prey
        : (w.vegetation + w.prey) / 2;
  env.food = unit(
    (sp.food *
      (0.7 + w.habitat * 0.3) *
      (env.history?.richness ?? 1) *
      (0.3 + resource * 0.7) *
      patch.food) /
      (1 + w.competition * 0.25),
  );
}
export function tickWorld(s: GameState): string[] {
  const env = s.environment!,
    w = s.world!,
    a = animal(s),
    sp = speciesById(a.speciesId);
  w.elapsedDays++;
  if (a.experience) a.experience.dangerMemory *= 0.995;
  const history = contextAt(s.date.year);
  if (env.scenarioId === "continuous") {
    env.history = history;
    env.pressure = history.pressure;
  }
  const south =
    env.location.hemisphere === "south" ||
    env.location.region === "Southern Africa";
  const tropical = env.location.climate === "tropical";
  const marine = env.location.climate === "marine" || sp.water === "marine";
  const seasonal =
    Math.sin(((s.date.day - 80) / daysInYear(s.date.year)) * Math.PI * 2) *
    (south ? -1 : 1);
  w.season =
    Math.abs(seasonal) < 0.25
      ? "Seasonal transition"
      : seasonal > 0
        ? "Warm season"
        : "Cool season";
  w.daylight = tropical
    ? 12 + seasonal * 0.5
    : 12 + seasonal * (marine ? 3 : 4);
  const target =
    env.location.temperature +
    seasonal * (tropical ? 3 : marine ? 3 : 9) +
    history.climateOffset * (tropical ? 0.4 : 1);
  env.temperature =
    env.temperature * 0.6 + target * 0.4 + (random(w) - 0.5) * 3;
  const rainChance =
    env.location.climate === "arid" ? 0.13 : tropical ? 0.48 : 0.29;
  w.precipitation = Math.min(
    35,
    w.precipitation * 0.5 + (random(w) < rainChance ? 4 + random(w) * 20 : 0),
  );
  const evaporation =
    Math.max(0.005, (env.temperature + 10) / 1800) * (w.daylight / 12);
  w.moisture = unit(w.moisture + w.precipitation / 220 - evaporation);
  w.water = unit(
    w.water +
      (w.moisture - w.water) * 0.07 +
      w.precipitation / 500 -
      evaporation * 0.25,
  );
  const growth = (w.moisture * 0.7 + 0.3) * (seasonal * 0.25 + 0.75) * 0.025;
  w.vegetation = unit(
    w.vegetation +
      growth * (1 - w.vegetation) -
      Math.max(0, 0.3 - w.moisture) * 0.055 -
      w.competition * 0.001,
  );
  const migrationLoss = Math.max(0, 0.3 - w.water) * 0.06;
  w.prey = unit(
    w.prey +
      w.vegetation * 0.025 * (1 - w.prey) -
      w.predators * 0.009 -
      migrationLoss,
  );
  w.predators = unit(
    w.predators +
      (w.prey * 0.7 + Math.max(0, 0.45 - w.prey) * 0.4 - w.predators) * 0.035,
  );
  w.competition = unit(
    w.competition +
      ((w.prey / Math.max(0.2, w.vegetation + w.water)) * 0.45 -
        w.competition) *
        0.05,
  );
  w.habitat = unit(
    w.habitat +
      (1 - env.pressure * 0.5 - w.habitat) * 0.003 -
      Math.max(0, w.precipitation - 25) / 5000,
  );
  for (const patch of w.patches) {
    patch.food = unit(
      patch.food +
        (w.vegetation + w.prey) * 0.018 * (1 - patch.food) -
        w.competition * 0.001,
    );
    patch.water = unit(patch.water + (w.water - patch.water) * 0.06);
  }
  env.weather =
    w.precipitation > 15
      ? "Heavy rain"
      : w.precipitation > 3
        ? "Rain"
        : env.temperature > sp.heat - 3
          ? "Hot"
          : env.temperature < sp.cold + 3
            ? "Cold"
            : "Fair";
  refreshResources(s);
  const breedingSeason = seasonal > 0.1 || tropical || sp.water === "marine";
  const severities: Record<Situation["kind"], number> = {
    drought: marine ? 0 : unit((0.32 - w.water) / 0.32),
    "food-shortage": unit((0.42 - env.food) / 0.42),
    "predator-pressure": unit(
      (w.predators - 0.4) * 2 + Math.max(0, 0.4 - w.prey),
    ),
    flood: marine ? 0 : unit((w.precipitation - 24) / 11) * w.water,
    breeding:
      sp.reproductive &&
      a.ageDays >= sp.adultDay &&
      breedingSeason &&
      env.food > 0.4
        ? 0.5
        : 0,
  };
  const causes: Record<Situation["kind"], string> = {
    drought:
      "Water loss exceeds rainfall; vegetation and prey are under pressure.",
    "food-shortage":
      "Food intake opportunities are constrained by depleted forage and competition.",
    "predator-pressure":
      "Predators concentrate around local prey and shared resources.",
    flood: "Sustained precipitation is saturating the local habitat.",
    breeding:
      "Maturity, seasonal conditions and adequate food create a breeding opportunity.",
  };
  const messages: string[] = [];
  for (const kind of Object.keys(severities) as Situation["kind"][]) {
    const severity = severities[kind];
    let situation = w.situations.find(
      (x) => x.kind === kind && x.status === "active",
    );
    if (!situation && severity > 0.1) {
      situation = {
        id: `${kind}-${w.elapsedDays}`,
        kind,
        began: { ...s.date },
        days: 0,
        severity,
        cause: causes[kind],
        status: "active",
        involvement: 0,
      };
      w.situations.push(situation);
      messages.push(causes[kind]);
    }
    if (situation) {
      situation.days++;
      situation.severity = severity;
      if (severity <= 0.03) {
        situation.status = "resolved";
        situation.outcome =
          "The underlying environmental or biological pressure eased.";
        messages.push(
          `${kind.replaceAll("-", " ")} eased after ${situation.days} days.`,
        );
      }
    }
  }
  if (w.situations.length > 30) {
    const active = w.situations.filter((x) => x.status === "active");
    w.situations = [
      ...w.situations
        .filter((x) => x.status === "resolved")
        .slice(-(30 - active.length)),
      ...active,
    ];
  }
  return messages;
}
export function applyWorldAction(s: GameState, action: Action): void {
  if (!s.world) return;
  const w = s.world,
    a = animal(s),
    patch = w.patches.find((p) => p.id === w.activePatch)!;
  a.experience ??= { foraging: 0, habitatKnowledge: 0, dangerMemory: 0 };
  if (action === "feed") {
    patch.food = unit(patch.food - 0.025);
    a.experience.foraging = Math.min(
      100,
      a.experience.foraging + 0.1 + (a.personality?.learning ?? 50) / 500,
    );
  }
  if (action === "drink") patch.water = unit(patch.water - 0.02);
  if (action === "explore")
    a.experience.habitatKnowledge = Math.min(
      100,
      a.experience.habitatKnowledge + 1,
    );
  if (action === "move") {
    const target = w.patches
      .filter((p) => p.id !== w.activePatch)
      .sort(
        (x, y) =>
          y.food * 3 +
          y.water +
          y.cover * 0.3 -
          (x.food * 3 + x.water + x.cover * 0.3),
      )[0];
    w.activePatch = target.id;
  }
  if (action === "learn")
    a.experience.foraging = Math.min(
      100,
      a.experience.foraging + 0.2 + (a.personality?.learning ?? 50) / 150,
    );
  for (const situation of w.situations.filter((x) => x.status === "active")) {
    if (
      (situation.kind === "drought" && action === "move") ||
      (situation.kind === "food-shortage" && action === "explore") ||
      (situation.kind === "predator-pressure" && action === "shelter") ||
      (situation.kind === "breeding" && action === "mate")
    )
      situation.involvement++;
  }
  refreshResources(s);
}
export function describeSituation(s: GameState): string {
  const a = animal(s),
    env = s.environment!,
    w = s.world;
  if (!w)
    return `${env.weather} conditions in ${env.location.habitat.toLowerCase()}.`;
  const active = w.situations
    .filter((x) => x.status === "active" && x.kind !== "breeding")
    .sort((x, y) => y.severity - x.severity)[0];
  const condition =
    a.stats.injury > 15
      ? "Your injury limits how much ground you can cover."
      : a.stats.hunger > 65
        ? "Hunger is becoming difficult to ignore."
        : a.stats.energy < 35
          ? "Fatigue makes each movement more costly."
          : "There is room for an ordinary, quiet phase.";
  const ecology = active
    ? active.cause
    : w.water < 0.5
      ? "Water is receding from the local habitat."
      : w.prey > 0.6
        ? "Local prey remains relatively abundant."
        : "Food organisms are recovering slowly.";
  return `${env.weather}, ${Math.round(env.temperature)}°C. ${ecology} ${condition}`;
}
export function ensureIndividualExperience(a: Individual): void {
  a.personality ??= {
    caution: a.traits.perception,
    curiosity: 100 - a.traits.resilience,
    learning: a.traits.perception,
    stressResponse: 100 - a.traits.sociability,
  };
  a.experience ??= { foraging: 0, habitatKnowledge: 0, dangerMemory: 0 };
}
