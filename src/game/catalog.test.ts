import { describe, expect, it } from "vitest";
import { SPECIES } from "../data/species";
import {
  availableActions,
  act,
  advanceToOpportunity,
  createGame,
  current,
  interact,
  startLife,
  travel,
} from "./engine";
import {
  biologyActivities,
  speciesAchievementProgress,
  speciesAchievements,
} from "./biology";
import { interactions, travelEligibility } from "./wildlife";
import { suggestedJourney } from "./adventure";
import { nextMoment } from "./development";
import { deserialize, serialize } from "./storage";

const born = (id: string) => {
  const base = createGame();
  if (!base.unlocked.includes(id)) base.unlocked.push(id);
  return startLife(base, { speciesId: id, seed: "audit-new-" + id });
};
// Prepared ages/conditions below isolate rules. Fresh-life browser tests separately
// exercise ordinary development without modifying age, stocks or weather.
describe("Phase 3C connected species decisions", () => {
  it("requires a finite ant load to travel back before the colony receives it", () => {
    let s = born("ant");
    current(s)!.ageDays = 60;
    s.world!.activePatch = "forage";
    current(s)!.biology!.stores.leafLoad = 95;
    expect(
      interactions(s, availableActions(s)).some((x) => x.id === "cut-leaves"),
    ).toBe(false);
    current(s)!.biology!.stores.leafLoad = 0;
    s.world!.patches.find((x) => x.id === "forage")!.food = 0;
    expect(() => interact(s, "cut-leaves")).toThrow(/no longer possible/);
    s.world!.patches.find((x) => x.id === "forage")!.food = 1;
    const stock = current(s)!.biology!.stores.substrate;
    s = interact(s, "cut-leaves");
    // Other workers still add a small background trickle. Our harvest stays carried.
    expect(current(s)!.biology!.stores.substrate - stock).toBeLessThan(1);
    const load = current(s)!.biology!.stores.leafLoad;
    expect(load).toBeGreaterThan(0);
    const route = suggestedJourney(s)!;
    expect(route.node.id).toBe("home");
    s = travel(s, route.node.id);
    expect(current(s)!.biology!.stores.leafLoad).toBe(0);
    expect(current(s)!.biology!.stores.substrate).toBeGreaterThan(stock);
    expect(s.area!.outcome!.summary).toMatch(/deliver leaf material/);
  });
  it("initializes only missing carried leaves when loading an existing version-3 ant", () => {
    const s = born("ant");
    s.coins = 73;
    delete current(s)!.biology!.stores.leafLoad;
    current(s)!.biology!.stores.fungus = 32;
    const before = structuredClone(s),
      loaded = deserialize(serialize(s));
    expect(current(loaded)!.biology!.stores.leafLoad).toBe(0);
    delete current(loaded)!.biology!.stores.leafLoad;
    expect(loaded).toEqual(before);
  });
  it("lets an older dependent elephant help at water only with capable relatives and real costs", () => {
    let s = born("elephant");
    s.world!.activePatch = "water";
    for (const n of s.area!.animals.filter((n) =>
      ["mother", "companion"].includes(n.role),
    )) {
      n.location = "water";
      n.energy = 90;
    }
    const ids = () => biologyActivities(s).map((x) => x.id);
    expect(ids()).not.toContain("wallow");
    expect(ids()).not.toContain("dig-water");
    current(s)!.ageDays = 30;
    expect(ids()).toContain("wallow");
    expect(ids()).not.toContain("dig-water");
    current(s)!.ageDays = 365;
    s.world!.moisture = 0.6;
    expect(ids()).toContain("dig-water");
    const relative = s.area!.animals.find((n) => n.role === "mother")!,
      oldEnergy = relative.energy,
      stock = current(s)!.biology!.stores.groundwater;
    s = interact(s, "biology:dig-water");
    expect(current(s)!.biology!.stores.groundwater).toBeLessThan(stock);
    expect(
      s.area!.animals.find((n) => n.id === relative.id)!.energy,
    ).toBeLessThan(oldEnergy - 5);
    for (const n of s.area!.animals) n.energy = 0;
    expect(ids()).not.toContain("dig-water");
    expect(ids()).not.toContain("wallow");
  });
  it("lets a nestling build real night reserves from parental food without adult foraging", () => {
    const s = born("robin");
    current(s)!.biology!.stores.fat = 0;
    const next = act(s, "feed");
    expect(
      next.journal.some((e) => e.text.includes("nursery provides nourishment")),
    ).toBe(true);
    expect(current(next)!.biology!.stores.fat).toBeGreaterThan(0);
    expect(biologyActivities(s).map((x) => x.id)).not.toContain(
      "build-reserves",
    );
    expect(s.coins).toBe(next.coins);
  });
  it("suggests only eligible adjacent legs and preserves the complete state during inspection", () => {
    for (const sp of SPECIES) {
      const s = born(sp.id);
      current(s)!.ageDays = sp.adultDay;
      const before = structuredClone(s),
        trip = suggestedJourney(s);
      if (trip) {
        expect(
          s.area!.nodes.find((n) => n.id === s.world!.activePatch)!.links,
        ).toContain(trip.node.id);
        expect(travelEligibility(s, trip.node.id).allowed).toBe(true);
      }
      expect(s).toEqual(before);
    }
  });
  it("uses the actual pending family/development date and stops observation at caregiver loss", () => {
    const s = born("elephant");
    current(s)!.ageDays = 1500;
    current(s)!.pregnantUntil = 1502;
    expect(nextMoment(s)).toEqual([1502, "Young may arrive"]);
    const calf = born("elephant"),
      mother = calf.area!.animals.find((n) => n.role === "mother")!;
    mother.health = 0;
    const next = advanceToOpportunity(calf);
    expect(next.phases).toBe(1);
    expect(
      next.state.area!.animals.find((n) => n.id === mother.id)!.alive,
    ).toBe(false);
    expect(next.state.area!.outcome!.changes).toContain(`${mother.name} died`);
    expect(next.state.area!.feedback).toMatch(/died/);
  });
  it("exposes the same per-species mastery conditions that settle rewards, without granting currency", () => {
    for (const sp of SPECIES) {
      const s = born(sp.id),
        a = current(s)!,
        before = structuredClone(s),
        steps = speciesAchievementProgress(a);
      expect(steps.length).toBeGreaterThan(0);
      expect(speciesAchievements(a).length > 0).toBe(
        steps.every((x) => x.value >= x.target),
      );
      expect(s).toEqual(before);
    }
  });
});
