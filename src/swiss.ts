import type { MatchSeed, SwissOptions } from "./types";
import { validateParticipants } from "./errors";
import { generateMatchId } from "./match-id";
import { resolveRoundName } from "./round-names";

/**
 * Generate a Swiss-system tournament schedule.
 *
 * Swiss pairs players with similar records each round.
 * All players play every round (no elimination).
 * Default number of rounds: ceil(log2(n)).
 *
 * Since bracket-engine generates matches BEFORE the tournament starts,
 * only Round 1 can be fully paired (by seed order).
 * Rounds 2+ are generated with null players — the app must fill them
 * dynamically based on standings after each round.
 *
 * @param participantIds - Array of participant IDs
 * @param numRoundsOrOptions - Number of rounds (legacy), or SwissOptions object
 * @returns Array of match seeds with round 1 paired, rounds 2+ as placeholders
 */
export function generateSwiss(
  participantIds: string[],
  numRoundsOrOptions?: number | SwissOptions
): MatchSeed[] {
  if (participantIds.length < 2) return [];
  validateParticipants(participantIds);

  // Resolve options from either legacy number arg or options object
  let numRounds: number | undefined;
  let bestOfDefault: number | null = null;

  if (typeof numRoundsOrOptions === "number") {
    numRounds = numRoundsOrOptions;
  } else if (typeof numRoundsOrOptions === "object" && numRoundsOrOptions !== null) {
    numRounds = numRoundsOrOptions.numRounds;
    bestOfDefault = numRoundsOrOptions.bestOf?.default ?? null;
  }

  const n = participantIds.length;
  const totalRounds = numRounds ?? Math.max(1, Math.ceil(Math.log2(n)));
  const matchesPerRound = Math.floor(n / 2);

  const matches: MatchSeed[] = [];
  let matchNumber = 1;

  // Round 1: pair by seed order (1v2, 3v4, 5v6, ...)
  for (let i = 0; i < matchesPerRound; i++) {
    const matchInRound = i + 1;
    matches.push({
      match_id: generateMatchId("swiss", 1, matchInRound),
      round: 1,
      match_number: matchNumber++,
      player1_id: participantIds[i * 2],
      player2_id: participantIds[i * 2 + 1],
      bracket_type: "swiss",
      next_match_index: null,
      loser_next_match_index: null,
      next_match_slot: null,
      loser_next_match_slot: null,
      round_name: resolveRoundName("swiss", 1, totalRounds),
      is_bye: false,
      best_of: bestOfDefault,
    });
  }

  // Rounds 2+: placeholder matches (app fills players based on standings)
  for (let round = 2; round <= totalRounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const matchInRound = i + 1;
      matches.push({
        match_id: generateMatchId("swiss", round, matchInRound),
        round,
        match_number: matchNumber++,
        player1_id: null,
        player2_id: null,
        bracket_type: "swiss",
        next_match_index: null,
        loser_next_match_index: null,
        next_match_slot: null,
        loser_next_match_slot: null,
        round_name: resolveRoundName("swiss", round, totalRounds),
        is_bye: false,
        best_of: bestOfDefault,
      });
    }
  }

  return matches;
}
