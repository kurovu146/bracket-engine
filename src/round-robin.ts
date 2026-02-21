import type { MatchSeed } from "./types";

/**
 * Generate a round-robin schedule where every participant plays every other.
 * Uses the circle method (fix first participant, rotate the rest).
 * Handles odd numbers by adding a virtual bye participant.
 *
 * @param participantIds - Array of participant IDs
 * @returns Array of matches (no linking, each match is standalone)
 */
export function generateRoundRobin(participantIds: string[]): MatchSeed[] {
  const n = participantIds.length;
  if (n < 2) return [];

  const ids = [...participantIds];
  const hasBye = n % 2 !== 0;
  if (hasBye) ids.push("__bye__");

  const totalParticipants = ids.length;
  const totalRounds = totalParticipants - 1;
  const matchesPerRound = totalParticipants / 2;
  const matches: MatchSeed[] = [];

  let matchNumber = 1;

  const fixed = ids[0];
  const rotating = ids.slice(1);

  for (let round = 0; round < totalRounds; round++) {
    const currentOrder = [fixed, ...rotating];

    for (let i = 0; i < matchesPerRound; i++) {
      const p1 = currentOrder[i];
      const p2 = currentOrder[totalParticipants - 1 - i];

      // Skip bye matches
      if (p1 === "__bye__" || p2 === "__bye__") continue;

      matches.push({
        round: round + 1,
        match_number: matchNumber++,
        player1_id: p1,
        player2_id: p2,
        bracket_type: "winners",
        next_match_index: null,
        loser_next_match_index: null,
      });
    }

    // Rotate: move last to front (after fixed)
    rotating.unshift(rotating.pop()!);
  }

  return matches;
}
