import { ADVENTURES } from "../data/adventures";
import { speciesById } from "../data/species";
import type { GameState } from "./types";
/** Upcoming biological/family changes, never a reward timer or a survival shortcut. */
export function nextMoment(s: GameState): [number, string] | undefined {
  const a = s.family[s.currentId!],
    sp = speciesById(a.speciesId);
  const moments: [number, string][] = [...ADVENTURES[a.speciesId].moments];
  for (const stage of sp.stages)
    if (!moments.some((m) => m[0] === stage.fromDay))
      moments.push([
        stage.fromDay,
        `Growing into the ${stage.name.toLowerCase()} stage`,
      ]);
  if (a.pregnantUntil !== undefined)
    moments.push([
      Math.max(a.ageDays + 1, a.pregnantUntil),
      a.sex === "Male" ? "Your partner's young may arrive" : "Young may arrive",
    ]);
  for (const id of a.children) {
    const child = s.family[id];
    if (child?.alive && child.ageDays < sp.independence)
      moments.push([
        a.ageDays + sp.independence - child.ageDays,
        `${child.name} approaches independence`,
      ]);
  }
  return moments
    .filter(([day]) => day > a.ageDays)
    .sort((a, b) => a[0] - b[0])[0];
}
