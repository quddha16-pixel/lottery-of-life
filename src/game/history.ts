import { daysInYear } from "./calendar";
import { pick, random } from "./random";
import type {
  Environment,
  HistoricalContext,
  Species,
  WorldDate,
} from "./types";
export const MIN_YEAR = -4_500_000_000;
export const MAX_YEAR = 100_000;
export function contextAt(year: number): HistoricalContext {
  const ancient = year < -9700;
  const industrial = Math.max(0, Math.min(1, (year - 1800) / 226));
  const cultivation = Math.max(0, Math.min(1, (year + 6000) / 8000));
  return {
    epoch: ancient
      ? "Late Pleistocene"
      : year < -3000
        ? "Early–middle Holocene"
        : year < 1800
          ? "Late Holocene"
          : "Industrial era",
    description: ancient
      ? "Broad refugial habitats; shifting cold and warm climatic mosaics."
      : year < 1800
        ? "Seasonal ecosystems with gradually changing human land use."
        : "Increasing human land use, fragmentation and warming pressure.",
    climateOffset: ancient
      ? -2.5 - 1.5 * Math.cos(((year + 19000) / 41000) * Math.PI * 2)
      : industrial * 1.2,
    richness: ancient ? 0.9 : 1 - cultivation * 0.025 - industrial * 0.1,
    pressure: ancient ? 0.015 : 0.025 + cultivation * 0.06 + industrial * 0.38,
    approximation:
      "Broad ecological reconstruction. Supported bounds are conservative content windows, not precise species origins; calendar days are proleptic Gregorian abstractions.",
  };
}
export function sampleYear(
  rng: { rng: number },
  range: [number, number],
): number {
  const [from, to] = range;
  if (
    !Number.isSafeInteger(from) ||
    !Number.isSafeInteger(to) ||
    from < MIN_YEAR ||
    to > MAX_YEAR ||
    from > to
  )
    throw new Error("Invalid supported historical range");
  return from + Math.floor(random(rng) * (to - from + 1));
}
export function generateBirthContext(
  rng: { rng: number },
  species: Species,
  yearOverride?: number,
): { date: WorldDate; environment: Environment; circumstances: string } {
  const year = yearOverride ?? sampleYear(rng, species.existence);
  if (
    !Number.isSafeInteger(year) ||
    year < species.existence[0] ||
    year > species.existence[1]
  )
    throw new Error("Species is unavailable in this period");
  const compatible = species.history.habitats.filter(
    (h) => h.from <= year && h.to >= year,
  );
  if (!compatible.length)
    throw new Error("No supported habitat for this species and period");
  const selected = pick(rng, compatible);
  const { from: _from, to: _to, richness, ...location } = selected;
  const length = daysInYear(year);
  const window = species.history.birthWindow;
  const rawDay = window
    ? window[0] + Math.floor(random(rng) * (window[1] - window[0] + 1))
    : Math.floor(random(rng) * length);
  const day =
    window && location.hemisphere === "south"
      ? (rawDay + Math.floor(length / 2)) % length
      : rawDay;
  const date = { year, day };
  const history = contextAt(year);
  history.richness *= richness;
  const familyIndex = Math.floor(random(rng) * species.history.family.length);
  const circumstances = species.history.family[familyIndex];
  const careQuality =
    familyIndex === 0 ? 0.88 + random(rng) * 0.12 : 0.65 + random(rng) * 0.2;
  const seasonal =
    Math.sin(((date.day - 80) / daysInYear(year)) * Math.PI * 2) *
    (location.hemisphere === "south" ? -1 : 1);
  const amplitude =
    location.climate === "marine" ? 3 : location.climate === "tropical" ? 3 : 8;
  const temperature =
    location.temperature +
    history.climateOffset * (location.climate === "tropical" ? 0.4 : 1) +
    seasonal * amplitude;
  return {
    date,
    circumstances,
    environment: {
      scenarioId: "continuous",
      location,
      history,
      careQuality,
      temperature,
      food: Math.max(0.2, Math.min(1, species.food * history.richness)),
      pressure: history.pressure,
      weather:
        temperature > species.heat - 3
          ? "Hot"
          : temperature < species.cold + 3
            ? "Cold"
            : "Fair",
    },
  };
}
