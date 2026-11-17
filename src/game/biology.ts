import { speciesById } from "../data/species";
import { SPECIES_RULES } from "../data/species-rules";
import { random } from "./random";
import type { Action, GameState, Individual, SpeciesState } from "./types";
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const unit = (v: number) => Math.max(0, Math.min(1, v));
const a = (s: GameState) => s.family[s.currentId!];
const node = (s: GameState) => s.world!.activePatch;
const stage = (animal: Individual) =>
  [...speciesById(animal.speciesId).stages]
    .reverse()
    .find((x) => animal.ageDays >= x.fromDay)!;
const close = (s: GameState) =>
  s.area!.animals.filter((n) => n.alive && n.location === node(s));
const companions = (s: GameState) =>
  close(s).filter(
    (n) =>
      n.species === speciesById(a(s).speciesId).name &&
      ["mother", "companion"].includes(n.role),
  );
export function initialBiology(animal: Individual): SpeciesState {
  return {
    model: 1,
    stage: stage(animal).name,
    stores: { reserves: 100, ...SPECIES_RULES[animal.speciesId].stores },
    skills: {},
    milestones: [],
  };
}
export function ensureBiology(s: GameState) {
  for (const animal of Object.values(s.family))
    animal.biology ??= initialBiology(animal);
}
const skill = (s: GameState, key: string, n = 1) => {
  const b = a(s).biology!;
  b.skills[key] = clamp((b.skills[key] ?? 0) + n);
};
const store = (s: GameState, key: string, n: number) => {
  const b = a(s).biology!;
  b.stores[key] = clamp((b.stores[key] ?? 0) + n);
};
export type BiologyActivityId =
  | "collect-pollen"
  | "deliver-pollen"
  | "clear-waste"
  | "digest-fiber"
  | "maintain-warren"
  | "rally-pack"
  | "pack-hunt"
  | "learn-water"
  | "dig-water"
  | "wallow"
  | "dabble"
  | "preen"
  | "line-nest"
  | "blend-in"
  | "claim-den"
  | "guard-eggs"
  | "sentinel"
  | "help-pups"
  | "dig-prey"
  | "graze-algae"
  | "ambush"
  | "moisten-skin"
  | "probe-shallows"
  | "gather-fruit"
  | "learn-route"
  | "listen-pounce"
  | "bury-cache"
  | "recover-cache"
  | "sing"
  | "build-reserves"
  | "sheltered-roost"
  | "shallow-dive"
  | "deep-dive"
  | "recover-dive";
export interface BiologyActivity {
  id: BiologyActivityId;
  title: string;
  detail: string;
  action: Action;
}
export function biologyActivities(s: GameState): BiologyActivity[] {
  const p = a(s),
    b = p.biology!,
    where = node(s),
    dep = stage(p).dependent,
    result: BiologyActivity[] = [];
  const add = (
    id: BiologyActivityId,
    title: string,
    detail: string,
    action: Action,
  ) => result.push({ id, title, detail, action });
  if (dep) {
    if (p.speciesId === "elephant" && p.ageDays >= 1 && companions(s).length)
      add(
        "learn-water",
        "Learn a water route with the herd",
        "Remember this place with an older family member. Knowledge can guide later journeys.",
        "rest",
      );
    if (p.speciesId === "seal" && close(s).some((n) => n.role === "mother"))
      add(
        "recover-dive",
        "Rest beside your mother",
        "Rest ashore or at the surface. Swimming does not replace nursing.",
        "rest",
      );
    return result;
  }
  switch (p.speciesId) {
    case "bumblebee":
      if (where === "forage" && flightPossible(s))
        add(
          "collect-pollen",
          "Gather nectar and pollen",
          "Use flowers here; carry pollen back to the colony.",
          "feed",
        );
      if (["home", "shade"].includes(where) && b.stores.pollen >= 5)
        add(
          "deliver-pollen",
          "Deliver pollen to the brood",
          "Unload your finite pollen supply into the nest’s food stores.",
          "socialize",
        );
      break;
    case "ant":
      if (["home", "shade"].includes(where) && b.stores.contamination > 5)
        add(
          "clear-waste",
          "Remove waste from the garden",
          "Reduce contamination. Garden hygiene protects future food.",
          "socialize",
        );
      break;
    case "rabbit":
      if (b.stores.fiber > 5 && ["home", "shade"].includes(where))
        add(
          "digest-fiber",
          "Digest in the safety of the warren",
          "Recover nutrients from previously eaten plants through cecotrophy.",
          "rest",
        );
      if (["home", "shade"].includes(where))
        add(
          "maintain-warren",
          "Maintain the warren tunnels",
          "Improve persistent cover for yourself and young. Digging uses energy.",
          "shelter",
        );
      break;
    case "wolf":
      if (["home", "forage"].includes(where))
        add(
          "rally-pack",
          "Gather your pack",
          "Call nearby family members along connected paths. They spend energy to join you.",
          "socialize",
        );
      if (
        where === "forage" &&
        p.ageDays >= 365 &&
        companions(s).some((n) => n.bond > 40 && n.energy > 30)
      )
        add(
          "pack-hunt",
          "Hunt together",
          "A shared hunt uses your companions’ energy and shares a successful meal.",
          "feed",
        );
      break;
    case "elephant":
      if (companions(s).length)
        add(
          "learn-water",
          "Learn the herd’s water routes",
          "Remember places with older relatives. Their presence and trust matter.",
          "rest",
        );
      if (
        where === "water" &&
        p.ageDays >= 365 &&
        b.stores.groundwater >= 5 &&
        s.world!.moisture > 0.1
      )
        add(
          "dig-water",
          "Dig for shallow water",
          "Access a finite groundwater reserve. This costs energy and does not end drought.",
          "explore",
        );
      if (
        where === "water" &&
        s.world!.patches.find((x) => x.id === where)!.water > 0.3
      )
        add(
          "wallow",
          "Cool down with water and mud",
          "Mud protection fades over time. Using this water reduces the local supply.",
          "shelter",
        );
      break;
    case "mallard":
      if (["home", "water", "forage"].includes(where))
        add(
          "dabble",
          "Dabble in the shallows",
          "Take aquatic plants and invertebrates. Ducklings can feed themselves.",
          "feed",
        );
      add(
        "preen",
        "Preen your feathers",
        "Maintain plumage for swimming and weather protection. Hunger continues.",
        "shelter",
      );
      if (p.ageDays >= 60 && ["home", "shade"].includes(where))
        add(
          "line-nest",
          "Prepare a reed nest",
          "Use local vegetation for a sheltered breeding site.",
          "shelter",
        );
      break;
    case "octopus":
      if (p.ageDays >= 60) {
        add(
          "blend-in",
          "Blend into the seabed",
          "Use camouflage and learn this background. Protection fades and is never complete.",
          "shelter",
        );
        if (["home", "shade"].includes(where))
          add(
            "claim-den",
            "Arrange a crevice den",
            "Improve this den’s cover. You must be here to benefit from it.",
            "shelter",
          );
      }
      if (p.sex === "Female" && p.pregnantUntil !== undefined)
        add(
          "guard-eggs",
          "Guard and aerate the eggs",
          "Brooding protects the developing cohort. The female fasts and can decline.",
          "shelter",
        );
      break;
    case "meerkat":
      if (["forage", "edge"].includes(where))
        add(
          "sentinel",
          "Take a turn as lookout",
          "Give up feeding time to warn nearby group members. Vigilance fades.",
          "explore",
        );
      add(
        "help-pups",
        "Help the group’s young",
        "Share food and care. Helper experience supports your social standing.",
        "socialize",
      );
      if (["forage", "water"].includes(where))
        add(
          "dig-prey",
          "Dig for insects",
          "Search below ground. Foraging skill and sentinels affect the opportunity.",
          "feed",
        );
      break;
    case "bullfrog":
      if (p.ageDays < 365)
        add(
          "graze-algae",
          "Graze algae in the pond",
          "Tadpoles feed in water. Drying water and aquatic predators remain threats.",
          "feed",
        );
      else {
        add(
          "ambush",
          "Wait for passing prey",
          "A low-movement hunt. The local prey supply still limits a meal.",
          "feed",
        );
        if (["water", "shade", "home"].includes(where))
          add(
            "moisten-skin",
            "Rest in wet cover",
            "Restore skin moisture using the remaining local water.",
            "shelter",
          );
      }
      break;
    case "raccoon":
      if (where === "water")
        add(
          "probe-shallows",
          "Feel for food in the shallows",
          "Use touch to find aquatic prey. Dexterity improves with practice.",
          "feed",
        );
      if (where === "forage")
        add(
          "gather-fruit",
          "Gather fruit and nuts",
          "Draw on plants instead of aquatic prey. Seasonal vegetation matters.",
          "feed",
        );
      add(
        "learn-route",
        "Learn this night route",
        "Remember this exact place. Familiar routes reduce later travel costs.",
        "explore",
      );
      break;
    case "fox":
      if (["forage", "edge"].includes(where))
        add(
          "listen-pounce",
          "Listen, then pounce",
          "Hunt small prey. Surplus from a successful hunt can be carried and cached.",
          "feed",
        );
      if (b.stores.parcel > 5)
        add(
          "bury-cache",
          "Hide a surplus meal",
          "Store carried food at this location. Caches can decay or be lost.",
          "shelter",
        );
      if ((b.stores[`cache:${where}`] ?? 0) > 5)
        add(
          "recover-cache",
          "Recover a remembered cache",
          "Eat food previously hidden here. The cache is finite.",
          "rest",
        );
      break;
    case "robin":
      if (p.ageDays >= 21)
        add(
          "sing",
          "Sing from your territory",
          "Spend energy to deter a nearby rival. Territory helps retain local feeding access.",
          "explore",
        );
      add(
        "build-reserves",
        "Feed before the cold night",
        "Food can build a finite energy reserve. No meal appears without local resources.",
        "feed",
      );
      if (["home", "shade"].includes(where))
        add(
          "sheltered-roost",
          "Settle into a sheltered roost",
          "Rest in cover and conserve reserves during the cold.",
          "shelter",
        );
      break;
    case "seal":
      if (
        ["forage", "water", "edge"].includes(where) &&
        b.stores.diveRecovery >= 25
      )
        add(
          "shallow-dive",
          "Forage in shallow water",
          "Complete a bout of short dives. Recover before another demanding bout.",
          "feed",
        );
      if (
        where === "edge" &&
        p.ageDays >= speciesById("seal").adultDay &&
        (b.skills.diving ?? 0) >= 8 &&
        b.stores.diveRecovery >= 60
      )
        add(
          "deep-dive",
          "Try the deeper fishing ground",
          "Use practiced diving skills. A deeper bout has a greater recovery cost.",
          "feed",
        );
      add(
        "recover-dive",
        where === "home" || where === "shade"
          ? "Rest at the haul-out"
          : "Recover at the surface",
        "Restore dive recovery. This represents many breaths between dive bouts, not days without breathing.",
        "rest",
      );
      break;
  }
  return result;
}
export function flightPossible(s: GameState) {
  return (
    s.environment!.temperature >= 8 &&
    s.world!.precipitation < 15 &&
    s.phase < 2
  );
}
export function filterSpeciesActions(s: GameState, actions: Action[]) {
  const p = a(s),
    id = p.speciesId,
    b = p.biology!;
  return actions.filter((action) => {
    if (action === "feed") {
      if (["Egg", "Pupa"].includes(stage(p).name)) return false;
      if (id === "seal" && !stage(p).dependent)
        return (
          ["forage", "water", "edge"].includes(node(s)) &&
          b.stores.diveRecovery >= 25
        );
      if (
        id === "octopus" &&
        p.sex === "Female" &&
        p.pregnantUntil !== undefined
      )
        return false;
      if (id === "bumblebee" && !stage(p).dependent)
        return ["home", "shade"].includes(node(s))
          ? b.stores.nectar > 0
          : flightPossible(s);
    }
    if (
      id === "bullfrog" &&
      p.ageDays < 365 &&
      ["care", "socialize"].includes(action)
    )
      return false;
    return true;
  });
}
export function biologyTravel(
  s: GameState,
  target: string,
): { blocked?: string; energyFactor: number } {
  const p = a(s),
    b = p.biology!,
    dep = stage(p).dependent;
  if (
    p.speciesId === "bullfrog" &&
    p.ageDays < 365 &&
    ["shade", "edge"].includes(target)
  )
    return {
      blocked:
        "You still have gills and a tail. Tadpoles must remain in connected pond water.",
      energyFactor: 1,
    };
  if (p.speciesId === "octopus" && p.ageDays < 60 && target === "shade")
    return {
      blocked: "Planktonic hatchlings cannot establish a seabed den yet.",
      energyFactor: 1,
    };
  if (
    p.speciesId === "bumblebee" &&
    !dep &&
    !["home", "shade"].includes(target) &&
    !flightPossible(s)
  )
    return {
      blocked:
        "Flight is unsafe in this cold, heavy rain or darkness. Remain sheltered until conditions improve.",
      energyFactor: 1,
    };
  if (p.speciesId === "robin" && p.ageDays < 21 && target === "edge")
    return {
      blocked: "Your flight feathers are not ready for this exposed route.",
      energyFactor: 1,
    };
  if (p.speciesId === "mallard" && p.ageDays < 60 && target === "edge")
    return {
      blocked: "Ducklings can swim, but cannot fly across the open lake yet.",
      energyFactor: 1,
    };
  if (p.speciesId === "seal" && dep && target === "edge")
    return {
      blocked:
        "A nursing pup can swim nearby but cannot forage in the deep fishing ground.",
      energyFactor: 1,
    };
  let energyFactor = 1;
  if (p.speciesId === "raccoon" && (b.skills[`route:${target}`] ?? 0) >= 3)
    energyFactor = 0.7;
  if (p.speciesId === "elephant" && (b.skills[`water:${target}`] ?? 0) >= 3)
    energyFactor = 0.8;
  if (
    ["robin", "mallard"].includes(p.speciesId) &&
    p.ageDays >= (p.speciesId === "robin" ? 21 : 60) &&
    p.stats.injury < 25
  )
    energyFactor = 0.8;
  return { energyFactor };
}
export function reproductionPossible(s: GameState) {
  const p = a(s),
    b = p.biology!,
    id = p.speciesId,
    day = s.date.day;
  const spring = day >= 40 && day <= 200;
  if (id === "wolf") return (day < 100 || day > 330) && p.stats.bond >= 65;
  if (id === "elephant")
    return (
      p.lastReproduction === undefined || p.ageDays - p.lastReproduction >= 1460
    );
  if (id === "mallard")
    return (
      spring &&
      b.stores.nest >= 25 &&
      ["home", "shade", "water"].includes(node(s))
    );
  if (id === "bullfrog")
    return (
      p.ageDays >= 1095 &&
      s.environment!.temperature >= 15 &&
      s.world!.water > 0.3
    );
  if (id === "meerkat")
    return (
      b.stores.help >= 20 && p.stats.bond >= 75 && companions(s).length > 0
    );
  if (id === "robin") return spring && b.stores.territory >= 20;
  if (id === "fox") return day < 130 || day > 330;
  if (id === "raccoon") return day < 150 || day > 330;
  if (id === "seal") return ["home", "shade", "water"].includes(node(s));
  if (id === "rabbit") return b.stores.burrow >= 20;
  return speciesById(id).reproductive;
}
export function preferredFeedingNode(s: GameState) {
  const p = a(s),
    b = p.biology!;
  if (p.speciesId === "ant") return b.stores.substrate < 5 ? "forage" : "home";
  if (p.speciesId === "bumblebee" && b.stores.pollen > 25) return "home";
  return p.speciesId === "seal"
    ? "forage"
    : p.speciesId === "bumblebee" && !flightPossible(s)
      ? "home"
      : s
          .world!.patches.filter(
            (p) =>
              s.area!.nodes.find((n) => n.id === p.id) &&
              s.area!.nodes.find((n) => n.id === node(s))!.links.includes(p.id),
          )
          .sort((x, y) => y.food - x.food)[0]?.id;
}
export function applyBiologyActivity(
  s: GameState,
  id: BiologyActivityId,
): string {
  const p = a(s),
    b = p.biology!,
    where = node(s),
    patch = s.world!.patches.find((x) => x.id === where)!;
  skill(s, `activity:${id}`);
  switch (id) {
    case "collect-pollen":
      store(s, "pollen", Math.min(30, patch.food * 35));
      patch.food = unit(patch.food - 0.04);
      store(s, "nectar", 12);
      return "Pollen fills your carrying load. Flowers here are depleted until they recover.";
    case "deliver-pollen": {
      const amount = b.stores.pollen;
      store(s, "broodFood", amount * 0.8);
      b.stores.pollen = 0;
      p.colonyService += 2;
      s.world!.patches.find((x) => x.id === "home")!.food = unit(
        s.world!.patches.find((x) => x.id === "home")!.food + amount / 300,
      );
      return "Your pollen load reaches the brood. Carrying space is free for another trip.";
    }
    case "clear-waste":
      store(s, "contamination", -25);
      p.stats.energy -= 4;
      p.colonyService++;
      return "Waste leaves the garden. Lower contamination reduces fungal decline.";
    case "digest-fiber": {
      const used = Math.min(25, b.stores.fiber);
      store(s, "fiber", -used);
      p.stats.hunger = clamp(p.stats.hunger - used * 0.65);
      return "Nutrients from an earlier meal are recovered. The stored plant material is used up.";
    }
    case "maintain-warren":
      store(s, "burrow", 12);
      s.world!.patches.find((x) => x.id === "home")!.cover = unit(
        s.world!.patches.find((x) => x.id === "home")!.cover + 0.04,
      );
      p.stats.energy -= 8;
      return "The warren gains shelter. Digging costs energy and the improved cover persists.";
    case "rally-pack": {
      let joined = 0;
      for (const n of s.area!.animals.filter(
        (n) =>
          n.alive &&
          n.species === speciesById(p.speciesId).name &&
          ["mother", "companion"].includes(n.role),
      )) {
        if (
          n.location === where ||
          s.area!.nodes.find((x) => x.id === n.location)!.links.includes(where)
        ) {
          n.location = where;
          n.energy = clamp(n.energy - 8);
          n.bond = clamp(n.bond + 5);
          n.engagedUntil = s.area!.ticks + 2;
          joined++;
        }
      }
      store(s, "coordination", joined * 20);
      return `${joined} pack members answer from reachable ground. Gathering uses their energy as well as your time.`;
    }
    case "pack-hunt":
      for (const n of companions(s)) {
        n.energy = clamp(n.energy - 12);
        n.engagedUntil = s.area!.ticks + 1;
      }
      store(s, "coordination", -15);
      return "You commit to a shared hunt. Companions spend energy too; a meal is not guaranteed.";
    case "learn-water":
      if (companions(s).length) {
        skill(s, `water:${where}`, 1 + companions(s)[0].bond / 50);
        p.experience!.habitatKnowledge = clamp(
          p.experience!.habitatKnowledge + 1,
        );
      }
      return "An older companion helps you remember this route. The memory remains after you part.";
    case "dig-water":
      store(s, "groundwater", -5);
      patch.water = unit(patch.water + 0.12);
      s.world!.water = unit(s.world!.water + 0.005);
      p.stats.energy -= 14;
      return "Shallow digging releases some remaining groundwater. The finite reserve shrinks.";
    case "wallow":
      store(s, "mud", 45);
      patch.water = unit(patch.water - 0.04);
      p.stats.energy -= 3;
      return "Water and mud coat your skin. Heat protection will fade over the next phases.";
    case "dabble":
      patch.food = unit(patch.food - 0.02);
      s.world!.prey = unit(s.world!.prey - 0.005);
      skill(s, "dabbling");
      return "You search the shallows for food. Aquatic plants and small prey are finite.";
    case "preen":
      store(s, "plumage", 30);
      p.stats.energy -= 3;
      return "Feathers are tended. Better plumage reduces later wet-weather heat loss.";
    case "line-nest":
      store(s, "nest", 20);
      s.world!.vegetation = unit(s.world!.vegetation - 0.01);
      p.stats.energy -= 7;
      return "Vegetation lines the nest. A prepared site supports a future clutch.";
    case "blend-in":
      store(s, "camouflage", 35 + (p.experience?.habitatKnowledge ?? 0) / 10);
      p.stats.energy -= 4;
      skill(s, "camouflage");
      return "Your skin pattern matches this background. Movement and time will weaken the disguise.";
    case "claim-den":
      store(s, `den:${where}`, 25);
      store(s, "den", 15);
      patch.cover = unit(patch.cover + 0.05);
      p.stats.energy -= 6;
      return "The crevice becomes a better refuge. This protection belongs to this location.";
    case "guard-eggs":
      store(s, "brood", 15);
      p.stats.energy -= 5;
      return "Water moves over the eggs as you guard them. Brooding costs energy while the female fasts.";
    case "sentinel":
      store(s, "vigilance", 50);
      for (const n of companions(s)) {
        n.energy = clamp(n.energy + 6);
        n.bond = clamp(n.bond + 3);
      }
      p.stats.energy -= 6;
      return "You watch while companions rest or feed. Hunger continues; the warning benefit will fade.";
    case "help-pups":
      store(s, "help", 10);
      p.stats.hunger = clamp(p.stats.hunger + 6);
      for (const n of close(s).filter(
        (n) => n.role === "offspring" || n.role === "companion",
      )) {
        n.hunger = clamp(n.hunger - 12);
        n.bond = clamp(n.bond + 5);
      }
      return "Food and time support your group. Helper experience improves social breeding prospects.";
    case "dig-prey":
      p.stats.energy -= 5;
      skill(s, "digging");
      return "You dig below the surface. Foraging uses local prey and costs energy.";
    case "graze-algae":
      s.world!.vegetation = unit(s.world!.vegetation - 0.01);
      store(s, "development", 0.5);
      return "Algae and pond detritus support your growing body. You still need continuous water.";
    case "ambush":
      p.stats.energy += 3;
      skill(s, "ambush");
      return "You wait for prey rather than chase. Hunger still rises if nothing passes.";
    case "moisten-skin": {
      const wet = Math.min(35, patch.water * 45);
      store(s, "skin", wet);
      patch.water = unit(patch.water - 0.02);
      return "Wet cover replenishes skin moisture using the water still available here.";
    }
    case "probe-shallows":
      store(s, "dexterity", 4);
      s.world!.prey = unit(s.world!.prey - 0.01);
      skill(s, "aquatic-search");
      return "Sensitive forepaws search crevices. Dexterity improves; aquatic prey is depleted.";
    case "gather-fruit":
      s.world!.vegetation = unit(s.world!.vegetation - 0.015);
      skill(s, "plant-search");
      return "Fruit and nuts provide an alternative to aquatic prey. Local vegetation declines.";
    case "learn-route":
      skill(s, `route:${where}`, 3);
      p.stats.energy -= 5;
      return "You remember this route and its food sites. Returning here will cost less energy.";
    case "listen-pounce":
      skill(s, "listening");
      p.stats.energy -= 5;
      return "You listen for movement beneath the cover and commit to a pounce.";
    case "bury-cache":
      store(s, `cache:${where}`, b.stores.parcel);
      b.stores.parcel = 0;
      return "Surplus food is hidden here. It will not follow you to another location.";
    case "recover-cache": {
      const amount = Math.min(30, b.stores[`cache:${where}`]);
      store(s, `cache:${where}`, -amount);
      p.stats.hunger = clamp(p.stats.hunger - amount);
      skill(s, "cache-recovery");
      return "You recover an earlier meal from this location. The cache is partly or entirely used up.";
    }
    case "sing":
      store(s, "territory", 20);
      p.stats.energy -= 9;
      for (const n of close(s).filter((n) => n.role === "rival"))
        n.location = s.area!.nodes.find((x) => x.id === where)!.links[0];
      return "Your song advertises this feeding territory. A nearby rival gives ground, for now.";
    case "build-reserves":
      return "You look for enough food to sustain the coming night. Reserves depend on a successful meal.";
    case "sheltered-roost":
      store(s, "roost", 35);
      return "Sheltered rest reduces the reserves needed through a cold night.";
    case "shallow-dive":
      store(s, "diveRecovery", -30);
      skill(s, "diving");
      p.stats.energy -= 5;
      return "A bout of shallow dives costs energy and recovery capacity. Breathing continues between dives.";
    case "deep-dive":
      store(s, "diveRecovery", -55);
      skill(s, "diving", 2);
      p.stats.energy -= 14;
      s.world!.prey = unit(s.world!.prey - 0.02);
      return "A deeper foraging bout draws heavily on recovery. More prey can be reached if the hunt succeeds.";
    case "recover-dive":
      store(s, "diveRecovery", ["home", "shade"].includes(where) ? 55 : 35);
      return "Rest and repeated breaths restore recovery between dive bouts.";
  }
}
/** Hooks are shared by direct actions, contextual interactions and autonomous phases. */
export function speciesFoodFactor(s: GameState) {
  const p = a(s),
    b = p.biology!,
    where = node(s);
  if (stage(p).dependent) return 1;
  switch (p.speciesId) {
    case "ant":
      return 0.15 + (b.stores.fungus / 100) * 0.85;
    case "bumblebee":
      return ["home", "shade"].includes(where)
        ? b.stores.nectar / 100
        : Math.min(1, s.world!.vegetation * 1.3);
    case "bullfrog":
      return p.ageDays < 365
        ? s.world!.vegetation
        : Math.min(1, s.world!.prey * 1.3);
    case "raccoon":
      return where === "water"
        ? Math.min(1, s.world!.prey * 1.2 + b.stores.dexterity / 250)
        : Math.min(1, s.world!.vegetation * 1.3);
    case "robin":
      return Math.min(1, s.world!.prey * 1.2 + b.stores.territory / 300);
    default:
      return 1;
  }
}
export function speciesRiskFactor(s: GameState) {
  const p = a(s),
    b = p.biology!,
    where = node(s);
  if (p.speciesId === "octopus")
    return Math.max(
      0.18,
      1 - b.stores.camouflage / 150 - (b.stores[`den:${where}`] ?? 0) / 250,
    );
  if (p.speciesId === "meerkat")
    return Math.max(0.3, 1 - b.stores.vigilance / 140);
  if (p.speciesId === "rabbit" && ["home", "shade"].includes(where))
    return Math.max(0.3, 1 - b.stores.burrow / 150);
  if (p.speciesId === "elephant" && p.ageDays < 1460)
    return companions(s).length ? 0.7 : 1.9;
  if (p.speciesId === "wolf")
    return Math.max(
      0.65,
      1 - companions(s).filter((n) => n.bond > 40).length * 0.08,
    );
  return 1;
}
export function speciesThermalFactor(s: GameState) {
  const p = a(s),
    b = p.biology!;
  if (p.speciesId === "elephant") return b.stores.mud > 0 ? 0.5 : 1;
  if (p.speciesId === "mallard" && s.world!.precipitation > 3)
    return b.stores.plumage < 30 ? 1.8 : 0.8;
  if (p.speciesId === "seal" && ["home", "shade"].includes(node(s))) return 0.6;
  return 1;
}
export function tickBiology(
  s: GameState,
  action: Action,
  activity?: BiologyActivityId,
): string[] {
  const p = a(s),
    b = p.biology!,
    id = p.speciesId,
    where = node(s),
    messages: string[] = [];
  messages.push(...syncDevelopment(s));
  const newStage = stage(p).name;
  if (["Egg", "Pupa"].includes(newStage)) {
    store(s, "reserves", -0.15);
    if (b.stores.reserves > 0) p.stats.hunger = clamp(p.stats.hunger - 5);
  }
  const fed =
    action === "feed" && s.journal.at(-1)?.text.includes("successful feeding");
  switch (id) {
    case "bumblebee":
      store(s, "broodFood", -0.3);
      if (["home", "shade"].includes(where) && action === "feed")
        store(s, "nectar", -8);
      if (fed && where === "forage") {
        store(s, "nectar", 8);
        store(s, "pollen", 5);
      }
      if (
        action === "socialize" &&
        ["home", "shade"].includes(where) &&
        b.stores.pollen > 0
      ) {
        const load = Math.min(5, b.stores.pollen);
        store(s, "pollen", -load);
        store(s, "broodFood", load);
      }
      break;
    case "ant":
      if (fed && where === "forage") {
        store(s, "substrate", 5);
        s.world!.vegetation = unit(s.world!.vegetation - 0.003);
      }
      if (
        action === "socialize" &&
        ["home", "shade"].includes(where) &&
        b.stores.substrate > 0
      ) {
        if (b.stores.contamination > 35 && activity !== "clear-waste") {
          store(s, "contamination", -8);
        } else {
          store(s, "substrate", -1);
          store(s, "fungus", 1.5);
          store(s, "contamination", -0.5);
        }
      }
      if (s.area!.animals.some((n) => n.alive && n.role === "companion" && n.health > 30 && n.hunger < 85)) {
        store(s, "substrate", s.world!.vegetation * 0.2);
        if (b.stores.substrate > 0) {
          store(s, "substrate", -0.1);
          store(s, "fungus", 0.2);
          // Background workers maintain the garden while brood cannot act.
        store(s, "contamination", -0.85);
        }
      }
      store(s, "contamination", 0.3 + (s.world!.moisture > 0.85 ? 0.5 : 0));
      store(
        s,
        "fungus",
        s.world!.moisture < 0.2
          ? -2
          : b.stores.contamination > 50
            ? -1.2
            : -0.1,
      );
      if (b.stores.fungus < 15) p.stats.health -= 1.5;
      break;
    case "rabbit":
      if (fed) store(s, "fiber", 20);
      if (
        ["rest", "shelter"].includes(action) &&
        b.stores.fiber > 0 &&
        ["home", "shade"].includes(where) &&
        activity !== "digest-fiber"
      ) {
        const used = Math.min(4, b.stores.fiber);
        store(s, "fiber", -used);
        p.stats.hunger = clamp(p.stats.hunger - used * 0.5);
      }
      break;
    case "wolf":
      if (fed && activity === "pack-hunt") {
        for (const n of companions(s)) {
          n.hunger = clamp(n.hunger - 25);
        }
        skill(s, "shared-meals");
        s.world!.prey = unit(s.world!.prey - 0.03);
      }
      break;
    case "elephant":
      store(s, "mud", -8);
      if (s.world!.precipitation > 10) store(s, "groundwater", 0.3);
      if (s.environment!.temperature > 30 && b.stores.mud <= 0)
        p.stats.hydration -= 1;
      break;
    case "mallard":
      store(s, "plumage", s.world!.precipitation > 5 ? -3 : -0.7);
      if (b.stores.plumage < 20 && s.environment!.temperature < 15)
        p.stats.health -= 1;
      store(s, "nest", s.world!.precipitation > 20 ? -0.7 : 0);
      break;
    case "octopus":
      store(s, "camouflage", action === "move" ? -30 : -7);
      if (p.sex === "Female" && p.pregnantUntil !== undefined) {
        p.stats.hunger += 2;
        if (activity === "guard-eggs") skill(s, "brood-care");
      }
      break;
    case "meerkat":
      store(s, "vigilance", -10);
      break;
    case "bullfrog":
      if (p.ageDays < 365) {
        if (s.world!.water < 0.2) {
          p.stats.health -= 6;
          p.stats.stress += 5;
        }
        if (action === "feed") store(s, "development", 0.2);
      } else {
        store(s, "skin", s.environment!.temperature > 25 ? -7 : -3);
        if (b.stores.skin < 20) p.stats.hydration -= 6;
      }
      break;
    case "raccoon":
      if (
        where === "edge" &&
        s.date.year >= 1850 &&
        s.environment!.pressure > 0.25 &&
        random(s.area!) < 0.01
      ) {
        p.stats.injury += 15;
        p.stats.health -= 10;
        messages.push(
          "A modern human hazard leaves an injury at the habitat edge.",
        );
      }
      break;
    case "fox":
      if (fed && p.stats.hunger < 45) {
        store(s, "parcel", 12);
        p.stats.hunger += 7;
      }
      for (const key of Object.keys(b.stores).filter((k) =>
        k.startsWith("cache:"),
      ))
        store(s, key, -0.4 - s.world!.competition * 0.5);
      break;
    case "robin":
      if (fed) store(s, "fat", 20);
      if (s.phase === 3) {
        const demand =
          (s.environment!.temperature < 8 ? 18 : 8) *
          (b.stores.roost > 0 ? 0.5 : 1);
        store(s, "fat", -demand);
        if (b.stores.fat <= 0 && s.environment!.temperature < 8)
          p.stats.health -= 5;
        if (
          b.stores.territory >= 20 &&
          s.environment!.temperature < 8 &&
          b.stores.fat > 0
        )
          skill(s, "cold-nights");
      }
      store(s, "roost", -10);
      store(s, "territory", -0.4);
      break;
    case "seal":
      if (
        action === "feed" &&
        !stage(p).dependent &&
        !["shallow-dive", "deep-dive"].includes(activity ?? "")
      ) {
        store(s, "diveRecovery", -30);
        skill(s, "diving");
      }
      if (action === "rest" && activity !== "recover-dive")
        store(s, "diveRecovery", ["home", "shade"].includes(where) ? 40 : 25);
      break;
  }
  if (fed && activity === "deep-dive") p.stats.hunger -= 10;
  for (const key of Object.keys(p.stats) as (keyof typeof p.stats)[])
    p.stats[key] = clamp(p.stats[key]);
  return messages;
}
export function speciesAchievements(animal: Individual): string[] {
  const b = animal.biology;
  if (!b) return [];
  const k = b.skills,
    done = (key: string, n = 1) => (k[key] ?? 0) >= n;
  const earned: Record<string, boolean> = {
    bumblebee: done("activity:deliver-pollen", 3),
    ant: done("garden-tended", 3) && done("leaves-harvested", 2),
    rabbit:
      done("activity:digest-fiber", 3) && done("activity:maintain-warren", 2),
    wolf: done("shared-meals", 2),
    elephant:
      Object.keys(k).filter((x) => x.startsWith("water:") && k[x] >= 3)
        .length >= 2,
    mallard:
      done("activity:dabble", 3) &&
      done("activity:preen", 2) &&
      animal.ageDays >= 60,
    octopus: done("activity:claim-den", 2) && done("camouflage", 3),
    meerkat: done("activity:sentinel", 3) && done("activity:help-pups", 2),
    bullfrog:
      b.milestones.includes("stage:Froglet") && done("activity:ambush", 2),
    raccoon: done("aquatic-search", 2) && done("plant-search", 2),
    fox: done("cache-recovery", 2),
    robin: done("cold-nights"),
    seal: done("activity:deep-dive", 2),
  };
  return earned[animal.speciesId]
    ? [SPECIES_RULES[animal.speciesId].achievement]
    : [];
}

export function syncDevelopment(s: GameState): string[] {
  const p = a(s),
    b = p.biology!,
    id = p.speciesId,
    messages: string[] = [];
  const oldStage = b.stage,
    newStage = stage(p).name;
  if (oldStage !== newStage) {
    b.stage = newStage;
    const text =
      id === "bullfrog" && p.ageDays >= 365 && oldStage === "Tadpole"
        ? "Metamorphosis changes your body: lungs and legs allow bank exploration and animal prey."
        : id === "octopus" && p.ageDays >= 60 && oldStage === "Paralarva"
          ? "You settle onto the seabed. Camouflage and crevice dens are now useful."
          : `Your ${newStage.toLowerCase()} abilities are now available.`;
    if (!b.milestones.includes(`stage:${newStage}`)) {
      b.milestones.push(`stage:${newStage}`);
      messages.push(text);
    }
  }

  return messages;
}
export function foodWeb(s: GameState) {
  const p = a(s);
  if (p.speciesId === "bullfrog") return p.ageDays < 365 ? "plant" : "predator";
  if (p.speciesId === "raccoon")
    return node(s) === "water"
      ? "predator"
      : node(s) === "forage"
        ? "plant"
        : "omnivore";
  return speciesById(p.speciesId).history.trophic;
}
export function phaseTemperature(s: GameState) {
  const p = a(s),
    offset =
      s.area?.nodes.find((n) => n.id === node(s))?.temperatureOffset ?? 0;
  const buffered =
    s.environment!.location.climate === "marine" ||
    p.speciesId === "seal" ||
    (p.speciesId === "ant" && ["home", "shade"].includes(node(s)));
  return (
    s.environment!.temperature +
    offset +
    (buffered ? 0 : [-2, 2, -1, -4][s.phase])
  );
}
export function speciesStatus(s: GameState) {
  const p = a(s),
    b = p.biology!,
    r = b.stores;
  const descriptions: Record<string, string> = {
    bumblebee:
      r.pollen > 5
        ? "You are carrying pollen. Return to the nest to feed the brood."
        : "Flowers supply your food and the colony’s next generation.",
    ant:
      r.fungus < 35
        ? "The fungus garden is struggling. Leaf substrate, gardening and waste removal support its recovery."
        : r.substrate < 10
          ? "The garden needs fresh plant material from the leaf trail."
          : "Leaf stores and a living fungus garden sustain the colony.",
    rabbit:
      r.fiber > 5
        ? "An earlier plant meal still contains nutrients. Sheltered digestion can recover some."
        : "The warren offers cover, but you must leave it for fresh grazing.",
    wolf: "Pack members pay their own energy costs. Gathering the family can make shared hunting possible.",
    elephant:
      r.groundwater < 10
        ? "Little shallow groundwater remains here. Remembered routes may matter more than digging."
        : "Learning with an older companion builds lasting route memories.",
    mallard:
      r.plumage < 30
        ? "Your plumage needs attention. Preening helps you cope with wet conditions."
        : "Swimming, self-feeding and flight develop at different times.",
    octopus:
      p.ageDays < 60
        ? "You are a planktonic hatchling. Seabed dens become useful after settlement."
        : "Camouflage fades with time and movement. A den protects you only while you use it.",
    meerkat:
      r.vigilance > 10
        ? "A recent lookout shift still helps the group detect danger."
        : "Sentinel and helper duties cost feeding time and support other group members.",
    bullfrog:
      p.ageDays < 365
        ? "Your gills and tail keep you tied to pond water. Algae and detritus support development."
        : r.skin < 30
          ? "Your skin is drying. Find wet cover."
          : "Metamorphosis opened bank routes and changed your diet.",
    raccoon:
      "Fruit gathering and searching shallow water draw on different food supplies. Known routes cost less energy.",
    fox:
      r.parcel > 5
        ? "You can hide this surplus meal here. A cache stays where you bury it."
        : "Remembered caches can buffer a failed hunt, but stored food decays.",
    robin:
      r.fat < 20
        ? "Food reserves are low. A cold night may be difficult."
        : "Territory protects feeding access; sheltered roosts conserve finite food reserves.",
    seal:
      r.diveRecovery < 30
        ? "Recover before another demanding dive bout. You continue breathing between dives."
        : "Forage at sea and rest at the haul-out. Deeper bouts require diving practice.",
  };
  return descriptions[p.speciesId];
}
