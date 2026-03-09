/** Custom error for bracket generation issues */
export class BracketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BracketError";
  }
}

/** Validate participant IDs before bracket generation */
export function validateParticipants(
  ids: string[],
  options?: { minParticipants?: number }
): void {
  const min = options?.minParticipants ?? 2;

  if (ids.length < min) {
    throw new BracketError(
      `At least ${min} participants required, got ${ids.length}`
    );
  }

  for (let i = 0; i < ids.length; i++) {
    if (typeof ids[i] !== "string" || ids[i].trim() === "") {
      throw new BracketError(
        `Invalid participant ID at index ${i}: must be a non-empty string`
      );
    }
  }

  const seen = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    if (seen.has(ids[i])) {
      throw new BracketError(
        `Duplicate participant ID "${ids[i]}" at index ${i}`
      );
    }
    seen.add(ids[i]);
  }
}
