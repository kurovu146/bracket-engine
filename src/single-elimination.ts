import type { MatchSeed } from "./types";
import { seedParticipants } from "./utils";

/**
 * Generate a single elimination (knockout) bracket.
 * Supports byes for non-power-of-2 participant counts.
 *
 * @param participantIds - Array of participant IDs in seed order
 * @returns Array of matches with linking information
 */
export function generateSingleElimination(
  participantIds: string[]
): MatchSeed[] {
  const n = participantIds.length;
  if (n < 2) return [];

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const totalRounds = Math.log2(bracketSize);

  const seeded = seedParticipants(participantIds, bracketSize);
  const matches: MatchSeed[] = [];
  let matchNumber = 1;

  // Generate first round
  const firstRoundMatches = bracketSize / 2;

  for (let i = 0; i < firstRoundMatches; i++) {
    matches.push({
      round: 1,
      match_number: matchNumber++,
      player1_id: seeded[i * 2],
      player2_id: seeded[i * 2 + 1],
      bracket_type: "winners",
      next_match_index: null,
      loser_next_match_index: null,
    });
  }

  // Generate subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
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

  // Link matches: winner advances to next round
  let prevRoundStart = 0;
  for (let round = 1; round < totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    const nextRoundStart = prevRoundStart + matchesInRound;

    for (let i = 0; i < matchesInRound; i++) {
      matches[prevRoundStart + i].next_match_index =
        nextRoundStart + Math.floor(i / 2);
    }

    prevRoundStart = nextRoundStart;
  }

  return matches;
}
