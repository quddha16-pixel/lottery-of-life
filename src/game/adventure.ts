import { nextMoment } from "./development";
import { ADVENTURES } from "../data/adventures";
import { speciesById } from "../data/species";
import {
  dependent,
  interactions,
  locationNow,
  nearby,
  travelEligibility,
} from "./wildlife";
import { urgentNeed } from "./outcomes";
import type { GameState } from "./types";
import type { Interaction } from "./wildlife";

export function adventure(s: GameState) {
  const a = s.family[s.currentId!],
    profile = ADVENTURES[a.speciesId];
  const moment = nextMoment(s);
  const stage = [...speciesById(a.speciesId).stages]
    .reverse()
    .find((x) => a.ageDays >= x.fromDay)!;
  const stocks = profile.stocks.map(([key, label]) => ({
    key,
    label,
    value:
      (key === "den"
        ? a.biology?.stores[`den:${s.world?.activePatch}`]
        : a.biology?.stores[key]) ?? 0,
  }));
  const known = Object.keys(a.biology?.skills ?? {})
    .filter((k) => k.startsWith("visit:"))
    .map((k) => k.slice(6));
  const mapStarted = known.length > 0 && !a.biology?.skills["map:legacy"];
  const visible = mapStarted
    ? new Set(
        known.flatMap((id) => [
          id,
          ...(s.area?.nodes.find((n) => n.id === id)?.links ?? []),
        ]),
      )
    : new Set(s.area?.nodes.map((n) => n.id));
  const memory = Object.keys(a.biology?.skills ?? {}).filter(
    (k) => k.startsWith("water:") || k.startsWith("route:"),
  );
  return {
    profile,
    moment,
    stage,
    stocks,
    visible,
    known,
    memory,
    immobile: ["Egg", "Larva", "Pupa"].includes(stage.name),
    introduction:
      a.speciesId === "wolf" && a.ageDays >= 21 && dependent(s)
        ? "You can follow capable family beyond the den. Food and safety still depend on the pack."
        : dependent(s) || a.ageDays < (profile.moments[0]?.[0] ?? 0)
          ? profile.nursery
          : profile.clue,
    urgent: urgentNeed(s),
    location: locationNow(s),
    companions: nearby(s).filter((n) =>
      ["mother", "companion"].includes(n.role),
    ),
  };
}
export function recommended(s: GameState, options: Interaction[]) {
  const a = s.family[s.currentId!];
  const score = (o: Interaction) => {
    let n =
      o.id.startsWith("biology:") ||
      ["cut-leaves", "tend-garden"].includes(o.id)
        ? 40
        : 0;
    if (a.stats.hydration < 45 && ["nurse", "drink", "feed"].includes(o.id))
      n += 200;
    if (a.stats.hunger > 55 && o.action === "feed") n += 150;
    if (a.stats.energy < 35 && o.action === "rest") n += 150;
    if (
      a.speciesId === "ant" &&
      a.biology!.stores.contamination > 40 &&
      o.id === "biology:clear-waste"
    )
      n += 120;
    if (
      a.speciesId === "ant" &&
      a.biology!.stores.fungus < 40 &&
      o.id === "tend-garden"
    )
      n += 90;
    if (o.id === "learn")
      n += (a.biology!.skills["early-learning"] ?? 0) < 1 ? 42 : 5;
    if (o.id === "biology:clear-waste" && a.biology!.stores.contamination <= 35)
      n -= 30;
    if (o.id === "follow-group") n += 35;
    if (o.id === "nurse") n += 30;
    if (o.id === "stay-close" || o.id === "rest") n += 15;
    return n;
  };
  return options
    .map((o, i) => ({ o, i, n: score(o) }))
    .sort((x, y) => y.n - x.n || x.i - y.i)
    .map((x) => x.o);
}
export function sceneChoices(
  s: GameState,
  actions: Parameters<typeof interactions>[1],
  target: "animal" | "resource" | "family",
) {
  const all = interactions(s, actions);
  return recommended(
    s,
    all.filter((o) =>
      target === "family"
        ? ["nurse", "stay-close", "follow-group", "groom"].includes(o.id)
        : target === "resource"
          ? o.id.startsWith("biology:") ||
            ["feed", "drink", "tend-garden", "cut-leaves"].includes(o.id)
          : true,
    ),
  );
}

/** A real adjacent journey into the species loop, never a teleport or a forced action. */
export function suggestedJourney(s: GameState) {
  const a = s.family[s.currentId!],
    r = a.biology!.stores,
    here = s.world!.activePatch;
  if (dependent(s) || a.stats.energy < 30 || a.stats.injury > 50) return;
  let target: string | undefined;
  if (a.stats.hydration < 35) target = "water";
  else
    switch (a.speciesId) {
      case "bumblebee":
        target =
          r.pollen > 5
            ? "home"
            : ["home", "shade"].includes(here)
              ? "forage"
              : undefined;
        break;
      case "ant":
        target =
          r.leafLoad > 0
            ? "home"
            : ["home", "shade"].includes(here) &&
                r.fungus > 35 &&
                r.contamination < 50
              ? "forage"
              : undefined;
        break;
      case "rabbit":
        target =
          r.fiber > 5
            ? ["home", "shade"].includes(here)
              ? undefined
              : "home"
            : "forage";
        break;
      case "wolf":
        target = here === "home" ? "forage" : undefined;
        break;
      case "elephant":
        target =
          a.stats.hydration < 60 ||
          (s.environment!.temperature > 30 && r.mud < 5)
            ? "water"
            : undefined;
        break;
      case "mallard":
        target = here === "home" ? "water" : undefined;
        break;
      case "octopus":
        target =
          a.ageDays < 60
            ? "forage"
            : r[`den:${here}`] > 0
              ? undefined
              : "shade";
        break;
      case "meerkat":
        target = here === "home" ? "forage" : undefined;
        break;
      case "bullfrog":
        target =
          a.ageDays < 365 ? "forage" : here === "home" ? "shade" : undefined;
        break;
      case "raccoon":
        target =
          here === "home"
            ? "water"
            : here === "water" && (a.biology!.skills["aquatic-search"] ?? 0) > 0
              ? "forage"
              : undefined;
        break;
      case "fox":
        target =
          r.parcel > 5 ? "shade" : here === "home" ? "forage" : undefined;
        break;
      case "robin":
        target =
          s.phase >= 2 && r.fat > 40
            ? "shade"
            : r.fat < 60
              ? "forage"
              : undefined;
        break;
      case "seal":
        target =
          r.diveRecovery < 40
            ? "home"
            : ["home", "shade"].includes(here)
              ? "forage"
              : undefined;
        break;
    }
  if (!target || target === here) return;
  const queue = [[here]],
    seen = new Set([here]);
  let path: string[] | undefined;
  while (queue.length) {
    const route = queue.shift()!;
    if (route.at(-1) === target) {
      path = route;
      break;
    }
    for (const id of s.area!.nodes.find((n) => n.id === route.at(-1))!.links)
      if (!seen.has(id)) {
        seen.add(id);
        queue.push([...route, id]);
      }
  }
  const next = path?.[1];
  if (!next) return;
  const eligibility = travelEligibility(s, next);
  if (!eligibility.allowed) return;
  return {
    node: s.area!.nodes.find((n) => n.id === next)!,
    destination: target,
    ...eligibility,
  };
}
