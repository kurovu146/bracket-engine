/**
 * Generate standard tournament seed positions for a given bracket size.
 * Returns an array of seed numbers (1-based) in bracket position order.
 *
 * For bracketSize=8: [1, 8, 4, 5, 2, 7, 3, 6]
 * Meaning: position 0 = seed 1, position 1 = seed 8, etc.
 * Matchups: (pos 0 vs pos 1) = seed 1 vs 8, (pos 2 vs pos 3) = seed 4 vs 5, etc.
 */
export function generateSeedOrder(bracketSize: number): number[] {
  let seeds = [1, 2];

  while (seeds.length < bracketSize) {
    const roundSize = seeds.length * 2;
    const expanded: number[] = [];
    for (const seed of seeds) {
      expanded.push(seed, roundSize + 1 - seed);
    }
    seeds = expanded;
  }

  return seeds;
}

/**
 * Seed participants into bracket positions using standard tournament seeding.
 * Top seeds get byes for non-power-of-2 participant counts.
 *
 * @param ids - Participant IDs in seed order (index 0 = seed 1)
 * @param bracketSize - Must be a power of 2
 * @returns Array of participant IDs (or null for byes) in bracket position order
 */
export function standardSeed(
  ids: string[],
  bracketSize: number
): (string | null)[] {
  const seedOrder = generateSeedOrder(bracketSize);
  const result: (string | null)[] = new Array(bracketSize).fill(null);

  for (let i = 0; i < bracketSize; i++) {
    const seedNumber = seedOrder[i]; // 1-based seed number at this position
    if (seedNumber <= ids.length) {
      result[i] = ids[seedNumber - 1]; // ids is 0-based
    }
    // else: remains null (bye)
  }

  return result;
}
