import { z } from "zod";
import { SPECIES, STARTERS } from "../data/species";
import { contextAt } from "./history";
import { createWorld, ensureIndividualExperience } from "./world";
import { daysInYear } from "./calendar";
import type { GameState } from "./types";
const finite = z.number().finite();
const whole = finite.int().nonnegative();
const meter = finite.min(0).max(100);
const speciesId = z.string().refine((id) => SPECIES.some((sp) => sp.id === id));
const date = z
  .object({
    year: finite.int().min(-4500000000).max(100000),
    day: whole.max(365),
  })
  .refine((d) => d.day < daysInYear(d.year));
const traits = z.object({
  resilience: meter,
  perception: meter,
  sociability: meter,
});
const stats = z.object({
  health: meter,
  hunger: meter,
  hydration: meter,
  energy: meter,
  stress: meter,
  injury: meter,
  bond: meter,
});
const individual = z
  .object({
    id: z.string(),
    speciesId,
    name: z.string().max(100),
    sex: z.enum(["Female", "Male"]),
    caste: z.string().optional(),
    birth: date,
    ageDays: whole,
    traits,
    stats,
    circumstances: z.string().optional(),
    personality: z
      .object({
        caution: meter,
        curiosity: meter,
        learning: meter,
        stressResponse: meter,
      })
      .optional(),
    experience: z
      .object({ foraging: meter, habitatKnowledge: meter, dangerMemory: meter })
      .optional(),
    parentId: z.string().optional(),
    generation: whole.min(1),
    alive: z.boolean(),
    death: date.optional(),
    cause: z.string().optional(),
    lastReproduction: whole.optional(),
    pregnantUntil: whole.optional(),
    pendingOffspring: whole.max(100).optional(),
    children: z.array(z.string()),
    independentYoung: whole,
    explored: whole,
    colonyService: whole,
  })
  .refine((a) => (a.alive ? !a.death && !a.cause : !!a.death && !!a.cause));
const schema = z
  .object({
    version: z.union([z.literal(1), z.literal(2)]),
    pacing: z.enum(["immersive", "balanced", "story"]).default("immersive"),
    world: z
      .object({
        model: z.literal(1),
        rng: whole.max(4294967295).default(0),
        elapsedDays: whole,
        precipitation: finite.min(0).max(100),
        daylight: finite.min(0).max(24),
        season: z.string(),
        moisture: finite.min(0).max(1),
        water: finite.min(0).max(1),
        vegetation: finite.min(0).max(1),
        prey: finite.min(0).max(1),
        predators: finite.min(0).max(1),
        competition: finite.min(0).max(1),
        habitat: finite.min(0).max(1),
        activePatch: z.string(),
        patches: z
          .array(
            z.object({
              id: z.string(),
              label: z.string(),
              food: finite.min(0).max(1),
              water: finite.min(0).max(1),
              cover: finite.min(0).max(1),
            }),
          )
          .min(1)
          .max(20),
        situations: z
          .array(
            z.object({
              id: z.string(),
              kind: z.enum([
                "drought",
                "food-shortage",
                "predator-pressure",
                "flood",
                "breeding",
              ]),
              began: date,
              days: whole,
              severity: finite.min(0).max(1),
              cause: z.string(),
              status: z.enum(["active", "resolved"]),
              involvement: whole,
              outcome: z.string().optional(),
            }),
          )
          .max(30),
      })
      .refine(
        (w) =>
          w.patches.some((p) => p.id === w.activePatch) &&
          new Set(w.patches.map((p) => p.id)).size === w.patches.length,
      )
      .optional(),
    rng: whole.max(4294967295),
    serial: whole,
    coins: whole.max(1000000000),
    unlocked: z.array(speciesId),
    achievements: z.array(z.string()),
    date,
    phase: whole.max(3),
    environment: z
      .object({
        scenarioId: z
          .string()
          .refine(
            (id) =>
              id === "continuous" || ["1900", "1980", "2020"].includes(id),
          ),
        location: z.object({
          continent: z.string(),
          region: z.string(),
          place: z.string(),
          habitat: z.string(),
          temperature: finite,
          id: z.string().optional(),
          hemisphere: z.enum(["north", "south", "equatorial"]).optional(),
          climate: z
            .enum(["temperate", "tropical", "arid", "marine"])
            .optional(),
          precision: z.enum(["regional", "local"]).optional(),
        }),
        temperature: finite,
        food: finite.min(0).max(1),
        pressure: finite.min(0).max(1),
        weather: z.string(),
        careQuality: finite.min(0).max(1).optional(),
        history: z
          .object({
            epoch: z.string(),
            description: z.string(),
            climateOffset: finite,
            richness: finite.min(0).max(2),
            pressure: finite.min(0).max(1),
            approximation: z.string(),
          })
          .optional(),
      })
      .optional(),
    currentId: z.string().optional(),
    family: z.record(z.string(), individual),
    journal: z
      .array(
        z.object({
          id: whole,
          date,
          phase: z.enum(["Morning", "Afternoon", "Evening", "Night"]),
          age: whole,
          text: z.string(),
          kind: z.enum(["birth", "routine", "milestone", "danger", "death"]),
          individualId: z.string(),
        }),
      )
      .max(2000),
    records: z.array(
      z.object({
        individualId: z.string(),
        speciesId,
        name: z.string(),
        birth: date,
        death: date,
        age: whole,
        cause: z.string(),
        score: whole,
        coins: whole,
        achievements: z.array(z.string()),
        offspring: whole,
        surviving: whole,
      }),
    ),
    priority: z.enum(["survival", "feeding", "reproduction", "exploration"]),
    lastPack: z
      .object({ speciesId, duplicate: z.boolean(), refund: whole })
      .optional(),
  })
  .superRefine((s, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (
      !STARTERS.every((id) => s.unlocked.includes(id)) ||
      new Set(s.unlocked).size !== s.unlocked.length
    )
      fail("Invalid unlocked collection");
    if (s.currentId && (!s.family[s.currentId] || !s.environment))
      fail("Active life is incomplete");
    for (const [id, a] of Object.entries(s.family)) {
      if (id !== a.id || !s.unlocked.includes(a.speciesId))
        fail("Invalid individual identity");
      if (
        a.parentId &&
        (!s.family[a.parentId] ||
          s.family[a.parentId].generation !== a.generation - 1 ||
          s.family[a.parentId].speciesId !== a.speciesId ||
          !s.family[a.parentId].children.includes(a.id))
      )
        fail("Invalid parentage");
      if (!a.children.every((child) => s.family[child]?.parentId === a.id))
        fail("Missing offspring");
    }
    const recordIds = s.records.map((r) => r.individualId);
    if (new Set(recordIds).size !== recordIds.length)
      fail("Duplicate lifetime rewards");
    if (
      s.records.some(
        (r) => !s.family[r.individualId] || s.family[r.individualId].alive,
      )
    )
      fail("Invalid lifetime record");
    if (s.journal.some((entry) => !s.family[entry.individualId]))
      fail("Invalid journal individual");
  });
// Preserve the Phase 1 storage key so the branding change does not discard existing saves.
export const SAVE_KEY = "life-simulator.save.v1";
export const BACKUP_KEY = `${SAVE_KEY}.backup`;
export function serialize(s: GameState): string {
  return JSON.stringify(s);
}
export function deserialize(text: string): GameState {
  if (text.length > 5000000) throw new Error("Save exceeds 5 MB");
  const result = schema.safeParse(JSON.parse(text));
  if (!result.success)
    throw new Error(
      "Save is damaged or from an unsupported version. Version 1 or 2 saves are required.",
    );
  const migrated: GameState = { ...result.data, version: 2 };
  for (const a of Object.values(migrated.family)) ensureIndividualExperience(a);
  if (migrated.currentId && migrated.environment) {
    const location = migrated.environment.location;
    const species = SPECIES.find(
      (sp) => sp.id === migrated.family[migrated.currentId!].speciesId,
    )!;
    const template =
      species.history.habitats.find(
        (h) => h.continent === location.continent,
      ) ?? species.history.habitats[0];
    location.climate ??= template.climate;
    location.hemisphere ??=
      location.region === "Southern Africa" ? "south" : template.hemisphere;
    migrated.environment.history ??= contextAt(migrated.date.year);
    migrated.environment.careQuality ??= 0.85;
    migrated.environment.scenarioId = "continuous";
    migrated.world ??= createWorld(migrated);
  }
  return migrated;
}
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export function loadGame(storage: StorageLike): {
  state?: GameState;
  warning?: string;
  blocked?: boolean;
} {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return {};
    try {
      return { state: deserialize(raw) };
    } catch {
      const backup = storage.getItem(BACKUP_KEY);
      if (backup)
        try {
          return {
            state: deserialize(backup),
            warning:
              "Recovered the previous valid save. The most recent save was unreadable.",
          };
        } catch {
          /* Preserve unreadable data for manual recovery. */
        }
      return {
        warning:
          "This save could not be read. Autosave is paused to preserve it. Import a valid backup or explicitly reset in Settings.",
        blocked: true,
      };
    }
  } catch {
    return {
      warning:
        "Browser storage is unavailable. Export your save before leaving.",
      blocked: true,
    };
  }
}
export function persistGame(s: GameState, storage: StorageLike): void {
  const previous = storage.getItem(SAVE_KEY);
  if (previous)
    try {
      deserialize(previous);
      storage.setItem(BACKUP_KEY, previous);
    } catch {
      /* Never replace a valid backup with corrupt bytes. */
    }
  storage.setItem(SAVE_KEY, serialize(s));
}
