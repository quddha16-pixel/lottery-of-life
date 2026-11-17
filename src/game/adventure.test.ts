import { describe, it, expect } from "vitest";
import { SPECIES } from "../data/species";
import { ADVENTURES } from "../data/adventures";
import { adventure, recommended } from "./adventure";
import {
  act,
  advanceToOpportunity,
  availableActions,
  createGame,
  current,
  interact,
  startLife,
  travel,
  respondToEncounter,
} from "./engine";
import { interactions } from "./wildlife";
import { deserialize, serialize } from "./storage";
const born = (speciesId: string) => {
  const base = createGame();
  if (!base.unlocked.includes(speciesId)) base.unlocked.push(speciesId);
  return startLife(base, { speciesId, seed: "audit-new-" + speciesId });
};
describe("Phase 3C openings and connected decisions", () => {
  it("covers exactly the thirteen current species, including bumblebee, with real saved-resource explanations", () => {
    expect(Object.keys(ADVENTURES).sort()).toEqual(
      SPECIES.map((s) => s.id).sort(),
    );
    for (const sp of SPECIES) {
      const s = born(sp.id),
        field = adventure(s);
      expect(field.profile.goal.length).toBeGreaterThan(12);
      for (const r of field.stocks)
        expect(current(s)!.biology!.stores).toHaveProperty(r.key);
    }
  });
  it.each(["ant", "bumblebee"])(
    "advances %s through its real brood stages without editing age or giving it adult actions",
    (species) => {
      let s = born(species),
        clicks = 0;
      const end = species === "ant" ? 60 : 25;
      expect(adventure(s).immobile).toBe(true);
      expect(
        interactions(s, availableActions(s)).every((o) =>
          ["wait", "rest"].includes(o.id),
        ),
      ).toBe(true);
      for (
        ;
        clicks < 12 && current(s)!.alive && current(s)!.ageDays < end;
        clicks++
      ) {
        s =
          s.area?.encounter?.status === "active" &&
          s.area.encounter.kind !== "companion"
            ? respondToEncounter(s, "observe")
            : advanceToOpportunity(s).state;
      }
      expect(current(s)!.alive).toBe(true);
      expect(current(s)!.ageDays).toBe(end);
      expect(clicks).toBeLessThanOrEqual(6);
      expect(current(s)!.biology!.milestones).toHaveLength(3);
      expect(adventure(s).immobile).toBe(false);
      expect(JSON.parse(serialize(deserialize(serialize(s))))).toEqual(
        JSON.parse(serialize(s)),
      );
    },
  );
  it("stops observation at actual death rather than granting nursery immunity", () => {
    const s = born("bullfrog");
    s.world!.water = 0;
    current(s)!.stats.health = 1;
    const next = advanceToOpportunity(s);
    expect(current(next.state)!.alive).toBe(false);
    expect(next.phases).toBe(1);
    expect(advanceToOpportunity(next.state).state).toEqual(next.state);
  });
  it("exposes sensory learning when the engine authorizes it and persists the real experience", () => {
    let s = born("wolf");
    s = advanceToOpportunity(s).state;
    expect(current(s)!.ageDays).toBe(6);
    const learn = interactions(s, availableActions(s)).find(
      (o) => o.id === "learn",
    );
    expect(learn?.title).toMatch(/familiar scents/);
    const old = current(s)!.experience!.foraging;
    s = interact(s, "learn");
    expect(current(s)!.experience!.foraging).toBeGreaterThan(old);
    expect(() => deserialize(serialize(s))).not.toThrow();
  });
  it("prioritizes an urgent need over optional biological activities", () => {
    const s = born("elephant");
    current(s)!.stats.hydration = 10;
    const choices = recommended(s, interactions(s, availableActions(s)));
    expect(choices[0].id).toBe("nurse");
  });
  it("uses different connected route graphs, with reciprocal links and no isolated nodes", () => {
    const graphs = new Set<string>();
    for (const sp of SPECIES) {
      const s = born(sp.id),
        nodes = s.area!.nodes;
      graphs.add(JSON.stringify(nodes.map((n) => [n.id, n.links])));
      const seen = new Set(["home"]);
      for (let i = 0; i < nodes.length; i++)
        for (const n of nodes)
          if (seen.has(n.id))
            for (const link of n.links) {
              seen.add(link);
              expect(nodes.find((x) => x.id === link)!.links).toContain(n.id);
            }
      expect(seen.size).toBe(nodes.length);
    }
    expect(graphs.size).toBeGreaterThanOrEqual(4);
  });
  it("reveals new routes through actual travel while keeping old saved maps visible", () => {
    let s = born("elephant");
    s = advanceToOpportunity(s).state;
    expect(adventure(s).visible.has("edge")).toBe(false);
    const old = structuredClone(s);
    delete current(old)!.biology!.skills["visit:home"];
    const loaded = deserialize(serialize(old));
    expect(adventure(loaded).visible.size).toBe(5);
    const movedOld = travel(loaded, "water");
    expect(adventure(movedOld).visible.size).toBe(5);
    const moved = travel(s, "water");
    expect(adventure(moved).known).toContain("water");
    expect(moved.world!.activePatch).toBe("water");
    expect(current(moved)!.experience!.habitatKnowledge).toBeGreaterThan(
      current(s)!.experience!.habitatKnowledge,
    );
  });
  it("inspection and recommendations are read-only and do not consume random state", () => {
    const s = born("mallard"),
      before = structuredClone(s);
    adventure(s);
    recommended(s, interactions(s, availableActions(s)));
    expect(s).toEqual(before);
    // A biological action still pays an actual phase and resource cost.
    expect(act(s, "rest").phase).toBe(1);
  });
});
