import { describe, expect, it } from "vitest";
import { SPECIES, speciesById } from "../data/species";
import {
  act,
  advanceDays,
  advancePaced,
  availableActions,
  createGame,
  current,
  interact,
  meetAnimal,
  respondToEncounter,
  startLife,
  travel,
} from "./engine";
import {
  discoveries,
  eventText,
  interactionText,
  situationText,
  deathExplanation,
} from "./narration";
import { deserialize, serialize } from "./storage";
import {
  encounterResponses,
  interactions,
  sceneState,
  travelEligibility,
} from "./wildlife";
import type { GameState } from "./types";
const life = (id = "wolf", age = 0, seed = "wildlife-test") => {
  const base = createGame();
  if (!base.unlocked.includes(id)) base.unlocked.push(id);
  const s = startLife(base, { speciesId: id, year: 2020, seed });
  current(s)!.ageDays = age;
  current(s)!.stats.energy = 100;
  return s;
};
function encounter(
  s: GameState,
  role: "rival" | "prey" | "predator" | "companion" | "mate",
) {
  const other = s.area!.animals.find((n) => n.role === role)!;
  other.location = s.world!.activePatch;
  s.area!.encounter = {
    id: "fixture",
    animalId: other.id,
    kind: role,
    location: other.location,
    beganDay: s.area!.ticks,
    cooldownUntil: 8,
    status: "active",
  };
  return other;
}
describe("connected local environments", () => {
  it("blocks all newborn independent travel and all ant brood movement", () => {
    for (const [id, age] of [
      ["elephant", 0],
      ["wolf", 0],
      ["wolf", 20],
      ["ant", 0],
      ["ant", 25],
      ["ant", 50],
    ] as const) {
      const s = life(id, age);
      expect(
        s.area!.nodes.every((n) => !travelEligibility(s, n.id).allowed),
      ).toBe(true);
      expect(() => travel(s, "water")).toThrow();
    }
  });
  it("allows an elephant calf to follow a healthy caregiver after its first day", () => {
    const s = life("elephant", 1);
    expect(travelEligibility(s, "water")).toMatchObject({
      allowed: true,
      escorted: true,
    });
    const after = travel(s, "water");
    expect(after.world!.activePatch).toBe("water");
    expect(after.area!.animals.find((n) => n.role === "mother")!.location).toBe(
      "water",
    );
    expect(current(after)!.stats.energy).toBeLessThan(current(s)!.stats.energy);
    expect(travelEligibility(s, "edge").allowed).toBe(false);
  });
  it("requires a caregiver and sufficient condition for dependent travel", () => {
    const s = life("wolf", 21);
    expect(travelEligibility(s, "water").allowed).toBe(true);
    s.area!.animals.filter((n) =>
      ["mother", "companion"].includes(n.role),
    ).forEach((n) => (n.alive = false));
    expect(travelEligibility(s, "water").allowed).toBe(false);
    current(s)!.ageDays = 730;
    current(s)!.stats.injury = 70;
    expect(travelEligibility(s, "water").allowed).toBe(false);
  });
  it("enforces connections and charges distance, phase time, metabolism and energy", () => {
    const s = life("wolf", 730);
    expect(() => travel(s, "edge")).toThrow("No direct route");
    const before = current(s)!.stats.energy;
    const after = travel(s, "forage");
    expect(after.phase).toBe(1);
    expect(current(after)!.stats.energy).toBe(before - 11 - 4);
    expect(after.world!.activePatch).toBe("forage");
    const end = travel(after, "edge");
    expect(end.phase).toBe(3);
    expect(end.area!.feedback).toContain("2 phases");
  });
  it("keeps depleted resources at the location after leaving and returning", () => {
    let s = life("wolf", 730);
    s = travel(s, "forage");
    const food = s.world!.patches.find((p) => p.id === "forage")!.food;
    s = interact(s, "track-prey");
    expect(s.world!.patches.find((p) => p.id === "forage")!.food).toBeLessThan(
      food,
    );
    const depleted = s.world!.patches.find((p) => p.id === "forage")!.food;
    s = travel(s, "home");
    expect(
      s.world!.patches.find((p) => p.id === "forage")!.food,
    ).toBeLessThanOrEqual(depleted);
    expect(deserialize(serialize(s)).world!.patches).toEqual(s.world!.patches);
  });
  it("uses the current historical habitat and preserves connected maps for every catalog species", () => {
    for (const sp of SPECIES) {
      const s = life(sp.id, sp.adultDay);
      expect(s.environment!.location).toBeDefined();
      expect(s.area!.nodes).toHaveLength(5);
      for (const n of s.area!.nodes)
        for (const target of n.links)
          expect(s.area!.nodes.find((x) => x.id === target)!.links).toContain(
            n.id,
          );
      expect(() => interactions(s, availableActions(s))).not.toThrow();
      expect(() => act(s, "rest")).not.toThrow();
      expect(() => deserialize(serialize(s))).not.toThrow();
    }
  });
});
describe("persistent animals and contextual interaction", () => {
  it("gives nearby individuals stable unique identities, state and autonomous movement", () => {
    let s = life("elephant", 4380);
    const ids = s.area!.animals.map((n) => n.id),
      positions = s.area!.animals.map((n) => n.location);
    const hunger = s.area!.animals.map((n) => n.hunger);
    for (let i = 0; i < 12 && current(s)!.alive; i++) s = act(s, "rest");
    expect(new Set(ids).size).toBe(ids.length);
    expect(s.area!.animals.map((n) => n.id)).toEqual(ids);
    expect(s.area!.animals.map((n) => n.location)).not.toEqual(positions);
    expect(s.area!.animals.map((n) => n.hunger)).not.toEqual(hunger);
    expect(deserialize(serialize(s)).area).toEqual(s.area);
  });
  it("nursing affects the named caregiver, and staying close builds persistent trust", () => {
    const s = life("elephant");
    const mother = s.area!.animals.find((n) => n.role === "mother")!,
      before = mother.energy;
    const nursed = interact(s, "nurse");
    const m = nursed.area!.animals.find((n) => n.id === mother.id)!;
    expect(m.energy).toBeLessThan(before);
    expect(m.hunger).toBeGreaterThan(mother.hunger);
    const close = interact(s, "stay-close");
    expect(
      close.area!.animals.find((n) => n.id === mother.id)!.bond,
    ).toBeGreaterThan(mother.bond);
    expect(
      deserialize(serialize(close)).area!.animals.find(
        (n) => n.id === mother.id,
      )!.bond,
    ).toBeGreaterThan(mother.bond);
  });
  it("does not offer nursing or fake adult abilities when circumstances do not support them", () => {
    const s = life("wolf");
    s.area!.animals.filter((n) => n.role === "mother").forEach(
      (n) => (n.alive = false),
    );
    const ids = interactions(s, availableActions(s)).map((n) => n.id);
    expect(ids).not.toContain("nurse");
    expect(ids).not.toContain("track-prey");
    expect(() => interact(s, "nurse")).toThrow();
    expect(
      interactions(life("ant"), availableActions(life("ant"))).map((n) => n.id),
    ).toEqual(["wait", "rest"]);
  });
  it("colony work changes food stores and earned colony service, beyond a renamed button", () => {
    const s = life("ant", 60);
    s.world!.patches.find((p) => p.id === "home")!.food = 0.4;
    const after = interact(s, "tend-garden");
    expect(
      after.world!.patches.find((p) => p.id === "home")!.food,
    ).toBeGreaterThan(0.4);
    expect(current(after)!.colonyService).toBeGreaterThan(1);
    expect(current(after)!.stats.energy).toBeLessThan(current(s)!.stats.energy);
    const trail = travel(s, "forage"),
      harvest = interact(trail, "cut-leaves");
    expect(current(harvest)!.biology!.stores.leafLoad).toBeGreaterThan(0);
    const delivered = travel(harvest, "home");
    expect(current(delivered)!.biology!.stores.leafLoad).toBe(0);
    expect(current(delivered)!.biology!.stores.substrate).toBeGreaterThan(
      current(harvest)!.biology!.stores.substrate,
    );
  });
  it("supports quiet social encounters without artificial dramatic consequences", () => {
    const s = life("wolf", 730),
      other = encounter(s, "companion");
    const after = respondToEncounter(s, "approach");
    expect(
      after.area!.animals.find((n) => n.id === other.id)!.bond,
    ).toBeGreaterThan(other.bond);
    expect(after.area!.encounter!.status).toBe("resolved");
    expect(after.phase).toBe(1);
  });
  it("allows a hunting encounter to remove a particular prey and persist its death", () => {
    let success: GameState | undefined;
    for (let i = 0; i < 30; i++) {
      const s = life("wolf", 730, `hunt-${i}`);
      s.environment!.food = 1;
      encounter(s, "prey");
      const after = respondToEncounter(s, "hunt");
      if (!after.area!.animals.find((n) => n.role === "prey")!.alive) {
        success = after;
        break;
      }
    }
    expect(success).toBeDefined();
    expect(success!.area!.encounter!.outcome).toContain("individual prey dies");
    expect(
      deserialize(serialize(success!)).area!.animals.find(
        (n) => n.role === "prey",
      )!.alive,
    ).toBe(false);
  });
  it("conflict has real injuries and can permanently kill the player without duplicate rewards", () => {
    const s = life("wolf", 730);
    encounter(s, "rival");
    current(s)!.stats.health = 1;
    const after = respondToEncounter(s, "challenge");
    expect(current(after)!.alive).toBe(false);
    expect(after.records).toHaveLength(1);
    expect(current(after)!.stats.injury).toBeGreaterThan(0);
    expect(() => respondToEncounter(after, "challenge")).toThrow();
    expect(() => deserialize(serialize(after))).not.toThrow();
  });
  it("nearby animals can die independently, and cannot be met or provision the player afterward", () => {
    const s = life("elephant"),
      mother = s.area!.animals.find((n) => n.role === "mother")!;
    mother.health = 0;
    mother.hunger = 100;
    const next = act(s, "rest");
    expect(next.area!.animals.find((n) => n.id === mother.id)!.alive).toBe(
      false,
    );
    expect(() => meetAnimal(next, mother.id)).toThrow();
    expect(
      interactions(next, availableActions(next)).some((x) => x.id === "nurse"),
    ).toBe(false);
  });
  it("pauses adaptive time for meaningful encounters without using a different survival model", () => {
    const s = life("wolf", 730);
    encounter(s, "rival");
    expect(advancePaced(s)).toMatchObject({ phases: 0, interrupted: true });
    const after = respondToEncounter(s, "retreat");
    expect(after.phase).toBe(1);
    expect(current(after)!.stats.energy).toBeLessThan(current(s)!.stats.energy);
  });
  it("does not offer impossible mating or hunting responses to newborn animals", () => {
    const s = life("wolf");
    encounter(s, "mate");
    expect(encounterResponses(s).map((x) => x.id)).not.toContain("court");
    encounter(s, "prey");
    expect(encounterResponses(s).map((x) => x.id)).not.toContain("hunt");
  });
});
describe("narration, scenes, discovery and save continuity", () => {
  it("changes day/night and rain presentation based on actual state", () => {
    const s = life("elephant");
    expect(sceneState(s)).toMatchObject({
      phase: "morning",
      palette: "savanna",
    });
    s.phase = 3;
    s.world!.precipitation = 20;
    expect(sceneState(s)).toMatchObject({ phase: "night", rain: true });
    expect(sceneState(life("ant")).palette).toBe("colony");
  });
  it("Simple and Detailed narration produce identical outcomes, RNG and rewards", () => {
    const simple = life("wolf", 730),
      detailed = structuredClone(simple);
    detailed.narration = "detailed";
    expect(situationText(simple)).not.toBe(situationText(detailed));
    const option = interactions(simple, availableActions(simple)).find(
      (x) => x.id === "rest",
    )!;
    expect(interactionText(simple, option).id).toBe(
      interactionText(detailed, option).id,
    );
    situationText(simple);
    eventText("Provisioning is scarce.", simple.narration);
    discoveries(simple);
    const a = advanceDays(simple, 7).state,
      b = advanceDays(detailed, 7).state;
    expect({ ...a, narration: "same" }).toEqual({ ...b, narration: "same" });
  });
  it("offers sourced discoveries across biology, habitat, development and historical context", () => {
    const s = life("elephant");
    expect(discoveries(s)).toHaveLength(8);
    expect(
      discoveries(s).find((x) => x.topic === "Historical world")!.fact,
    ).toContain("broad regional reconstruction");
    expect(speciesById("elephant").source).toMatch(/^https:/);
    expect(deathExplanation("Starvation")).toContain("not enough food");
  });
  it("migrates v2 saves deterministically without advancing time, RNG or existing progress", () => {
    const original = life("elephant", 5);
    original.coins = 157;
    const old = JSON.parse(serialize(original));
    old.version = 2;
    delete old.area;
    delete old.narration;
    const a = deserialize(JSON.stringify(old)),
      b = deserialize(JSON.stringify(old));
    expect(a).toEqual(b);
    expect(a.version).toBe(3);
    expect(a.coins).toBe(157);
    expect(a.date).toEqual(original.date);
    expect(a.phase).toBe(original.phase);
    expect(a.rng).toBe(original.rng);
    expect(a.world!.rng).toBe(original.world!.rng);
    expect(a.family).toEqual(original.family);
    expect(a.records).toEqual(original.records);
    expect(a.narration).toBe("simple");
  });
  it("rejects broken location and animal references instead of silently losing state", () => {
    const s = life();
    s.area!.animals[0].location = "missing";
    expect(() => deserialize(serialize(s))).toThrow();
    const next = life();
    next.area!.nodes[0].links.push("missing");
    expect(() => deserialize(serialize(next))).toThrow();
  });
});

it("autonomous nearby movement never jumps across an unconnected route", () => {
  let s = life("wolf", 21);
  s.world!.activePatch = "shade";
  const mother = s.area!.animals.find((n) => n.role === "mother")!;
  mother.location = "forage";
  for (let i = 0; i < 24 && current(s)!.alive; i++) {
    const positions = new Map(s.area!.animals.map((n) => [n.id, n.location]));
    const after = act(s, "rest");
    for (const n of after.area!.animals) {
      const before = positions.get(n.id);
      if (before && before !== n.location)
        expect(s.area!.nodes.find((x) => x.id === before)!.links).toContain(
          n.location,
        );
    }
    s = after;
  }
});
