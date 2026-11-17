import { ADVENTURES } from "../data/adventures";
import { speciesById } from "../data/species";
import { dependent, interactions, locationNow, nearby } from "./wildlife";
import { urgentNeed } from "./outcomes";
import type { GameState } from "./types";
import type { Interaction } from "./wildlife";

export function adventure(s: GameState) {
  const a = s.family[s.currentId!],
    profile = ADVENTURES[a.speciesId];
  const moment = profile.moments.find(([age]) => age > a.ageDays);
  const stage = [...speciesById(a.speciesId).stages]
    .reverse()
    .find((x) => a.ageDays >= x.fromDay)!;
  const stocks = profile.stocks.map(([key, label]) => ({
    key,
    label,
    value: a.biology?.stores[key] ?? 0,
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
    introduction: dependent(s) ? profile.nursery : profile.clue,
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
    if (o.id === "learn") n += 42;
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
