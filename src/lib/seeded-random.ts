/**
 * Deterministic PRNG. Every fixture and every simulated latency derives from a
 * fixed seed, so screenshots are reproducible and a flaky test is a real
 * failure rather than an unlucky roll (SPEC §9).
 */
export function mulberry32(seed: number): () => number {
  let state = seed;
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  float(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  bool(probability?: number): boolean;
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  const rng: Rng = {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max) => next() * (max - min) + min,
    pick: <T,>(items: readonly T[]): T => {
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) throw new Error("createRng.pick called with an empty list");
      return item;
    },
    bool: (probability = 0.5) => next() < probability,
    shuffle: <T,>(items: readonly T[]): T[] => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const a = copy[i];
        const b = copy[j];
        if (a === undefined || b === undefined) continue;
        copy[i] = b;
        copy[j] = a;
      }
      return copy;
    },
  };
  return rng;
}
