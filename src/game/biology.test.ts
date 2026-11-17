import { describe, expect, it } from "vitest";
import { SPECIES, speciesById } from "../data/species";
import { SPECIES_RULES } from "../data/species-rules";
import {
  act,
  advanceDays,
  availableActions,
  calculateRewards,
  createGame,
  current,
  interact,
  routineAction,
  startLife,
  travel,
} from "./engine";
import {
  biologyActivities,
  reproductionPossible,
  speciesFoodFactor,
  speciesRiskFactor,
} from "./biology";
import { deserialize, serialize } from "./storage";
import { travelEligibility } from "./wildlife";
const life = (id: string, age = speciesById(id).adultDay) => {
  const base = createGame(`biology-${id}`);
  if (!base.unlocked.includes(id)) base.unlocked.push(id);
  const s = startLife(base, {
    speciesId: id,
    year: 2020,
    seed: `biology-${id}`,
  });
  current(s)!.ageDays = age;
  current(s)!.stats.energy = 100;
  s.environment!.food = 1;
  return s;
};
const execute = (
  s: ReturnType<typeof life>,
  id: Parameters<typeof interact>[1],
) => interact(s, id);
const ready = (s: ReturnType<typeof life>, where: string) => {
  s.world!.activePatch = where;
  return s;
};
const bio = (s: ReturnType<typeof life>) => current(s)!.biology!;

describe("species have causal resource loops and capabilities", () => {
  it("bumblebees carry finite pollen, return it to the brood, and cannot depart into heavy rain", () => {
    let s = life("bumblebee");
    s.environment!.temperature = 20;
    s.world!.precipitation = 0;
    s = travel(s, "forage");
    s = execute(s, "biology:collect-pollen");
    expect(bio(s).stores.pollen).toBeGreaterThan(0);
    s = travel(s, "home");
    const brood = bio(s).stores.broodFood;
    s = execute(s, "biology:deliver-pollen");
    expect(bio(s).stores.pollen).toBe(0);
    expect(bio(s).stores.broodFood).toBeGreaterThan(brood);
    s.world!.precipitation = 25;
    s.phase = 0;
    expect(travelEligibility(s, "forage").allowed).toBe(false);
    expect(
      biologyActivities(ready(s, "forage")).some(
        (x) => x.id === "collect-pollen",
      ),
    ).toBe(false);
  });
  it("leaf fragments must be cultivated into fungus, and contamination damages that food system", () => {
    let s = life("ant");
    bio(s).stores.substrate = 0;
    bio(s).stores.fungus = 35;
    s = ready(s, "forage");
    const fungalBefore = bio(s).stores.fungus;
    s = execute(s, "cut-leaves");
    expect(bio(s).stores.substrate).toBeGreaterThan(0);
    expect(bio(s).stores.fungus).toBeLessThanOrEqual(fungalBefore + 0.2);
    s = travel(s, "home");
    const stock = bio(s).stores.substrate,
      food = bio(s).stores.fungus;
    s = execute(s, "tend-garden");
    expect(bio(s).stores.substrate).toBeLessThan(stock);
    expect(bio(s).stores.fungus).toBeGreaterThan(food);
    bio(s).stores.contamination = 80;
    s = execute(s, "biology:clear-waste");
    expect(bio(s).stores.contamination).toBeLessThan(60);
    const healthy = speciesFoodFactor(s);
    bio(s).stores.fungus = 0;
    expect(speciesFoodFactor(s)).toBeLessThan(healthy);
  });
  it("rabbits recover finite nutrients from earlier plant meals and improve an actual burrow", () => {
    let s = life("rabbit");
    bio(s).stores.fiber = 40;
    current(s)!.stats.hunger = 65;
    const plain = act(s, "rest"),
      digested = execute(s, "biology:digest-fiber");
    expect(current(digested)!.stats.hunger).toBeLessThan(
      current(plain)!.stats.hunger,
    );
    expect(bio(digested).stores.fiber).toBeLessThan(40);
    const cover = s.world!.patches[0].cover;
    s = execute(s, "biology:maintain-warren");
    expect(s.world!.patches[0].cover).toBeGreaterThan(cover);
    expect(bio(s).stores.burrow).toBeGreaterThan(55);
  });
  it("wolves spend named companions’ energy to gather and feed those same animals after a shared hunt", () => {
    let s = ready(life("wolf"), "forage");
    s = execute(s, "biology:rally-pack");
    const group = s.area!.animals.filter(
      (n) =>
        ["mother", "companion"].includes(n.role) && n.location === "forage",
    );
    expect(group.length).toBeGreaterThan(0);
    const energies = group.map((n) => n.energy);
    current(s)!.stats.hunger = 65;
    s.environment!.food = 1;
    s.rng = 1;
    const hunted = execute(s, "biology:pack-hunt");
    for (const [i, n] of group.entries())
      expect(
        hunted.area!.animals.find((x) => x.id === n.id)!.energy,
      ).toBeLessThan(energies[i]);
    expect(bio(hunted).skills["shared-meals"]).toBeGreaterThan(0);
    for (const n of group)
      expect(
        hunted.area!.animals.find((x) => x.id === n.id)!.hunger,
      ).toBeLessThan(n.hunger + 5);
  });
  it("elephants learn actual routes with relatives and draw from a finite water reserve", () => {
    let s = life("elephant", 1);
    s = execute(s, "biology:learn-water");
    s = execute(s, "biology:learn-water");
    expect(bio(s).skills["water:home"]).toBeGreaterThanOrEqual(3);
    current(s)!.ageDays = 1500;
    s = ready(s, "water");
    const reserve = bio(s).stores.groundwater,
      water = s.world!.patches.find((p) => p.id === "water")!.water;
    s.world!.patches.find((p) => p.id === "water")!.water = 0.3;
    s = execute(s, "biology:dig-water");
    expect(bio(s).stores.groundwater).toBeLessThan(reserve);
    expect(
      s.world!.patches.find((p) => p.id === "water")!.water,
    ).toBeGreaterThan(0.3);
    expect(water).toBeGreaterThan(0.3);
    s = execute(s, "biology:wallow");
    expect(bio(s).stores.mud).toBeGreaterThan(0);
  });
  it("mallards feed as ducklings but cannot fly over the open lake until flight develops", () => {
    const chick = life("mallard", 0);
    expect(biologyActivities(chick).some((x) => x.id === "dabble")).toBe(true);
    expect(travelEligibility(chick, "water").allowed).toBe(true);
    ready(chick, "forage");
    expect(travelEligibility(chick, "edge").allowed).toBe(false);
    current(chick)!.ageDays = 60;
    expect(travelEligibility(chick, "edge").allowed).toBe(true);
    const before = bio(chick).stores.plumage;
    const preened = execute(chick, "biology:preen");
    expect(bio(preened).stores.plumage).toBeGreaterThan(before);
    const nest = ready(life("mallard"), "home");
    bio(nest).stores.nest = 0;
    nest.date.day = 100;
    expect(reproductionPossible(nest)).toBe(false);
    const lined = execute(nest, "biology:line-nest");
    expect(bio(lined).stores.nest).toBeGreaterThan(0);
  });
  it("octopus settlement unlocks location-specific dens and camouflage that reduces, but never removes, risk", () => {
    const hatchling = life("octopus", 0);
    expect(biologyActivities(hatchling).some((x) => x.id === "claim-den")).toBe(
      false,
    );
    expect(travelEligibility(hatchling, "shade").allowed).toBe(false);
    let s = ready(life("octopus", 60), "shade");
    const risk = speciesRiskFactor(s);
    s = execute(s, "biology:claim-den");
    s = execute(s, "biology:blend-in");
    expect(speciesRiskFactor(s)).toBeLessThan(risk);
    expect(speciesRiskFactor(s)).toBeGreaterThan(0);
    expect(bio(s).stores["den:shade"]).toBeGreaterThan(0);
    const female = life("octopus");
    current(female)!.sex = "Female";
    current(female)!.pregnantUntil = 300;
    expect(availableActions(female)).not.toContain("feed");
    expect(biologyActivities(female).some((x) => x.id === "guard-eggs")).toBe(
      true,
    );
  });
  it("meerkat sentinel work helps named group members while helper work changes breeding access", () => {
    let s = ready(life("meerkat"), "forage");
    const member = s.area!.animals.find((n) => n.role === "companion")!;
    member.location = "forage";
    member.energy = 40;
    const before = speciesRiskFactor(s);
    s = execute(s, "biology:sentinel");
    expect(speciesRiskFactor(s)).toBeLessThan(before);
    expect(bio(s).stores.vigilance).toBeGreaterThan(0);
    ready(s, "home");
    s.area!.animals.find((n) => n.id === member.id)!.location = "home";
    current(s)!.stats.bond = 90;
    expect(reproductionPossible(s)).toBe(false);
    s = execute(s, "biology:help-pups");
    s = execute(s, "biology:help-pups");
    expect(reproductionPossible(s)).toBe(true);
  });
  it("bullfrogs switch food webs and routes at metamorphosis and can die when their pond dries", () => {
    let s = life("bullfrog", 364);
    ready(s, "forage");
    expect(travelEligibility(s, "edge").allowed).toBe(false);
    expect(biologyActivities(s).map((x) => x.id)).toContain("graze-algae");
    s.phase = 3;
    s = act(s, "rest");
    expect(bio(s).milestones).toContain("stage:Froglet");
    expect(biologyActivities(s).map((x) => x.id)).toContain("ambush");
    expect(travelEligibility(s, "edge").allowed).toBe(true);
    const dry = life("bullfrog", 20);
    dry.world!.water = 0;
    current(dry)!.stats.health = 3;
    const dead = act(dry, "rest");
    expect(current(dead)!.alive).toBe(false);
    expect(current(dead)!.cause).toBe("Pond drying");
    expect(reproductionPossible(life("bullfrog", 730))).toBe(false);
  });
  it("raccoons can draw on two different food webs and learn a route that lowers its travel cost", () => {
    let s = ready(life("raccoon"), "water");
    const prey = s.world!.prey;
    s = execute(s, "biology:probe-shallows");
    expect(s.world!.prey).toBeLessThan(prey);
    expect(bio(s).stores.dexterity).toBeGreaterThan(0);
    s = ready(s, "forage");
    const plants = s.world!.vegetation;
    s = execute(s, "biology:gather-fruit");
    expect(s.world!.vegetation).toBeLessThan(plants);
    const unfamiliar = travelEligibility(ready(s, "home"), "water").energy;
    ready(s, "water");
    s = execute(s, "biology:learn-route");
    expect(travelEligibility(ready(s, "home"), "water").energy).toBeLessThan(
      unfamiliar,
    );
  });
  it("foxes cache surplus at a location, cannot recover it elsewhere and consume it on retrieval", () => {
    let s = ready(life("fox"), "forage");
    bio(s).stores.parcel = 40;
    s = execute(s, "biology:bury-cache");
    expect(bio(s).stores.parcel).toBe(0);
    expect(bio(s).stores["cache:forage"]).toBeGreaterThan(30);
    const cache = bio(s).stores["cache:forage"];
    ready(s, "home");
    expect(() => execute(s, "biology:recover-cache")).toThrow();
    ready(s, "forage");
    current(s)!.stats.hunger = 70;
    s = execute(s, "biology:recover-cache");
    expect(bio(s).stores["cache:forage"]).toBeLessThan(cache);
    expect(current(s)!.stats.hunger).toBeLessThan(70);
  });
  it("robin song displaces an actual rival and finite reserves are consumed during cold nights", () => {
    let s = life("robin");
    const rival = s.area!.animals.find((n) => n.role === "rival")!;
    rival.location = "home";
    s = execute(s, "biology:sing");
    expect(bio(s).stores.territory).toBeGreaterThan(0);
    expect(s.area!.animals.find((n) => n.id === rival.id)!.location).not.toBe(
      "home",
    );
    s.phase = 3;
    s.environment!.temperature = 3;
    const fat = bio(s).stores.fat;
    s = act(s, "rest");
    expect(bio(s).stores.fat).toBeLessThan(fat);
    const empty = life("robin");
    empty.phase = 3;
    empty.environment!.temperature = 3;
    bio(empty).stores.fat = 0;
    const protectedBird = structuredClone(empty);
    bio(protectedBird).stores.fat = 60;
    expect(current(act(empty, "rest"))!.stats.health).toBeLessThan(
      current(act(protectedBird, "rest"))!.stats.health,
    );
  });
  it("seal pups can swim with a mother, but weaned seals must forage at sea and recover between dive bouts", () => {
    const pup = life("seal", 0);
    expect(travelEligibility(pup, "water").allowed).toBe(true);
    expect(biologyActivities(pup).map((x) => x.id)).not.toContain("deep-dive");
    let s = life("seal", 1460);
    expect(availableActions(s)).not.toContain("feed");
    expect(
      routineAction({
        ...s,
        family: {
          ...s.family,
          [s.currentId!]: {
            ...current(s)!,
            stats: { ...current(s)!.stats, hunger: 70 },
          },
        },
      }),
    ).toBe("move");
    s = ready(s, "edge");
    expect(biologyActivities(s).map((x) => x.id)).not.toContain("deep-dive");
    bio(s).skills.diving = 8;
    s = execute(s, "biology:deep-dive");
    expect(bio(s).stores.diveRecovery).toBeLessThan(60);
    s = execute(s, "biology:recover-dive");
    expect(bio(s).stores.diveRecovery).toBeGreaterThan(45);
  });
});

describe("cross-species integrity and progression", () => {
  for (const sp of SPECIES)
    it(`${sp.name} has a distinct behavior state, persistent experience and a unique earnable achievement`, () => {
      const s = life(sp.id);
      expect(SPECIES_RULES[sp.id].source).toMatch(/^https:/);
      expect(bio(s).stores).toMatchObject(SPECIES_RULES[sp.id].stores);
      expect(deserialize(serialize(s))).toEqual(JSON.parse(serialize(s)));
      const before = calculateRewards(current(s)!);
      const k = bio(s).skills;
      for (const key of [
        "activity:deliver-pollen",
        "garden-tended",
        "leaves-harvested",
        "activity:digest-fiber",
        "activity:maintain-warren",
        "shared-meals",
        "water:home",
        "water:water",
        "activity:dabble",
        "activity:preen",
        "activity:claim-den",
        "camouflage",
        "activity:sentinel",
        "activity:help-pups",
        "activity:ambush",
        "aquatic-search",
        "plant-search",
        "cache-recovery",
        "cold-nights",
        "activity:deep-dive",
      ])
        k[key] = 10;
      bio(s).milestones.push("stage:Froglet");
      const earned = calculateRewards(current(s)!);
      expect(earned.achievements).toContain(SPECIES_RULES[sp.id].achievement);
      expect(earned.coins).toBe(before.coins + 18);
    });
  it("Simple and Detailed modes share every species command, mortality roll, resource and reward", () => {
    for (const sp of SPECIES) {
      const simple = life(sp.id),
        detailed = structuredClone(simple);
      detailed.narration = "detailed";
      const a = advanceDays(simple, 2).state,
        b = advanceDays(detailed, 2).state;
      expect({ ...a, narration: "same" }).toEqual({ ...b, narration: "same" });
    }
  });
  it("migrates every v2 species without losing existing age, family, currency, unlocked pool or random state", () => {
    for (const sp of SPECIES) {
      const original = life(sp.id),
        old = JSON.parse(serialize(original));
      old.version = 2;
      delete old.area;
      delete old.narration;
      for (const individual of Object.values(old.family) as Record<
        string,
        unknown
      >[])
        delete individual.biology;
      old.coins = 137;
      const loaded = deserialize(JSON.stringify(old));
      expect(loaded.coins).toBe(137);
      expect(loaded.unlocked).toEqual(original.unlocked);
      expect(loaded.rng).toBe(original.rng);
      expect(current(loaded)!.ageDays).toBe(current(original)!.ageDays);
      expect(current(loaded)!.stats).toEqual(current(original)!.stats);
      expect(bio(loaded)).toBeDefined();
    }
  });
});

it("resolves a dive at the minimum eligible recovery without rejecting its own paid cost", () => {
  const s = ready(life("seal"), "water");
  bio(s).stores.diveRecovery = 25;
  const after = execute(s, "biology:shallow-dive");
  expect(after.phase).toBe(1);
  expect(bio(after).stores.diveRecovery).toBe(0);
  expect(biologyActivities(after).some((x) => x.id === "shallow-dive")).toBe(
    false,
  );
});
it("species interactions remain unavailable after permanent death", () => {
  const s = life("mallard");
  current(s)!.stats.health = 0;
  current(s)!.stats.hunger = 100;
  const dead = act(s, "rest");
  expect(current(dead)!.alive).toBe(false);
  expect(() => execute(dead, "biology:preen")).toThrow();
});
it("egg care has a real effect on the sampled octopus cohort at hatching", () => {
  const plain = life("octopus");
  current(plain)!.sex = "Female";
  current(plain)!.pregnantUntil = current(plain)!.ageDays + 1;
  current(plain)!.pendingOffspring = 8;
  plain.phase = 3;
  const guarded = structuredClone(plain);
  bio(guarded).stores.brood = 100;
  expect(current(act(guarded, "shelter"))!.children.length).toBeGreaterThan(
    current(act(plain, "shelter"))!.children.length,
  );
});

it("delivering pollen transfers it to brood food without turning protein food into nectar", () => {
  const s = life("bumblebee");
  bio(s).stores.pollen = 30;
  bio(s).stores.nectar = 25;
  const after = execute(s, "biology:deliver-pollen");
  expect(bio(after).stores.broodFood).toBeGreaterThan(bio(s).stores.broodFood);
  expect(bio(after).stores.nectar).toBe(bio(s).stores.nectar);
});
