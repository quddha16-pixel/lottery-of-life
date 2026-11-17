import { speciesById } from "../data/species";
import { SPECIES_RULES } from "../data/species-rules";
import {
  ensureBiology,
  phaseTemperature,
  biologyActivities,
  applyBiologyActivity,
  biologyTravel,
  reproductionPossible,
  type BiologyActivityId,
} from "./biology";
import { random, seedFromText } from "./random";
import type {
  Action,
  GameState,
  LocalArea,
  LocalNode,
  NearbyAnimal,
} from "./types";
const unit = (v: number) => Math.max(0, Math.min(1, v));
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const player = (s: GameState) => s.family[s.currentId!];
export function dependent(s: GameState) {
  const a = player(s);
  return [...speciesById(a.speciesId).stages]
    .reverse()
    .find((x) => a.ageDays >= x.fromDay)!.dependent;
}
const immobile = (s: GameState) =>
  ["Egg", "Pupa", "Larva"].includes(
    [...speciesById(player(s).speciesId).stages]
      .reverse()
      .find((x) => player(s).ageDays >= x.fromDay)!.name,
  );
export function createArea(s: GameState): LocalArea {
  const a = player(s),
    sp = speciesById(a.speciesId),
    marine = sp.water === "marine";
  const aquatic = marine || a.speciesId === "bullfrog";
  const names =
    SPECIES_RULES[a.speciesId]?.locations ??
    (aquatic
      ? [
          "Sheltered shallows",
          "Feeding current",
          "Open water",
          "Reef shelter",
          "Habitat margin",
        ]
      : [
          "Nursery shelter",
          "Foraging ground",
          "Water margin",
          "Covered resting place",
          "Habitat boundary",
        ]);
  // These are habitat-scale archetypes inside the historically generated region, not modern landmarks.
  const nodes: LocalNode[] = [
    {
      id: "home",
      label: names[0],
      kind: "home",
      links: ["forage", "water", "shade"],
      distance: 1,
      exposure: 0.1,
      temperatureOffset: 0,
      x: 25,
      y: 28,
    },
    {
      id: "forage",
      label: names[1],
      kind: "forage",
      links: ["home", "water", "edge"],
      distance: 2,
      exposure: 0.7,
      temperatureOffset: aquatic ? 0 : 2,
      x: 67,
      y: 24,
    },
    {
      id: "water",
      label: names[2],
      kind: "water",
      links: ["home", "forage", "shade"],
      distance: 2,
      exposure: 0.6,
      temperatureOffset: aquatic ? 0 : -2,
      x: 75,
      y: 69,
    },
    {
      id: "shade",
      label: names[3],
      kind: "shade",
      links: ["home", "water", "edge"],
      distance: 1,
      exposure: 0.12,
      temperatureOffset: aquatic ? 0 : -3,
      x: 28,
      y: 73,
    },
    {
      id: "edge",
      label: names[4],
      kind: "boundary",
      links: ["forage", "shade"],
      distance: 3,
      exposure: 1,
      temperatureOffset: aquatic ? 0 : 3,
      x: 49,
      y: 49,
    },
  ];
  if (
    a.speciesId === "wolf" &&
    /steppe|tundra/i.test(s.environment!.location.habitat)
  )
    nodes.find((n) => n.id === "shade")!.label = "Sheltered hollow";
  const area: LocalArea = {
    model: 1,
    ownerId: a.id,
    rng: seedFromText(`${a.id}:${a.birth.year}:${a.birth.day}:neighbors`),
    ticks: 0,
    nodes,
    animals: [],
  };
  const add = (
    role: NearbyAnimal["role"],
    name: string,
    location: string,
    species = sp.name,
    stage = sp.reproductive ? "Adult" : "Worker",
  ) =>
    area.animals.push({
      id: `${a.id}:local:${area.animals.length}`,
      name,
      species,
      role,
      ageDays:
        species === sp.name
          ? sp.adultDay + Math.floor(Math.min(365, sp.lifespan * 0.25))
          : 730,
      stage,
      health: 90,
      hunger: 25,
      energy: 85,
      injury: 0,
      bond: role === "mother" ? 80 : role === "companion" ? 55 : 0,
      location,
      priority: role === "mother" ? "protect" : "roam",
      alive: true,
      reproductive: sp.reproductive && ["mother", "mate"].includes(role),
      offspring: 0,
      lastBirthDay: 0,
    });
  if (
    (dependent(s) ||
      (a.speciesId === "mallard" && a.ageDays < sp.independence)) &&
    !immobile(s) &&
    sp.independence > 0
  )
    add(
      "mother",
      a.speciesId === "elephant"
        ? "Mara"
        : a.speciesId === "wolf"
          ? "Rowan"
          : "Your mother",
      "home",
    );
  if (sp.behavior?.socialAction !== false)
    add(
      "companion",
      a.caste
        ? "Nest worker"
        : a.speciesId === "elephant"
          ? "Old Tamar"
          : a.speciesId === "wolf"
            ? "Bracken"
            : "A familiar companion",
      "home",
    );
  if (["wolf", "elephant", "ant"].includes(a.speciesId)) {
    add(
      "rival",
      a.speciesId === "ant" ? "Neighboring worker" : "An unfamiliar adult",
      "edge",
      sp.name,
    );
    if (a.speciesId === "wolf") add("prey", "A grazing deer", "forage", "Deer");
  }
  if (["robin", "bullfrog", "fox", "rabbit"].includes(a.speciesId))
    add("rival", "A neighboring territory holder", "edge", sp.name);
  add(
    "predator",
    "A hunting visitor",
    "water",
    sp.predators.find((p) => p !== "Human") ?? sp.predators[0],
  );
  if (sp.reproductive) add("mate", "A neighboring adult", "forage", sp.name);
  return area;
}
export function ensureArea(s: GameState) {
  ensureBiology(s);
  if (!s.currentId || !s.environment || !s.world) return;
  if (!s.area || s.area.ownerId !== s.currentId) s.area = createArea(s);
  for (const node of s.area.nodes)
    if (!s.world.patches.some((p) => p.id === node.id))
      s.world.patches.push({
        id: node.id,
        label: node.label,
        food: 0.8,
        water: node.kind === "water" ? 0.95 : 0.45,
        cover: 1 - node.exposure * 0.75,
      });
}
export const locationNow = (s: GameState) =>
  s.area!.nodes.find((n) => n.id === s.world!.activePatch)!;
export const nearby = (s: GameState) =>
  s.area!.animals.filter((n) => n.alive && n.location === s.world!.activePatch);
export function travelEligibility(
  s: GameState,
  targetId: string,
): {
  allowed: boolean;
  reason: string;
  phases: number;
  energy: number;
  escorted: boolean;
} {
  const a = player(s),
    node = s.area?.nodes.find((n) => n.id === targetId),
    from = s.area?.nodes.find((n) => n.id === s.world?.activePatch);
  const escort = nearby(s).find(
    (n) =>
      ["mother", "companion"].includes(n.role) &&
      n.health > 30 &&
      n.energy > 25,
  );
  const escorted =
    dependent(s) ||
    (["mallard", "elephant", "raccoon", "fox", "meerkat"].includes(
      a.speciesId,
    ) &&
      a.ageDays < speciesById(a.speciesId).independence);
  const phases = node ? Math.max(1, Math.ceil(node.distance / 2)) : 1;
  const mobility = biologyTravel(s, targetId);
  const energy = node
    ? Math.ceil(
        (5 + node.distance * 3 + (a.stats.injury > 20 ? 5 : 0)) *
          mobility.energyFactor,
      )
    : 0;
  let reason = "Travel consumes time, energy and exposure.";
  let allowed = true;
  if (!a.alive) {
    allowed = false;
    reason = "This life has ended.";
  } else if (!node || !from?.links.includes(targetId)) {
    allowed = false;
    reason = "No direct route from here.";
  } else if (immobile(s)) {
    allowed = false;
    reason = "This developmental stage cannot travel or choose transport.";
  } else if (mobility.blocked) {
    allowed = false;
    reason = mobility.blocked;
  } else if (
    dependent(s) &&
    (a.speciesId !== "elephant" || a.ageDays < 1) &&
    (a.speciesId !== "wolf" || a.ageDays < 21) &&
    a.speciesId !== "seal"
  ) {
    allowed = false;
    reason = "Too young to leave the nursery, even with company.";
  } else if (escorted && (!escort || node!.kind === "boundary")) {
    allowed = false;
    reason =
      "A capable caregiver must accompany you on a sheltered family route.";
  } else if (a.stats.energy < energy + 15 || a.stats.injury > 65) {
    allowed = false;
    reason = "Exhaustion or injury makes this journey inaccessible.";
  } else if (escorted)
    reason =
      "Follow your caregiver. You remain dependent and exposed along the route.";
  return { allowed, reason, phases, energy, escorted };
}
export type InteractionId =
  | `biology:${BiologyActivityId}`
  | Action
  | "nurse"
  | "stay-close"
  | "follow-group"
  | "groom"
  | "tend-garden"
  | "cut-leaves"
  | "track-prey"
  | "mark-boundary";
export interface Interaction {
  id: InteractionId;
  title: string;
  detail: string;
  action: Action;
  target?: string;
}
export function interactions(s: GameState, actions: Action[]): Interaction[] {
  const a = player(s),
    sp = speciesById(a.speciesId),
    node = locationNow(s),
    companions = nearby(s);
  const mother = companions.find((n) => n.role === "mother");
  if (!a.alive) return [];
  if (immobile(s))
    return [
      {
        id: "wait",
        title: "Develop in the brood chamber",
        detail:
          "Stored reserves and colony care sustain development. You cannot move or forage.",
        action: "wait",
      },
      {
        id: "rest",
        title: "Remain in the nursery",
        detail: "Rest while development and environmental risks continue.",
        action: "rest",
      },
    ];
  const result: Interaction[] = [];
  for (const option of biologyActivities(s))
    result.push({ ...option, id: `biology:${option.id}` });
  if (dependent(s)) {
    if (mother)
      result.push(
        {
          id: "nurse",
          title:
            a.speciesId === "wolf" && a.ageDays > 28
              ? "Solicit food from Rowan"
              : a.speciesId === "elephant"
                ? "Attempt to nurse from Mara"
                : "Seek food from your mother",
          detail: `${mother.name} is here. Her hunger, health and bond affect provisioning.`,
          action: "feed",
          target: mother.id,
        },
        {
          id: "stay-close",
          title: `Stay close to ${mother.name}`,
          detail:
            "Strengthen this relationship and reduce exposure; care is not guaranteed.",
          action: "shelter",
          target: mother.id,
        },
      );
    const route = s.area!.nodes.find((n) => travelEligibility(s, n.id).allowed);
    if (route)
      result.push({
        id: "follow-group",
        title:
          a.speciesId === "elephant" ? "Follow the herd" : "Follow a parent",
        detail: `Move together toward ${route.label.toLowerCase()}.`,
        action: "wait",
        target: route.id,
      });
  }
  if (!dependent(s) && a.speciesId === "ant") {
    if (["home", "shade"].includes(node.id) && a.biology!.stores.substrate > 5)
      result.push({
        id: "tend-garden",
        title: "Tend the fungus garden",
        detail: "Convert effort into healthier colony food stores and service.",
        action: "socialize",
      });
    if (node.kind === "forage")
      result.push({
        id: "cut-leaves",
        title: "Cut leaves for the garden",
        detail: "Harvest local vegetation; bring substrate back to the colony.",
        action: "feed",
      });
  }
  if (!dependent(s) && a.speciesId === "wolf") {
    if (a.ageDays >= 365 && companions.some((n) => n.role === "prey"))
      result.push({
        id: "track-prey",
        title: "Follow the deer tracks",
        detail:
          "Commit to a hunt. Pack support and local prey determine its cost and yield.",
        action: "feed",
      });
    if (node.kind === "boundary")
      result.push({
        id: "mark-boundary",
        title: "Investigate and scent-mark",
        detail: "Learn this boundary; rivals may challenge your presence.",
        action: "explore",
      });
  }
  const companion = companions.find((n) =>
    ["companion", "mother", "offspring"].includes(n.role),
  );
  if (!dependent(s) && companion && actions.includes("socialize"))
    result.push({
      id: "groom",
      title: a.caste
        ? "Share colony work"
        : `Spend time with ${companion.name}`,
      detail:
        "Care for this individual; their condition and trust can improve.",
      action: "socialize",
      target: companion.id,
    });
  for (const action of actions.filter(
    (x) =>
      !["move", "mate", "explore", "socialize", "learn", "wait"].includes(x),
  )) {
    if (action === "feed" && result.some((x) => x.action === "feed")) continue;
    if (
      action === "drink" &&
      s.world!.patches.find((p) => p.id === node.id)!.water < 0.25
    )
      continue;
    if (action === "care" && !a.children.some((id) => s.family[id]?.alive))
      continue;
    const title: Record<string, string> = {
      feed: dependent(s)
        ? "Wait for provisioning"
        : (sp.behavior?.feedTitle ?? "Search for local food"),
      rest: node.kind === "shade" ? "Rest in the shade" : "Rest where you are",
      shelter: `Take cover in ${node.label.toLowerCase()}`,
      drink: `Drink at ${node.label.toLowerCase()}`,
      evade: "Stay hidden and listen",
      care: "Provision your dependent young",
    };
    result.push({
      id: action,
      title: title[action],
      detail:
        action === "feed"
          ? `Food depends on resources at ${node.label.toLowerCase()}.`
          : action === "rest"
            ? "Recover energy while hunger and time continue."
            : action === "drink"
              ? "Local water is finite; the water’s edge may attract predators."
              : "A full phase passes. Condition, weather and nearby animals still matter.",
      action,
    });
  }
  if (actions.includes("explore"))
    result.push({
      id: "explore",
      title: "Read the signs around you",
      detail:
        "Learn this location and notice its inhabitants without leaving it.",
      action: "explore",
    });
  return result;
}
export function applyInteraction(
  s: GameState,
  interaction: Interaction,
): string {
  const a = player(s),
    local = s.area!,
    target = local.animals.find((n) => n.id === interaction.target),
    patch = s.world!.patches.find((p) => p.id === s.world!.activePatch)!;
  if (interaction.id.startsWith("biology:"))
    return applyBiologyActivity(
      s,
      interaction.id.slice(8) as BiologyActivityId,
    );
  switch (interaction.id) {
    case "nurse":
      if (!target?.alive)
        throw new Error("Your caregiver is no longer available.");
      target.hunger = clamp(target.hunger + 9);
      target.energy = clamp(target.energy - 7);
      target.bond = clamp(target.bond + 3);
      return `${target.name} provides what her condition allows. Nursing also costs her energy and food.`;
    case "stay-close":
      if (target) {
        target.bond = clamp(target.bond + 5);
        a.stats.bond = clamp(a.stats.bond + 3);
        a.stats.stress = clamp(a.stats.stress - 4);
      }
      return `You remain beside ${target?.name}. Familiar company steadies you as the phase passes.`;
    case "groom":
      if (target) {
        target.bond = clamp(target.bond + 8);
        target.energy = clamp(target.energy + 4);
        target.injury = clamp(target.injury - 1);
      }
      return `Time with ${target?.name} strengthens an individual relationship, beyond the wider social bond.`;
    case "tend-garden":
      {
        const used = Math.min(20, a.biology!.stores.substrate);
        a.biology!.stores.substrate -= used;
        a.biology!.stores.fungus = clamp(a.biology!.stores.fungus + used * 0.8);
        a.biology!.skills["garden-tended"] = clamp(
          (a.biology!.skills["garden-tended"] ?? 0) + 1,
        );
      }
      s.world!.patches.find((p) => p.id === "home")!.food = unit(
        s.world!.patches.find((p) => p.id === "home")!.food + 0.06,
      );
      a.colonyService += 2;
      a.stats.energy -= 4;
      return "Garden work improves the colony’s persistent food stores. The work costs energy.";
    case "cut-leaves":
      a.biology!.stores.substrate = clamp(
        a.biology!.stores.substrate + patch.food * 25,
      );
      a.biology!.skills["leaves-harvested"] = clamp(
        (a.biology!.skills["leaves-harvested"] ?? 0) + 1,
      );
      patch.food = unit(patch.food - 0.03);
      a.colonyService += 2;
      a.stats.energy -= 5;
      return "Leaf substrate reaches the colony. Gardening must convert these stores into fungal food.";
    case "track-prey":
      a.stats.energy -= Math.max(
        1,
        7 -
          nearby(s).filter(
            (n) =>
              n.species === speciesById(a.speciesId).name &&
              ["companion", "mother"].includes(n.role) &&
              n.bond > 40,
          ).length *
            2,
      );
      a.experience!.foraging = clamp(a.experience!.foraging + 1);
      return "You commit energy to the deer’s trail; a meal still depends on the hunt.";
    case "mark-boundary":
      a.experience!.habitatKnowledge = clamp(
        a.experience!.habitatKnowledge + 2,
      );
      a.stats.energy -= 3;
      return "You learn the boundary and leave your scent. This remains contested ground.";
    default:
      return "";
  }
}
export function careFactor(s: GameState) {
  if (!dependent(s) || immobile(s)) return 1;
  const mother = nearby(s).find((n) => n.role === "mother");
  return mother
    ? unit(
        (mother.health / 100) *
          (1 - mother.hunger / 130) *
          (0.4 + mother.bond / 140),
      )
    : 0.15;
}
export function tickAnimals(s: GameState): string[] {
  const area = s.area!,
    a = player(s),
    sp = speciesById(a.speciesId),
    messages: string[] = [];
  area.ticks++;
  // Mirror actual bloodline members instead of duplicating their independent mortality model.
  for (const id of a.children) {
    const child = s.family[id];
    if (!area.animals.some((n) => n.familyId === id))
      area.animals.push({
        id: `family:${id}`,
        familyId: id,
        name: child.name,
        species: sp.name,
        role: "offspring",
        ageDays: child.ageDays,
        stage: "Young",
        health: child.stats.health,
        hunger: child.stats.hunger,
        energy: child.stats.energy,
        injury: child.stats.injury,
        bond: 60,
        location: s.world!.activePatch,
        priority: "protect",
        alive: child.alive,
        reproductive: false,
        offspring: 0,
        lastBirthDay: area.ticks,
      });
  }
  for (const n of area.animals) {
    if (n.familyId) {
      const relative = s.family[n.familyId];
      if (relative) {
        n.alive = relative.alive;
        n.ageDays = relative.ageDays;
        n.health = relative.stats.health;
        n.stage = [...sp.stages]
          .reverse()
          .find((st) => n.ageDays >= st.fromDay)!.name;
      }
      continue;
    }
    if (!n.alive) continue;
    n.hunger = clamp(n.hunger + 5);
    n.energy = clamp(n.energy - 3);
    if (area.ticks % 4 === 0) {
      n.ageDays++;
      if (n.species === sp.name)
        n.stage = [...sp.stages]
          .reverse()
          .find((st) => n.ageDays >= st.fromDay)!.name;
    }
    const patch = s.world!.patches.find((p) => p.id === n.location)!;
    n.priority =
      n.energy < 30 || n.injury > 25
        ? "rest"
        : n.hunger > 45
          ? "feed"
          : n.role === "mother" && dependent(s)
            ? "protect"
            : "roam";
    if (n.priority === "rest") {
      n.energy = clamp(n.energy + 23);
      n.injury = clamp(n.injury - 0.7);
    } else if (n.priority === "feed") {
      n.hunger = clamp(n.hunger - patch.food * 25);
      patch.food = unit(patch.food - 0.002);
      if (patch.food < 0.3) {
        const links = area.nodes.find((x) => x.id === n.location)!.links;
        n.location = links[Math.floor(random(area) * links.length)];
      }
    } else if (n.priority === "protect") {
      if (random(area) < 0.12)
        n.location = nextLocalStep(area, n.location, s.world!.activePatch);
    } else if (random(area) < 0.28 && (n.engagedUntil ?? 0) < area.ticks) {
      const links = area.nodes.find((x) => x.id === n.location)!.links;
      n.location = links[Math.floor(random(area) * links.length)];
    }
    if (n.hunger > 80) n.health -= 3;
    if (n.injury > 0) n.health -= n.injury / 90;
    const risk =
      (n.role === "prey" ? 0.002 : sp.risk / 5) * (1 + s.world!.predators);
    if (random(area) < risk) {
      n.injury = clamp(n.injury + 25);
      n.health -= 20;
    }
    if (
      n.health <= 0 ||
      (n.species === sp.name && n.ageDays >= sp.maxLifespan) ||
      random(area) < risk * 0.1
    ) {
      n.alive = false;
      n.health = 0;
      if (n.bond > 50)
        messages.push(
          `${n.name} has died. Their absence changes the local social world.`,
        );
    }
    // Coarse background reproduction only in favorable conditions, bounded independently of family rewards.
    if (
      n.alive &&
      n.reproductive &&
      n.hunger < 45 &&
      n.health > 60 &&
      area.ticks - n.lastBirthDay > sp.gestation * 4 + 120 &&
      random(area) < 0.001 &&
      area.animals.length < 16
    ) {
      n.offspring++;
      n.lastBirthDay = area.ticks;
      area.animals.push({
        ...n,
        id: `${n.id}:young:${n.offspring}`,
        name: `${n.name}’s young`,
        role: "offspring",
        ageDays: 0,
        stage: "Young",
        health: 85,
        hunger: 25,
        energy: 75,
        bond: 10,
        injury: 0,
        reproductive: false,
        offspring: 0,
        lastBirthDay: area.ticks,
        priority: "protect",
      });
      messages.push(`${n.name} is raising a new cohort nearby.`);
    }
    n.health = clamp(n.health);
  }
  const active = area.encounter;
  if (
    active?.status === "active" &&
    (!area.animals.find((n) => n.id === active.animalId)?.alive ||
      area.animals.find((n) => n.id === active.animalId)?.location !==
        active.location ||
      active.location !== s.world!.activePatch ||
      area.ticks - active.beganDay > 4)
  ) {
    active.status = "resolved";
    active.outcome = "The encounter passes as circumstances change.";
    active.cooldownUntil = area.ticks + 4;
  }
  if (
    !area.encounter ||
    (area.encounter.status === "resolved" &&
      area.ticks >= area.encounter.cooldownUntil)
  ) {
    const candidates = nearby(s).filter(
      (n) =>
        ["predator", "prey", "rival", "mate", "companion"].includes(n.role) &&
        (n.role !== "mate" || a.ageDays >= sp.adultDay) &&
        (n.role !== "prey" || a.ageDays >= 365),
    );
    const other = candidates.sort(
      (x, y) =>
        ["predator", "rival", "prey", "mate", "companion"].indexOf(x.role) -
        ["predator", "rival", "prey", "mate", "companion"].indexOf(y.role),
    )[0];
    if (
      other &&
      (!dependent(s) || other.role === "companion") &&
      random(area) < (other.role === "companion" ? 0.12 : 0.45)
    )
      area.encounter = {
        id: `${a.id}:enc:${area.ticks}`,
        animalId: other.id,
        kind: other.role as
          | "predator"
          | "prey"
          | "rival"
          | "mate"
          | "companion",
        location: s.world!.activePatch,
        beganDay: area.ticks,
        cooldownUntil: area.ticks + 8,
        status: "active",
      };
  }
  return messages;
}
function nextLocalStep(area: LocalArea, from: string, to: string): string {
  const queue = [{ at: from, first: from }],
    seen = new Set([from]);
  while (queue.length) {
    const item = queue.shift()!;
    if (item.at === to) return item.first;
    for (const id of area.nodes.find((n) => n.id === item.at)!.links)
      if (!seen.has(id)) {
        seen.add(id);
        queue.push({ at: id, first: item.at === from ? id : item.first });
      }
  }
  return from;
}
export type ResponseId =
  | "retreat"
  | "observe"
  | "approach"
  | "hunt"
  | "challenge"
  | "court";
export function encounterResponses(
  s: GameState,
): { id: ResponseId; title: string; action: Action }[] {
  const e = s.area?.encounter;
  if (e?.status !== "active") return [];
  const responses: { id: ResponseId; title: string; action: Action }[] = [
    { id: "observe", title: "Keep a cautious distance", action: "shelter" },
  ];
  if (!dependent(s))
    responses.push({
      id: "retreat",
      title: "Withdraw into cover",
      action: "evade",
    });
  if (
    e.kind === "companion" &&
    speciesById(player(s).speciesId).behavior?.socialAction !== false
  )
    responses.push({
      id: "approach",
      title: "Approach peacefully",
      action: dependent(s) ? "shelter" : "socialize",
    });
  if (
    !dependent(s) &&
    e.kind === "prey" &&
    player(s).speciesId === "wolf" &&
    player(s).ageDays >= 365
  )
    responses.push({ id: "hunt", title: "Attempt the hunt", action: "feed" });
  if (!dependent(s) && e.kind === "rival" && player(s).stats.energy > 45)
    responses.push({
      id: "challenge",
      title: "Stand your ground",
      action: "explore",
    });
  const a = player(s),
    sp = speciesById(a.speciesId);
  if (
    e.kind === "mate" &&
    sp.reproductive &&
    a.ageDays >= sp.adultDay &&
    !a.pregnantUntil &&
    a.stats.health > 50 &&
    a.stats.hunger < 65 &&
    a.stats.bond >= (sp.behavior?.minBreedingBond ?? 0) &&
    reproductionPossible(s) &&
    (a.lastReproduction === undefined ||
      (!sp.behavior?.terminalBreeding &&
        a.ageDays - a.lastReproduction >=
          (sp.behavior?.breedingInterval ?? 365)))
  )
    responses.push({
      id: "court",
      title: "Approach a potential mate",
      action: "mate",
    });
  return responses;
}
export function sceneState(s: GameState) {
  const a = player(s),
    node = locationNow(s),
    sp = speciesById(a.speciesId);
  const palette =
    sp.water === "marine" || a.speciesId === "seal"
      ? "marine"
      : a.speciesId === "ant"
        ? "colony"
        : s.environment!.location.climate === "arid" ||
            a.speciesId === "elephant"
          ? "savanna"
          : /steppe|tundra/i.test(s.environment!.location.habitat)
            ? "grassland"
            : "woodland";
  return {
    palette,
    phase: ["morning", "afternoon", "evening", "night"][s.phase],
    rain: (s.world?.precipitation ?? 0) > 3,
    season: s.world!.season,
    node,
    dependent: dependent(s),
    temperature: phaseTemperature(s),
  };
}
