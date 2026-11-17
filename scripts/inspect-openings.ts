/** Diagnostic sampling, not a balance/fun certification. Run with tsx 4.21.0. */
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { SPECIES } from "../src/data/species";
import {
  advanceToOpportunity,
  createGame,
  current,
  respondToEncounter,
  startLife,
} from "../src/game/engine";
import { urgentNeed } from "../src/game/outcomes";
import { deserialize, serialize } from "../src/game/storage";
const targets: Record<string, number> = {
  bumblebee: 25,
  ant: 60,
  rabbit: 28,
  wolf: 21,
  elephant: 6,
  mallard: 1,
  octopus: 60,
  meerkat: 60,
  bullfrog: 5,
  raccoon: 70,
  fox: 60,
  robin: 14,
  seal: 28,
};
const rows = [];
for (const sp of SPECIES)
  for (let sample = 0; sample < 4; sample++) {
    const seed = `phase3c-sample-${sp.id}-${sample}`,
      base = createGame();
    if (!base.unlocked.includes(sp.id)) base.unlocked.push(sp.id);
    let s = startLife(base, { speciesId: sp.id, year: 2020, seed }),
      commands = 0,
      phases = 0;
    for (
      ;
      commands < 40 &&
      current(s)!.alive &&
      current(s)!.ageDays < targets[sp.id];
      commands++
    ) {
      if (
        s.area?.encounter?.status === "active" &&
        s.area.encounter.kind !== "companion"
      ) {
        s = respondToEncounter(s, "observe");
        phases++;
      } else {
        const next = advanceToOpportunity(s);
        s = next.state;
        phases += next.phases;
        if (!next.phases) break;
      }
    }
    const saved = serialize(s),
      loaded = deserialize(saved);
    assert.deepEqual(
      JSON.parse(serialize(loaded)),
      JSON.parse(saved),
      `Save round-trip mismatch: ${seed}`,
    );
    const a = current(s)!;
    rows.push({
      species: sp.id,
      seed,
      target: targets[sp.id],
      commands,
      phases,
      age: a.ageDays,
      stage: a.biology!.stage,
      alive: a.alive,
      reached: a.alive && a.ageDays >= targets[sp.id],
      cause: a.cause ?? null,
      need: urgentNeed(s) ?? null,
    });
  }
const summary = SPECIES.map((sp) => {
  const group = rows.filter((r) => r.species === sp.id);
  return {
    species: sp.id,
    samples: group.length,
    reached: group.filter((r) => r.reached).length,
    died: group.filter((r) => !r.alive).length,
    stillGrowing: group.filter((r) => r.alive && !r.reached).length,
    causes: group.filter((r) => !r.alive).map((r) => r.cause),
  };
});
const report = {
  policy:
    "Four fixed 2020 seeds per species. Routine simulated care to the stated early opportunity; observe non-companion encounters. Forty-command limit. Unlock availability prepared for pack species. No age, food, weather, NPC, or RNG adjustments. Not human play or an estimate of population survival.",
  summary,
  rows,
};
if (process.argv[2])
  await writeFile(process.argv[2], JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
