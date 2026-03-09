import type { BracketType, BestOfConfig, MatchSeed, MatchSlot, SingleEliminationOptions } from "./types";
import { validateParticipants } from "./errors";
import { standardSeed } from "./seeding";
import { generateMatchId } from "./match-id";
import { resolveRoundName } from "./round-names";

/**
 * Resolve best-of count for a specific match based on config.
 * Bracket type and round name are checked in priority order.
 */
function resolveBestOf(
  bracketType: BracketType,
  roundName: string | null,
  bestOfConfig?: BestOfConfig
): number | null {
  if (!bestOfConfig) return null;
  if (bracketType === "third_place" && bestOfConfig.thirdPlace != null) {
    return bestOfConfig.thirdPlace;
  }
  if (roundName === "Final" && bestOfConfig.final != null) {
    return bestOfConfig.final;
  }
  return bestOfConfig.default ?? null;
}

/**
 * Generate a single elimination (knockout) bracket.
 * Supports byes for non-power-of-2 participant counts.
 * Top seeds receive byes per standard tournament seeding.
 *
 * @param participantIds - Participant IDs in seed order (index 0 = seed 1)
 * @param options - Optional configuration for 3rd place match and best-of
 * @returns Array of MatchSeed with full linking and metadata
 */
export function generateSingleElimination(
  participantIds: string[],
  options?: SingleEliminationOptions
): MatchSeed[] {
  // Backward-compat: n < 2 returns [] without throwing
  if (participantIds.length < 2) return [];

  // Validates for empty strings and duplicates (not for n < 2)
  validateParticipants(participantIds);

  const n = participantIds.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const totalRounds = Math.log2(bracketSize);

  const seeded = standardSeed(participantIds, bracketSize);
  const matches: MatchSeed[] = [];
  let matchNumber = 1;

  // --- Round 1 ---
  const firstRoundCount = bracketSize / 2;

  for (let i = 0; i < firstRoundCount; i++) {
    const p1 = seeded[i * 2];
    const p2 = seeded[i * 2 + 1];
    const roundName = resolveRoundName("winners", 1, totalRounds);
    const matchInRound = i + 1; // 1-based within the round

    matches.push({
      match_id: generateMatchId("winners", 1, matchInRound),
      round: 1,
      match_number: matchNumber++,
      player1_id: p1,
      player2_id: p2,
      bracket_type: "winners",
      next_match_index: null,
      loser_next_match_index: null,
      next_match_slot: null,    // filled in the linking pass
      loser_next_match_slot: null,
      round_name: roundName,
      is_bye: p1 === null || p2 === null,
      best_of: resolveBestOf("winners", roundName, options?.bestOf),
    });
  }

  // --- Subsequent rounds ---
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    const roundName = resolveRoundName("winners", round, totalRounds);

    for (let i = 0; i < matchesInRound; i++) {
      const matchInRound = i + 1;

      matches.push({
        match_id: generateMatchId("winners", round, matchInRound),
        round,
        match_number: matchNumber++,
        player1_id: null,
        player2_id: null,
        bracket_type: "winners",
        next_match_index: null,
        loser_next_match_index: null,
        next_match_slot: null,
        loser_next_match_slot: null,
        round_name: roundName,
        is_bye: false,  // byes only occur in round 1 with standard seeding
        best_of: resolveBestOf("winners", roundName, options?.bestOf),
      });
    }
  }

  // --- Link winners to next round ---
  // prevRoundStart tracks the index in `matches` where the current round begins
  let prevRoundStart = 0;
  for (let round = 1; round < totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    const nextRoundStart = prevRoundStart + matchesInRound;

    for (let i = 0; i < matchesInRound; i++) {
      const nextMatchIndex = nextRoundStart + Math.floor(i / 2);
      // Even position within round → feeds player1 slot, odd → player2 slot
      const slot: MatchSlot = i % 2 === 0 ? "player1" : "player2";

      matches[prevRoundStart + i].next_match_index = nextMatchIndex;
      matches[prevRoundStart + i].next_match_slot = slot;
    }

    prevRoundStart = nextRoundStart;
  }

  // --- 3rd place match ---
  // Requires the option enabled AND the bracket must have semi-finals
  // (totalRounds >= 2, i.e., at least 4 bracket slots = at least 3 participants)
  if (options?.thirdPlaceMatch && totalRounds >= 2) {
    const semiRound = totalRounds - 1;

    // Find the two semi-final matches (winners bracket, round === totalRounds - 1)
    const semiIndices: number[] = [];
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].round === semiRound && matches[i].bracket_type === "winners") {
        semiIndices.push(i);
      }
    }

    const thirdPlaceIndex = matches.length;
    const thirdPlaceRoundName = resolveRoundName("third_place", totalRounds, totalRounds);

    matches.push({
      match_id: generateMatchId("third_place", totalRounds, 1),
      round: totalRounds,
      match_number: matchNumber++,
      player1_id: null,
      player2_id: null,
      bracket_type: "third_place",
      next_match_index: null,
      loser_next_match_index: null,
      next_match_slot: null,
      loser_next_match_slot: null,
      round_name: thirdPlaceRoundName,
      is_bye: false,
      best_of: resolveBestOf("third_place", thirdPlaceRoundName, options?.bestOf),
    });

    // Link semi-final losers to the 3rd place match
    for (let si = 0; si < semiIndices.length; si++) {
      const idx = semiIndices[si];
      matches[idx].loser_next_match_index = thirdPlaceIndex;
      matches[idx].loser_next_match_slot = si === 0 ? "player1" : "player2";
    }
  }

  return matches;
}
