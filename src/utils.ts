/**
 * Seed participants into bracket positions.
 * Fills positions sequentially, remaining slots are null (byes).
 */
export function seedParticipants(
  ids: string[],
  bracketSize: number
): (string | null)[] {
  const seeded: (string | null)[] = new Array(bracketSize).fill(null);

  for (let i = 0; i < ids.length; i++) {
    seeded[i] = ids[i];
  }

  return seeded;
}
