import { describe, expect, it } from "vitest";
import { SPECIES, speciesById } from "../data/species";
import { generateBirthContext, sampleYear, MIN_YEAR } from "./history";
import { daysInYear, formatDate, nextDate } from "./calendar";
import { seedFromText } from "./random";
import {
  act,
  advanceDays,
  advancePaced,
  availableActions,
  createGame,
  current,
  routineAction,
  startLife,
  stageOf,
} from "./engine";
import { tickWorld, refreshResources } from "./world";
import { deserialize, serialize, SAVE_KEY } from "./storage";
const born = (speciesId = "wolf", seed = "new-history") =>
  startLife(createGame(), { speciesId, seed });
const adult = (id = "wolf", seed = "adult-world") => {
  const s = born(id, seed);
  current(s)!.ageDays = speciesById(id).adultDay;
  return s;
};
describe("continuous historical generation", () => {
  for (const sp of SPECIES)
    it(`${sp.name}: species range, habitat, reproducible dates`, () => {
      const state = createGame();
      if (!state.unlocked.includes(sp.id)) state.unlocked.push(sp.id);
      const years = new Set<number>(),
        locations = new Set<string>();
      for (let i = 0; i < 180; i++) {
        const options = { speciesId: sp.id, seed: `history-${i}` };
        const a = startLife(state, options),
          b = startLife(state, options);
        expect(a).toEqual(b);
        const date = current(a)!.birth,
          loc = a.environment!.location;
        expect(date.year).toBeGreaterThanOrEqual(sp.existence[0]);
        expect(date.year).toBeLessThanOrEqual(sp.existence[1]);
        expect(date.day).toBeLessThan(daysInYear(date.year));
        expect(
          sp.history.habitats.some(
            (h) =>
              h.id === loc.id &&
              h.from <= date.year &&
              h.to >= date.year &&
              h.habitat === loc.habitat &&
              h.continent === loc.continent,
          ),
        ).toBe(true);
        expect(loc.precision).toBe("regional");
        years.add(date.year);
        locations.add(loc.id!);
      }
      expect(years.size).toBeGreaterThan(100);
      expect(locations.size).toBeGreaterThan(1);
      expect([...years].some((y) => y <= 0)).toBe(true);
    });
  it("enforces human-origin and extinction-style boundaries in the generic sampler", () => {
    const rng = { rng: seedFromText("extinct-fixture") };
    for (let i = 0; i < 500; i++) {
      const human = sampleYear(rng, [-299999, 2025]);
      expect(human).toBeGreaterThanOrEqual(-299999);
      const extinct = sampleYear(rng, [-50000, -10000]);
      expect(extinct).toBeLessThanOrEqual(-10000);
    }
    expect(() =>
      generateBirthContext(rng, speciesById("wolf"), -100001),
    ).toThrow("unavailable");
    expect(() => generateBirthContext(rng, speciesById("wolf"), 2026)).toThrow(
      "unavailable",
    );
    const extinct = {
      ...speciesById("wolf"),
      existence: [-50000, -10000] as [number, number],
    };
    expect(() => generateBirthContext(rng, extinct, 0)).toThrow();
  });
  it("has no date overflow at the supported deep-time representation boundary", () => {
    const rng = { rng: seedFromText("deep-time") };
    for (let i = 0; i < 1000; i++) {
      const year = sampleYear(rng, [MIN_YEAR, -1]);
      expect(Number.isSafeInteger(year)).toBe(true);
      expect(formatDate({ year, day: 0 })).toContain("BCE");
    }
    expect(nextDate({ year: 0, day: 365 })).toEqual({ year: 1, day: 0 });
    expect(formatDate({ year: -1, day: 0 })).toBe("1 Jan 2 BCE");
    expect(() => sampleYear(rng, [MIN_YEAR - 1, 0])).toThrow();
  });
  it("historical generation changes ecological pressure, climate and initial condition", () => {
    const old = startLife(createGame(), {
      speciesId: "rabbit",
      year: -20000,
      seed: "comparison",
    });
    const modern = startLife(createGame(), {
      speciesId: "rabbit",
      year: 2025,
      seed: "comparison",
    });
    expect(old.environment!.history!.epoch).toBe("Late Pleistocene");
    expect(old.environment!.pressure).toBeLessThan(
      modern.environment!.pressure,
    );
    expect(old.environment!.location.id).not.toBe(
      modern.environment!.location.id,
    );
    expect(old.environment!.temperature).not.toBe(
      modern.environment!.temperature,
    );
    expect(current(old)!.stats.stress).not.toBe(current(modern)!.stats.stress);
  });
});
describe("persistent ecological feedback", () => {
  it("weather changes persistent water, vegetation, prey and seasonal daylight", () => {
    const s = born("elephant");
    const initial = structuredClone(s.world!);
    for (let day = 0; day < 30; day++) {
      s.date = nextDate(s.date);
      tickWorld(s);
    }
    expect(s.world!.elapsedDays).toBe(30);
    expect(s.world!.water).not.toBe(initial.water);
    expect(s.world!.prey).not.toBe(initial.prey);
    expect(s.world!.daylight).toBeGreaterThan(0);
    expect(s.world!.daylight).toBeLessThan(24);
    expect(deserialize(serialize(s)).world).toEqual(s.world);
  });
  it("rain, drought and resource depletion have causal consequences", () => {
    const wet = adult("rabbit"),
      dry = structuredClone(wet);
    wet.world!.precipitation = 30;
    wet.world!.moisture = 0.9;
    wet.world!.water = 0.9;
    dry.world!.precipitation = 0;
    dry.world!.moisture = 0.05;
    dry.world!.water = 0.05;
    tickWorld(wet);
    tickWorld(dry);
    expect(wet.world!.water).toBeGreaterThan(dry.world!.water);
    expect(wet.world!.vegetation).toBeGreaterThan(dry.world!.vegetation);
    expect(current(act(wet, "drink"))!.stats.hydration).toBeGreaterThan(
      current(act(dry, "drink"))!.stats.hydration,
    );
    const before = wet.world!.patches[0].food,
      after = act(wet, "feed");
    expect(after.world!.patches[0].food).toBeLessThan(before);
    expect(after.environment!.food).not.toBe(wet.environment!.food);
  });
  it("resource shortages and injuries change movement options and automatic choices", () => {
    const s = adult("raccoon");
    current(s)!.stats.energy = 95;
    s.world!.patches[0].food = 0.1;
    refreshResources(s);
    expect(routineAction(s)).toBe("move");
    const next = act(s, "move");
    expect(next.world!.activePatch).not.toBe(s.world!.activePatch);
    current(s)!.stats.injury = 80;
    expect(availableActions(s)).not.toContain("move");
    expect(availableActions(born("wolf"))).not.toContain("move");
  });
  it("shortages persist as continuing situations and record player responses", () => {
    let s = adult("rabbit");
    s.world!.patches.forEach((p) => (p.food = 0.05));
    s.world!.vegetation = 0.05;
    s.world!.prey = 0.05;
    s.world!.water = 0.1;
    tickWorld(s);
    const situation = s.world!.situations.find(
      (x) => x.kind === "food-shortage",
    )!;
    expect(situation).toBeDefined();
    s = act(s, "explore");
    expect(
      s.world!.situations.find((x) => x.id === situation.id)!.involvement,
    ).toBe(1);
    tickWorld(s);
    expect(
      s.world!.situations.find((x) => x.id === situation.id)!.days,
    ).toBeGreaterThan(1);
  });
  it("quiet worlds and depleted worlds produce different action outcomes and context", () => {
    const rich = adult("rabbit"),
      poor = structuredClone(rich);
    rich.world!.patches.forEach((p) => (p.food = 1));
    rich.world!.vegetation = 0.95;
    rich.world!.competition = 0.05;
    poor.world!.patches.forEach((p) => (p.food = 0));
    poor.world!.vegetation = 0.05;
    poor.world!.competition = 0.95;
    refreshResources(rich);
    refreshResources(poor);
    expect(rich.environment!.food).toBeGreaterThan(poor.environment!.food);
    expect(current(act(rich, "feed"))!.stats.hunger).toBeLessThan(
      current(act(poor, "feed"))!.stats.hunger,
    );
  });
});
describe("development, personality, pacing and migration", () => {
  it("unlocks sensory learning without granting newborn locomotion or mating", () => {
    const s = born("elephant");
    current(s)!.ageDays = 8;
    expect(availableActions(s)).toContain("learn");
    expect(availableActions(s)).not.toContain("move");
    expect(availableActions(s)).not.toContain("mate");
    const a = act(s, "learn");
    expect(current(a)!.experience!.foraging).toBeGreaterThan(0);
    expect(availableActions(adult("ant"))).not.toContain("mate");
  });
  it("personality and dangerous experiences influence automatic behavior", () => {
    const s = adult("wolf");
    s.world!.predators = 0.8;
    current(s)!.personality!.caution = 90;
    expect(routineAction(s)).toBe("shelter");
    current(s)!.personality!.caution = 10;
    current(s)!.personality!.curiosity = 90;
    expect(routineAction(s, "exploration")).toBe("explore");
    current(s)!.experience!.dangerMemory = 50;
    expect(routineAction(s, "exploration")).toBe("shelter");
  });
  it("juveniles can die under genuine resource and predator pressure", () => {
    let juvenileDeath = false;
    for (let i = 0; i < 200 && !juvenileDeath; i++) {
      let s = born("bumblebee", `juvenile-risk-${i}`);
      s.world!.predators = 1;
      s.world!.vegetation = 0;
      s.world!.prey = 0;
      s.world!.water = 0;
      s.world!.patches.forEach((p) => (p.food = 0));
      s.environment!.food = 0;
      for (let n = 0; n < 24 && current(s)!.alive; n++)
        s = act(s, routineAction(s));
      juvenileDeath =
        !current(s)!.alive &&
        current(s)!.ageDays < speciesById("bumblebee").adultDay;
    }
    expect(juvenileDeath).toBe(true);
  });
  for (const pacing of ["immersive", "balanced", "story"] as const)
    it(`${pacing} uses exactly the same biology as manually executing its resolved routine phases`, () => {
      const s = born("elephant", `pacing-${pacing}`);
      s.pacing = pacing;
      const result = advancePaced(s);
      let manual = s;
      for (let i = 0; i < result.phases; i++)
        manual = act(manual, routineAction(manual));
      expect(result.state).toEqual(manual);
      expect(result.phases).toBeGreaterThan(0);
    });
  it("adaptive pacing stops at development, danger and death", () => {
    const s = born("bumblebee");
    s.pacing = "story";
    current(s)!.ageDays = 3;
    s.phase = 3;
    const next = advancePaced(s);
    expect(next.interrupted).toBe(true);
    expect(stageOf(current(next.state)!).name).toBe("Larva");
    const dying = adult("rabbit");
    current(dying)!.stats.health = 0;
    current(dying)!.stats.hunger = 100;
    const dead = advanceDays(dying, 365);
    expect(current(dead.state)!.alive).toBe(false);
    expect(dead.phases).toBeLessThan(1460);
    dying.pacing = "immersive";
    const onePhase = advancePaced(dying);
    expect(onePhase.interrupted).toBe(true);
    expect(current(onePhase.state)!.alive).toBe(false);
  });
  it("migrates real v1-shaped saves without losing currency, dates, family, PRNG or stats", () => {
    const original = startLife(createGame(), {
      speciesId: "ant",
      year: 2020,
      seed: "migration-fixture",
    });
    original.coins = 124;
    original.unlocked.push("fox");
    const old = JSON.parse(serialize(original));
    old.version = 1;
    delete old.world;
    delete old.pacing;
    for (const a of Object.values(old.family) as Record<string, unknown>[]) {
      delete a.personality;
      delete a.experience;
      delete a.circumstances;
    }
    old.environment.scenarioId = "2020";
    old.environment.location = {
      continent: "North America",
      region: "Central America",
      place: "Caribbean lowlands, Costa Rica",
      habitat: "Tropical forest floor",
      temperature: 27,
    };
    delete old.environment.history;
    delete old.environment.careQuality;
    const loaded = deserialize(JSON.stringify(old));
    expect(loaded.version).toBe(2);
    expect(loaded.coins).toBe(124);
    expect(loaded.unlocked).toContain("fox");
    expect(loaded.date).toEqual(old.date);
    expect(loaded.rng).toBe(old.rng);
    expect(current(loaded)!.stats).toEqual(old.family[old.currentId].stats);
    expect(loaded.environment!.location.climate).toBe("tropical");
    expect(loaded.world).toBeDefined();
    expect(() => act(loaded, "rest")).not.toThrow();
    expect(SAVE_KEY).toBe("life-simulator.save.v1");
  });
  it("survives multi-year seeded stability checks without nonfinite state or unbounded logs", () => {
    const started = performance.now();
    let totalDays = 0;
    for (const seed of ["long-a", "long-b", "long-c"]) {
      let s = adult("elephant", seed);
      let previous = 0;
      for (let year = 0; year < 5 && current(s)!.alive; year++) {
        // Continue interrupted skips too; emergencies are never bypassed.
        for (let block = 0; block < 12 && current(s)!.alive; block++)
          s = advanceDays(s, 30).state;
        expect(current(s)!.ageDays).toBeGreaterThanOrEqual(previous);
        previous = current(s)!.ageDays;
        expect(() => deserialize(serialize(s))).not.toThrow();
        expect(s.journal.length).toBeLessThanOrEqual(2000);
      }
      totalDays += s.world!.elapsedDays;
    }
    expect(totalDays).toBeGreaterThan(1000);
    expect(performance.now() - started).toBeLessThan(10000);
  }, 15000);
});

it("weather has an independent saved random stream rather than being rerolled by player actions", () => {
  let resting = born("wolf", "weather-stream"),
    feeding = structuredClone(resting);
  for (let i = 0; i < 12; i++) {
    resting = act(resting, "rest");
    feeding = act(feeding, "feed");
    expect(resting.world!.precipitation).toBe(feeding.world!.precipitation);
    expect(resting.environment!.temperature).toBe(
      feeding.environment!.temperature,
    );
    expect(resting.world!.rng).toBe(feeding.world!.rng);
  }
  expect(deserialize(serialize(resting)).world!.rng).toBe(resting.world!.rng);
});

it("seasonal species use broad birth windows instead of producing winter worker cohorts or wolf litters", () => {
  for (const id of ["wolf", "bumblebee", "meerkat", "mallard"])
    for (let i = 0; i < 100; i++) {
      const s = born(id, `seasonal-${i}`),
        date = current(s)!.birth;
      const window = speciesById(id).history.birthWindow!;
      const normalized =
        s.environment!.location.hemisphere === "south"
          ? (date.day -
              Math.floor(daysInYear(date.year) / 2) +
              daysInYear(date.year)) %
            daysInYear(date.year)
          : date.day;
      expect(normalized).toBeGreaterThanOrEqual(window[0]);
      expect(normalized).toBeLessThanOrEqual(window[1]);
    }
});

it("receiving nursery food does not count as an adult worker contributing to the colony", () => {
  let s = born("ant", "nursery-contribution");
  for (let phase = 0; phase < 12 && current(s)!.alive; phase++)
    s = act(s, "feed");
  expect(current(s)!.colonyService).toBe(0);
});
