import type { MatchSeed } from "./types";

/**
 * Generate a Swiss-system tournament schedule.
 *
 * Swiss pairs players with similar records each round.
 * All players play every round (no elimination).
 * Default number of rounds: ceil(log2(n)).
 *
 * Since bracket-engine generates matches BEFORE the tournament starts,
 * only Round 1 can be fully paired (randomly or by seed order).
 * Rounds 2+ are generated with null players — the app must fill them
 * dynamically based on standings after each round.
 *
 * @param participantIds - Array of participant IDs
 * @param numRounds - Number of rounds (default: ceil(log2(n)))
 * @returns Array of match seeds with round 1 paired, rounds 2+ as placeholders
 */
export function generateSwiss(
  participantIds: string[],
  numRounds?: number
): MatchSeed[] {
  const n = participantIds.length;
  if (n < 2) return [];

  const rounds =
    numRounds ?? Math.max(1, Math.ceil(Math.log2(n)));

  const hasBye = n % 2 !== 0;
  const matchesPerRound = Math.floor(n / 2);

  const matches: MatchSeed[] = [];
  let matchNumber = 1;

  // Round 1: pair by seed order (1v2, 3v4, 5v6, ...)
  for (let i = 0; i < matchesPerRound; i++) {
    matches.push({
      round: 1,
      match_number: matchNumber++,
      player1_id: participantIds[i * 2],
      player2_id: participantIds[i * 2 + 1],
      bracket_type: "winners",
      next_match_index: null,
      loser_next_match_index: null,
    });
  }

  // Rounds 2+: placeholder matches (app fills players based on standings)
  for (let round = 2; round <= rounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      matches.push({
        round,
        match_number: matchNumber++,
        player1_id: null,
        player2_id: null,
        bracket_type: "winners",
        next_match_index: null,
        loser_next_match_index: null,
      });
    }
  }

  return matches;
}
