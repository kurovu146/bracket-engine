import type { MatchSeed, RoundRobinOptions } from "./types";
import { validateParticipants } from "./errors";
import { generateMatchId } from "./match-id";
import { resolveRoundName } from "./round-names";

// Use a Symbol as the bye sentinel to avoid collision with real participant IDs
// (e.g. a participant named "__bye__" would collide with a string sentinel)
const BYE_SENTINEL = Symbol("bye");

/**
 * Generate one pass of round-robin rounds using the circle method.
 * Fix the first participant, rotate the rest each round.
 *
 * @param ids              - Participant array (even length; bye sentinel already appended if needed)
 * @param roundsPerPass    - Number of rounds in this pass (= ids.length - 1)
 * @param totalRoundsAll   - Total rounds across all passes (used for round_name resolution)
 * @param bestOf           - best_of value for every match, or null
 * @param roundOffset      - Added to the loop's round index so second pass continues numbering
 * @param matchNumberStart - match_number for the first match produced in this pass
 */
function generatePass(
  ids: (string | symbol)[],
  roundsPerPass: number,
  totalRoundsAll: number,
  bestOf: number | null,
  roundOffset: number,
  matchNumberStart: number
): MatchSeed[] {
  const totalParticipants = ids.length; // always even
  const matchesPerRound = totalParticipants / 2;
  const matches: MatchSeed[] = [];

  let matchNumber = matchNumberStart;

  const fixed = ids[0];
  const rotating = ids.slice(1);

  for (let round = 0; round < roundsPerPass; round++) {
    const absoluteRound = round + 1 + roundOffset;
    const currentOrder = [fixed, ...rotating];
    let matchInRound = 0;

    for (let i = 0; i < matchesPerRound; i++) {
      const p1 = currentOrder[i];
      const p2 = currentOrder[totalParticipants - 1 - i];

      // Skip bye matches — they are not included in output
      if (typeof p1 === "symbol" || typeof p2 === "symbol") continue;

      matchInRound++;

      matches.push({
        match_id: generateMatchId("round_robin", absoluteRound, matchInRound),
        round: absoluteRound,
        match_number: matchNumber++,
        player1_id: p1,
        player2_id: p2,
        bracket_type: "round_robin",
        next_match_index: null,
        loser_next_match_index: null,
        next_match_slot: null,
        loser_next_match_slot: null,
        round_name: resolveRoundName("round_robin", absoluteRound, totalRoundsAll),
        is_bye: false,
        best_of: bestOf,
      });
    }

    // Rotate: move last element to front of the rotating array
    rotating.unshift(rotating.pop()!);
  }

  return matches;
}

/**
 * Generate a round-robin schedule where every participant plays every other.
 * Uses the circle method (fix first participant, rotate the rest).
 * Handles odd numbers by adding a virtual bye sentinel (Symbol, never a string).
 * Bye matches are filtered out — all returned matches have real players on both sides.
 *
 * @param participantIds - Array of participant IDs
 * @param options        - Optional configuration (doubleRoundRobin, bestOf)
 * @returns Array of matches (no linking, each match is standalone)
 */
export function generateRoundRobin(
  participantIds: string[],
  options?: RoundRobinOptions
): MatchSeed[] {
  if (participantIds.length < 2) return [];

  // Validates: no empty strings, no duplicates
  validateParticipants(participantIds);

  const bestOf = options?.bestOf?.default ?? null;
  const isDouble = options?.doubleRoundRobin ?? false;

  const ids: (string | symbol)[] = [...participantIds];
  if (ids.length % 2 !== 0) ids.push(BYE_SENTINEL);

  const roundsPerPass = ids.length - 1;
  // For round_name resolution: round-robin just uses "Round N" regardless of
  // totalRounds, so the value doesn't matter for naming — but we pass the true
  // total for consistency with the resolveRoundName contract.
  const totalRoundsAll = isDouble ? roundsPerPass * 2 : roundsPerPass;

  const firstPass = generatePass(ids, roundsPerPass, totalRoundsAll, bestOf, 0, 1);

  if (!isDouble) {
    return firstPass;
  }

  // Second pass: same schedule but player1/player2 swapped (home/away reversal).
  // Round numbers continue: offset = roundsPerPass so rounds go N+1 .. 2N.
  const secondPassRaw = generatePass(
    ids,
    roundsPerPass,
    totalRoundsAll,
    bestOf,
    roundsPerPass,
    firstPass.length + 1
  );

  // Swap home/away for second leg
  const secondPass = secondPassRaw.map((m) => ({
    ...m,
    player1_id: m.player2_id,
    player2_id: m.player1_id,
  }));

  return [...firstPass, ...secondPass];
}
