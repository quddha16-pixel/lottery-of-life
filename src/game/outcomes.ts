import { speciesById } from "../data/species";
import type { GameState, Stats } from "./types";

const labels: Record<string, string> = {
  health: "Health",
  hunger: "Hunger",
  hydration: "Water",
  energy: "Energy",
  injury: "Injury",
  bond: "Family bond",
  substrate: "Leaf material",
  fungus: "Garden food",
  contamination: "Garden waste",
  leafLoad: "Carried leaves",
  pollen: "Carried pollen",
  broodFood: "Brood food",
  nectar: "Nest nectar",
  fiber: "Digestive food",
  burrow: "Warren cover",
  coordination: "Pack coordination",
  mud: "Mud protection",
  groundwater: "Groundwater",
  plumage: "Feather condition",
  nest: "Nest shelter",
  camouflage: "Camouflage",
  den: "Den cover",
  vigilance: "Group warning",
  help: "Helping",
  skin: "Skin moisture",
  dexterity: "Dexterity",
  parcel: "Carried food",
  fat: "Night reserves",
  territory: "Territory",
  diveRecovery: "Dive recovery",
};
export function snapshot(s: GameState) {
  const a = s.family[s.currentId!];
  return {
    serial: s.serial,
    stats: { ...a.stats },
    stores: { ...a.biology?.stores },
    experience: { ...a.experience },
    age: a.ageDays,
    stage: a.biology?.stage,
    location: s.world?.activePatch,
    bonds: Object.fromEntries(
      (s.area?.animals ?? []).map((n) => [
        n.id,
        { name: n.name, value: n.bond, alive: n.alive },
      ]),
    ),
    children: Object.fromEntries(
      a.children.map((id) => [id, !!s.family[id]?.alive]),
    ),
  };
}
export function recordOutcome(
  s: GameState,
  before: ReturnType<typeof snapshot>,
  command: string,
  summary: string,
  phases: number,
) {
  if (!s.area || !s.currentId) return s;
  const a = s.family[s.currentId],
    changes: string[] = [],
    losses: string[] = [];
  const compare = (
    old: Record<string, number>,
    next: Record<string, number>,
    keys: string[],
  ) => {
    for (const key of keys) {
      const delta = Math.round((next[key] ?? 0) - (old[key] ?? 0));
      if (delta)
        changes.push(`${labels[key] ?? key}: ${delta > 0 ? "+" : ""}${delta}`);
    }
  };
  // Species resources first: collecting leaves is useful even without a meal.
  compare(
    before.stores,
    a.biology?.stores ?? {},
    Object.keys(a.biology?.stores ?? {}).filter((k) => labels[k]),
  );
  compare({ ...before.stats }, { ...a.stats }, [
    "health",
    "hunger",
    "hydration",
    "energy",
    "injury",
  ] satisfies (keyof Stats)[]);
  if (s.world?.activePatch !== before.location)
    changes.unshift(
      `Arrived: ${s.area.nodes.find((n) => n.id === s.world?.activePatch)?.label}`,
    );
  for (const n of s.area.animals) {
    const old = before.bonds[n.id];
    if (old && Math.round(n.bond - old.value))
      changes.push(
        `${n.name}'s trust: ${n.bond > old.value ? "+" : ""}${Math.round(n.bond - old.value)}`,
      );
    if (old?.alive && !n.alive) {
      changes.unshift(`${n.name} died`);
      losses.push(`${n.name} has died.`);
    }
  }
  for (const id of Object.keys(before.children)) {
    const child = s.family[id];
    if (before.children[id] && child && !child.alive) {
      changes.unshift(`${child.name} died`);
      losses.push(`${child.name} has died.`);
    }
  }
  if (
    (a.experience?.foraging ?? 0) > (before.experience.foraging ?? 0) &&
    command.toLowerCase().includes("learn")
  )
    changes.unshift("Foraging familiarity grows");
  if (a.ageDays > before.age)
    changes.unshift(
      `${a.ageDays - before.age} day${a.ageDays - before.age === 1 ? "" : "s"} passed`,
    );
  if (a.biology?.stage !== before.stage)
    changes.unshift(`Now: ${a.biology?.stage}`);
  let final = a.alive
    ? summary
    : (s.journal.findLast((e) => e.individualId === a.id && e.kind === "death")
        ?.text ?? summary);
  const danger = s.journal.findLast(
    (e) => e.id > before.serial && e.kind === "danger",
  );
  if (a.alive && danger && !final.includes(danger.text))
    final = `${danger.text} ${final}`;
  if (a.alive) {
    const unseenLosses = losses.filter((text) => !final.includes(text));
    if (unseenLosses.length) final = `${unseenLosses.join(" ")} ${final}`;
  }
  s.area.feedback = final;
  s.area.outcome = {
    command,
    summary: final,
    changes: changes.slice(0, 10),
    phases,
  };
  return s;
}
export function familyLoss(s: GameState, before: ReturnType<typeof snapshot>) {
  return (
    s.area?.animals.some(
      (n) =>
        ["mother", "companion"].includes(n.role) &&
        before.bonds[n.id]?.alive &&
        !n.alive,
    ) ||
    Object.keys(before.children).some(
      (id) => before.children[id] && !s.family[id]?.alive,
    )
  );
}
export function urgentNeed(s: GameState): string | undefined {
  const a = s.family[s.currentId!];
  if (!a?.alive) return;
  const r = a.biology?.stores ?? {};
  const sp = speciesById(a.speciesId);
  const dependent = [...sp.stages]
    .reverse()
    .find((stage) => a.ageDays >= stage.fromDay)!.dependent;
  if (a.stats.hydration < 35)
    return dependent && /mammal/i.test(sp.group)
      ? "You need fluids. Ask your caregiver for food and fluids; being beside water is not enough."
      : "You need fluids soon. Find a safe source of water or suitable food.";
  if (a.stats.hunger > 70)
    return "You need food soon. A meal depends on the resources and help available.";
  if (a.stats.health < 35 || a.stats.injury > 25)
    return "You are hurt or weakened. Food and safe rest matter now.";
  if (a.speciesId === "ant" && (r.fungus < 30 || r.contamination > 70))
    return "The garden needs help. Clear waste, then use leaf material to grow food.";
  if (a.speciesId === "bumblebee" && r.broodFood < 20)
    return "Colony food is running low. Workers need to bring pollen home.";
  if (a.speciesId === "robin" && r.fat < 15 && s.phase >= 2)
    return dependent
      ? "Night reserves are low. Ask a parent for food; you cannot forage alone yet."
      : "Night reserves are low. Feed while it is safe, or choose a sheltered roost.";
  if (
    a.speciesId === "bullfrog" &&
    a.ageDays < 365 &&
    (s.world?.water ?? 1) < 0.25
  )
    return "The pond is drying. Aquatic young cannot survive on dry ground.";
  if (a.stats.energy < 20)
    return "You are exhausted. Choose safe rest before another demanding journey.";
}
