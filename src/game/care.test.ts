import { describe, it, expect } from "vitest";
import {
  act,
  advanceToOpportunity,
  createGame,
  current,
  startLife,
} from "./engine";
import { careFactor, tickAnimals } from "./wildlife";
import { speciesById } from "../data/species";
import { deserialize, serialize } from "./storage";
const born = (id: string) => {
  const base = createGame();
  if (!base.unlocked.includes(id)) base.unlocked.push(id);
  return startLife(base, {
    speciesId: id,
    seed: `phase3c-sample-${id}-0`,
    year: 2020,
  });
};
describe("Phase 3C finite parental care", () => {
  it("uses a fit caregiver’s nutrition for a milk meal instead of consuming plants in the infant’s den", () => {
    const s = born("elephant");
    s.world!.patches.find((p) => p.id === "home")!.food = 0;
    s.environment!.food = 0;
    current(s)!.stats.hydration = 20;
    s.rng = 1; // Prepared successful-meal fixture; not a fresh-life demonstration.
    const mother = s.area!.animals.find((n) => n.role === "mother")!;
    const n = act(s, "feed"),
      m = n.area!.animals.find((n) => n.id === mother.id)!;
    expect(current(n)!.stats.hydration).toBeGreaterThan(20);
    expect(m.hunger).toBeGreaterThan(mother.hunger);
    expect(m.energy).toBeLessThan(mother.energy);
    expect(n.world!.patches.find((p) => p.id === "home")!.food).toBe(0);
    expect(
      n.journal.some((e) => e.text.includes("nursery provides nourishment")),
    ).toBe(true);
  });
  it("does not invent a meal when the parent is absent, and preserves permanent mortality", () => {
    let s = born("wolf");
    for (const n of s.area!.animals.filter((n) => n.role === "mother"))
      n.alive = false;
    current(s)!.stats.hunger = 80;
    current(s)!.stats.hydration = 15;
    current(s)!.stats.health = 8;
    expect(careFactor(s)).toBe(0);
    const n = act(s, "feed");
    expect(current(n)!.stats.hunger).toBeGreaterThanOrEqual(80);
    expect(
      n.journal.some((e) => e.text.includes("Provisioning is scarce")),
    ).toBe(true);
    for (let i = 0; i < 12 && current(s)!.alive; i++) s = act(s, "feed");
    expect(current(s)!.alive).toBe(false);
    expect(advanceToOpportunity(s).phases).toBe(0);
  });
  it("charges a failed request for time without charging a nonexistent meal", () => {
    const s = born("wolf");
    s.environment!.careQuality = 0;
    const mother = s.area!.animals.find((n) => n.role === "mother")!,
      n = act(s, "feed"),
      m = n.area!.animals.find((n) => n.id === mother.id)!;
    // The ordinary NPC phase still costs five hunger and three energy.
    expect(m.hunger - mother.hunger).toBe(5);
    expect(m.energy - mother.energy).toBe(-4);
    expect(current(n)!.stats.hunger).toBeGreaterThan(current(s)!.stats.hunger);
  });
  it("returns a nourished parent over real adjacent edges rather than teleporting from a distant patch", () => {
    const s = born("wolf"),
      mother = s.area!.animals.find((n) => n.role === "mother")!;
    const far = s.area!.nodes.find(
      (n) => n.id !== "home" && !n.links.includes("home"),
    )!;
    mother.location = far.id;
    mother.hunger = 0;
    mother.energy = 100;
    tickAnimals(s);
    expect(far.links).toContain(mother.location);
    expect(mother.location).not.toBe("home");
    for (let i = 0; i < 4 && mother.location !== "home"; i++) {
      const old = s.area!.nodes.find((n) => n.id === mother.location)!;
      tickAnimals(s);
      expect(old.links).toContain(mother.location);
    }
    expect(mother.location).toBe("home");
  });
  it("still loses caregivers and young when their entire local food supply is exhausted", () => {
    let s = born("raccoon");
    for (const p of s.world!.patches) p.food = 0;
    s.world!.vegetation = 0;
    s.world!.prey = 0;
    // Inspect the ordinary care loop in this deliberately depleted fixture.
    for (let i = 0; i < 100 && current(s)!.alive; i++)
      s = act(s, current(s)!.stats.energy < 25 ? "rest" : "feed");
    expect(current(s)!.alive).toBe(false);
    expect(
      s.area!.animals.find((n) => n.role === "mother")!.health,
    ).toBeLessThan(90);
  });
  it.each(["wolf", "rabbit", "meerkat", "raccoon", "fox", "seal"])(
    "%s can reach its early opportunity through routine care in the diagnostic seed",
    (id) => {
      let s = born(id),
        target = (
          {
            wolf: 21,
            rabbit: 28,
            meerkat: 60,
            raccoon: 70,
            fox: 60,
            seal: 28,
          } as Record<string, number>
        )[id];
      for (
        let i = 0;
        i < 40 && current(s)!.alive && current(s)!.ageDays < target;
        i++
      )
        s = advanceToOpportunity(s).state;
      expect(current(s)!.alive).toBe(true);
      expect(current(s)!.ageDays).toBeGreaterThanOrEqual(target);
      expect(
        speciesById(id).stages.some(
          (stage) => stage.fromDay <= current(s)!.ageDays,
        ),
      ).toBe(true);
      expect(JSON.parse(serialize(deserialize(serialize(s))))).toEqual(
        JSON.parse(serialize(s)),
      );
    },
  );
});
