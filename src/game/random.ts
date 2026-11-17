export function seedFromText(text: string): number {
  let hash = 2166136261;
  for (const char of text)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function random(state: { rng: number }): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let value = state.rng;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}
export function pick<T>(state: { rng: number }, values: readonly T[]): T {
  if (!values.length) throw new Error("Cannot select from an empty pool");
  return values[Math.floor(random(state) * values.length)];
}
