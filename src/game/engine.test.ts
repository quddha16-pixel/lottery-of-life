import { describe, expect, it } from "vitest";
import { SPECIES, STARTERS, speciesById } from "../data/species";
import {
  act,
  availableActions,
  advanceDays,
  abandonLife,
  calculateRewards,
  continueBloodline,
  createGame,
  current,
  openPack,
  PACK,
  routineAction,
  skipOptions,
  stageOf,
  startLife,
} from "./engine";
import { nextDate, formatDate } from "./calendar";
import {
  BACKUP_KEY,
  SAVE_KEY,
  deserialize,
  loadGame,
  persistGame,
  serialize,
} from "./storage";
import type { GameState } from "./types";
function birth(speciesId = "wolf", seed = "test-101") {
  return startLife(createGame(), { speciesId, year: 2020, seed });
}
function mature(speciesId: string) {
  const s = birth(speciesId);
  current(s)!.ageDays = speciesById(speciesId).adultDay;
  current(s)!.stats.bond = 85;
  return s;
}
function death(s: GameState) {
  current(s)!.stats.health = 0;
  current(s)!.stats.hunger = 100;
  return act(s, "rest");
}

describe("valid seeded birth generation", () => {
  it("starts with exactly the ten requested species, no paid or bonus currency", () => {
    const s = createGame();
    expect(s.unlocked).toEqual(STARTERS);
    expect(s.unlocked).toHaveLength(10);
    expect(s.coins).toBe(0);
  });
  for (const sp of SPECIES.filter((s) => s.starter))
    for (const year of [sp.existence[0], 0, sp.existence[1]]) {
      it(`${sp.name} has valid geography and date in ${year}`, () => {
        const s = startLife(createGame(), {
          speciesId: sp.id,
          year,
          seed: "stable",
        });
        const a = current(s)!;
        expect(
          sp.history.habitats.some(
            (h) =>
              h.id === s.environment!.location.id &&
              h.from <= year &&
              h.to >= year,
          ),
        ).toBe(true);
        expect(a.birth.year).toBe(year);
        expect(a.birth.year).toBeGreaterThanOrEqual(sp.existence[0]);
        expect(a.birth.year).toBeLessThanOrEqual(sp.existence[1]);
        expect(a.ageDays).toBe(0);
        expect(a.stats.health).toBeGreaterThanOrEqual(80);
      });
    }
  it("replays the exact same seed and actions", () => {
    let first = birth("rabbit", "replay"),
      second = birth("rabbit", "replay");
    for (let i = 0; i < 20; i++) {
      first = act(first, routineAction(first));
      second = act(second, routineAction(second));
    }
    expect(first).toEqual(second);
  });
  it("rejects locked species, unknown periods, and overwriting a living individual", () => {
    expect(() => birth("fox")).toThrow("locked");
    expect(() =>
      startLife(createGame(), { year: -1000000, seed: "x" }),
    ).toThrow();
    expect(() => startLife(birth(), { year: 2020, seed: "x" })).toThrow(
      "active life",
    );
  });
  it("random births cover all unlocked starters across seeds", () => {
    const ids = new Set(
      Array.from(
        { length: 300 },
        (_, i) =>
          current(startLife(createGame(), { year: 1900, seed: `seed-${i}` }))!
            .speciesId,
      ),
    );
    expect([...ids].sort()).toEqual([...STARTERS].sort());
  });
});
describe("phase and survival rules", () => {
  it("advances one phase per decision and ages only after night", () => {
    let s = birth();
    const date = s.date;
    for (let i = 0; i < 3; i++) s = act(s, "rest");
    expect(s.phase).toBe(3);
    expect(current(s)!.ageDays).toBe(0);
    expect(s.date).toEqual(date);
    s = act(s, "feed");
    expect(s.phase).toBe(0);
    expect(current(s)!.ageDays).toBe(1);
    expect(s.date).toEqual(nextDate(date));
  });
  it("makes dependent wolf pups rely on provisioning; ducklings can forage", () => {
    expect(availableActions(birth())).not.toContain("explore");
    expect(availableActions(birth("mallard"))).toContain("explore");
    expect(availableActions(birth("octopus"))).not.toContain("socialize");
    expect(availableActions(mature("ant"))).not.toContain("mate");
  });
  it("progresses through metamorphosis and unlocks adult insect actions", () => {
    const s = birth("bumblebee");
    current(s)!.ageDays = 24;
    s.phase = 3;
    const next = act(s, "wait");
    expect(stageOf(current(next)!).name).toBe("Worker");
    expect(availableActions(next)).toContain("socialize");
    expect(next.journal.some((e) => e.kind === "milestone")).toBe(true);
  });
  it("feeding and resting have different persistent consequences; inputs are immutable", () => {
    const s = mature("rabbit");
    s.environment!.food = 1;
    current(s)!.stats.hunger = 60;
    current(s)!.stats.energy = 60;
    const old = serialize(s);
    const fed = act(s, "feed"),
      rested = act(s, "rest");
    expect(current(fed)!.stats.hunger).toBeLessThan(
      current(rested)!.stats.hunger,
    );
    expect(current(rested)!.stats.energy).toBeGreaterThan(
      current(fed)!.stats.energy,
    );
    expect(serialize(s)).toBe(old);
  });
  it("resolves skips with the exact same phase engine as routine manual advancement", () => {
    const s = birth("elephant", "quiet");
    const skipped = advanceDays(s, 7);
    let manual = s;
    for (let i = 0; i < skipped.phases; i++)
      manual = act(manual, routineAction(manual));
    expect(simulationState(skipped.state)).toEqual(simulationState(manual));
    expect(current(manual)!.ageDays).toBe(7);
    expect(manual.environment).not.toEqual(s.environment);
  });
  it("next day finishes the current partial day; skips adapt to life stage and lifespan", () => {
    const s = act(birth(), "feed");
    expect(advanceDays(s, 1).phases).toBe(3);
    expect(skipOptions(birth("bumblebee"))).toEqual([1, 7]);
    expect(skipOptions(birth("elephant"))).not.toContain(365);
    expect(skipOptions(mature("elephant"))).toContain(365);
    expect(() => advanceDays(s, Infinity)).toThrow();
    expect(() => advanceDays(s, -1)).toThrow();
  });
  it("starvation is fatal, rewards settle once, and deceased animals cannot act or be revived by a skip", () => {
    const s = death(mature("rabbit")),
      coins = s.coins;
    expect(current(s)!.alive).toBe(false);
    expect(current(s)!.cause).toBe("Starvation");
    expect(s.records).toHaveLength(1);
    expect(() => act(s, "feed")).toThrow();
    expect(advanceDays(s, 30).state).toEqual(s);
    expect(abandonLife(s).coins).toBe(coins);
    expect(s.records[0].coins).toBe(coins);
  });
  it("interrupts a skip for critical health rather than advancing the date blindly", () => {
    const s = birth("rabbit");
    current(s)!.stats.health = 20;
    const result = advanceDays(s, 30);
    expect(result.interrupted).toBe(true);
    expect(result.phases).toBeLessThan(120);
  });
  it("models age-related and postbreeding octopus death", () => {
    const s = mature("octopus");
    const a = current(s)!;
    a.sex = "Female";
    a.lastReproduction = 100;
    a.ageDays = 200;
    s.phase = 3;
    expect(current(act(s, "rest"))!.cause).toBe("Postbreeding senescence");
    const old = mature("elephant");
    current(old)!.ageDays = speciesById("elephant").maxLifespan - 1;
    old.phase = 3;
    expect(current(act(old, "feed"))!.cause).toBe("Age-related decline");
  });
  it("handles leap years and BCE without JavaScript date limitations", () => {
    expect(nextDate({ year: 2000, day: 365 })).toEqual({ year: 2001, day: 0 });
    expect(nextDate({ year: 1900, day: 364 })).toEqual({ year: 1901, day: 0 });
    expect(formatDate({ year: 0, day: 0 })).toBe("1 Jan 1 BCE");
  });
});
describe("success and collection economy", () => {
  it("rewards sterile workers for colony contributions without offspring", () => {
    const s = mature("ant"),
      a = current(s)!;
    a.colonyService = 12;
    a.ageDays = speciesById("ant").lifespan;
    const reward = calculateRewards(a);
    expect(reward.achievements).toContain("Colony contributor");
    expect(reward.coins).toBeGreaterThan(PACK.cost);
    expect(a.children).toHaveLength(0);
  });
  it("gives no Coins for trivial births or abandonment", () => {
    expect(death(birth()).coins).toBe(0);
    expect(abandonLife(mature("elephant")).coins).toBe(0);
  });
  it("rejects unaffordable packs and handles real unlocks and duplicate conversion", () => {
    expect(() => openPack(createGame())).toThrow("Coins");
    let s = createGame();
    s.coins = 10000;
    s = openPack(s);
    expect(s.unlocked).toContain(s.lastPack!.speciesId);
    expect(s.coins).toBe(9940);
    s.unlocked = SPECIES.map((sp) => sp.id);
    const before = s.coins;
    s = openPack(s);
    expect(s.lastPack!.duplicate).toBe(true);
    expect(s.coins).toBe(before - PACK.cost + PACK.duplicateRefund);
    expect(new Set(s.unlocked).size).toBe(s.unlocked.length);
  });
  it("configured probabilities are normalized and observed draws fit the displayed distribution", () => {
    expect(PACK.drops.reduce((n, d) => n + d.weight, 0)).toBe(100);
    let s = createGame("pack-distribution");
    const count: Record<string, number> = { fox: 0, robin: 0, seal: 0 };
    for (let i = 0; i < 10000; i++) {
      s.coins = 1000;
      s = openPack(s);
      count[s.lastPack!.speciesId]++;
    }
    for (const drop of PACK.drops)
      expect(Math.abs(count[drop.id] / 100 - drop.weight)).toBeLessThan(2);
  });
  it("new discoveries can be manually selected and enter random births", () => {
    const s = createGame();
    s.unlocked.push("fox");
    expect(
      current(startLife(s, { speciesId: "fox", year: 1980, seed: "a" }))!
        .speciesId,
    ).toBe("fox");
    expect(
      Array.from(
        { length: 100 },
        (_, i) =>
          current(startLife(s, { year: 2020, seed: `${i}` }))!.speciesId,
      ),
    ).toContain("fox");
  });
});
describe("offspring and bloodline continuity", () => {
  function family() {
    let s = mature("rabbit");
    for (let n = 0; n < 20 && !current(s)!.pregnantUntil; n++) {
      current(s)!.stats.hunger = 10;
      current(s)!.stats.energy = 90;
      s = act(s, "mate");
    }
    expect(current(s)!.pregnantUntil).toBeDefined();
    current(s)!.ageDays = current(s)!.pregnantUntil! - 1;
    s.phase = 3;
    s = act(s, "feed");
    return s;
  }
  it("generates a biological cohort with parentage and bounded inherited variation", () => {
    const s = family(),
      a = current(s)!;
    expect(a.children).toHaveLength(4);
    for (const id of a.children) {
      const child = s.family[id];
      expect(child.parentId).toBe(a.id);
      expect(child.generation).toBe(2);
      expect(child.ageDays).toBe(0);
      expect(
        Math.abs(child.traits.resilience - a.traits.resilience),
      ).toBeLessThanOrEqual(6);
    }
    expect(() => deserialize(serialize(s))).not.toThrow();
  });
  it("offspring age with the world and take over at actual age after permanent parent death", () => {
    let s = family();
    s = advanceDays(s, 7).state;
    const childId = current(s)!.children.find((id) => s.family[id].alive)!;
    expect(s.family[childId].ageDays).toBeGreaterThan(0);
    expect(() => continueBloodline(s, childId)).toThrow();
    s = death(s);
    const date = s.date,
      environment = s.environment,
      age = s.family[childId].ageDays,
      rng = s.rng;
    const next = continueBloodline(s, childId);
    expect(current(next)!.ageDays).toBe(age);
    expect(next.date).toEqual(date);
    expect(next.environment).toEqual(environment);
    expect(next.rng).toBe(rng);
    expect(next.records).toHaveLength(1);
    expect(current(next)!.generation).toBe(2);
    expect(() => deserialize(serialize(next))).not.toThrow();
  });
  it("rejects taking over a dead offspring or unrelated individual", () => {
    let s = family();
    const id = current(s)!.children[0];
    s.family[id].alive = false;
    s.family[id].death = s.date;
    s.family[id].cause = "Predation";
    s = death(s);
    expect(() => continueBloodline(s, id)).toThrow();
    expect(() => continueBloodline(s, "missing")).toThrow();
  });
});
describe("persistent saves and recovery", () => {
  const storage = () => {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
  };
  it("round-trips all state including random state and resumes identical outcomes", () => {
    const s = advanceDays(birth("raccoon"), 7).state,
      loaded = deserialize(serialize(s));
    expect(loaded).toEqual(s);
    expect(advanceDays(loaded, 7)).toEqual(advanceDays(s, 7));
  });
  it("backs up valid state and recovers without replacing a valid backup with corrupt bytes", () => {
    const store = storage(),
      s = birth();
    persistGame(s, store);
    persistGame(act(s, "feed"), store);
    store.setItem(SAVE_KEY, "broken");
    expect(loadGame(store).state).toEqual(s);
    expect(loadGame(store).warning).toContain("Recovered");
    persistGame(s, store);
    expect(deserialize(store.getItem(BACKUP_KEY)!)).toEqual(s);
  });
  it("blocks autosave when no recovery exists and rejects malformed or future saves", () => {
    const store = storage();
    store.setItem(SAVE_KEY, "broken");
    expect(loadGame(store).blocked).toBe(true);
    const invalid = [
      null,
      { version: 2 },
      { ...birth(), phase: 9 },
      { ...birth(), coins: -5 },
      { ...birth(), family: {} },
      { ...birth(), rng: Infinity },
    ];
    for (const value of invalid)
      expect(() => deserialize(JSON.stringify(value))).toThrow();
    const cyclic = birth();
    current(cyclic)!.parentId = current(cyclic)!.id;
    expect(() => deserialize(serialize(cyclic))).toThrow();
  });
  it("reports unavailable storage instead of silently promising persistence", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(loadGame(broken).blocked).toBe(true);
  });
});

describe("extended ecological and generational invariants", () => {
  it("cover reduces thermal injury and dehydration erodes condition", () => {
    const exposed = mature("rabbit");
    exposed.environment!.temperature = 60;
    const inCover = act(exposed, "shelter"),
      foraging = act(exposed, "feed");
    expect(current(inCover)!.stats.health).toBeGreaterThan(
      current(foraging)!.stats.health,
    );
    const dry = mature("rabbit"),
      hydrated = structuredClone(dry);
    current(dry)!.stats.hydration = 0;
    expect(current(act(dry, "rest"))!.stats.health).toBeLessThan(
      current(act(hydrated, "rest"))!.stats.health,
    );
  });
  it("can continue across three generations while retaining ancestors and calendar", () => {
    let s = mature("rabbit");
    for (let generation = 1; generation <= 2; generation++) {
      const parent = current(s)!;
      expect(parent.generation).toBe(generation);
      parent.ageDays = 150;
      parent.pregnantUntil = 151;
      parent.pendingOffspring = 4;
      s.phase = 3;
      s = act(s, "feed");
      const child = current(s)!.children.find((id) => s.family[id].alive)!;
      s = death(s);
      const date = s.date;
      s = continueBloodline(s, child);
      expect(s.date).toEqual(date);
    }
    expect(current(s)!.generation).toBe(3);
    expect(s.records).toHaveLength(2);
    expect(
      Object.values(s.family).filter(
        (a) => !a.alive && a.cause === "Starvation",
      ),
    ).toHaveLength(2);
    expect(() => deserialize(serialize(s))).not.toThrow();
  });
});

// Batch summaries differ from a single phase; every simulation field must still match.
function simulationState(s: GameState) {
  const copy = structuredClone(s);
  if (copy.area) { delete copy.area.outcome; delete copy.area.feedback; }
  return copy;
}
