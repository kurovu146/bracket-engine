import type { BestOfConfig, BracketType, DoubleEliminationOptions, MatchSeed, MatchSlot } from "./types";
import { validateParticipants } from "./errors";
import { standardSeed } from "./seeding";
import { generateMatchId } from "./match-id";
import { resolveRoundName } from "./round-names";

/**
 * Resolve best_of for a given match based on bracket type and round name.
 * Precedence: bracket-specific override > round-name-based override > default.
 */
function resolveBestOf(
  bracketType: BracketType,
  roundName: string | null,
  bestOfConfig?: BestOfConfig
): number | null {
  if (!bestOfConfig) return null;
  if (bracketType === "grand_final" && bestOfConfig.grandFinal != null) return bestOfConfig.grandFinal;
  if (bracketType === "grand_final_reset" && bestOfConfig.grandFinalReset != null) return bestOfConfig.grandFinalReset;
  if (roundName === "Final" && bestOfConfig.final != null) return bestOfConfig.final;
  return bestOfConfig.default ?? null;
}

/**
 * Generate a double elimination bracket.
 *
 * Players start in the Winners Bracket. Losing once drops you to the
 * Losers Bracket. Losing twice eliminates you. The winners of each bracket
 * meet in the Grand Final.
 *
 * Losers bracket flow:
 * - Odd losers rounds (L1, L3, L5...): losers from a winners round
 *   play among themselves (or are paired for L1)
 * - Even losers rounds (L2, L4, L6...): survivors from the previous
 *   losers round play against new losers dropping from the next winners round
 *
 * Example with 8 players (bracketSize=8, 3 winners rounds):
 *   W1 (4 matches) → W2 (2 matches) → W3/WB Final (1 match)
 *   L1 (2 matches, W1 losers paired)
 *   L2 (2 matches, L1 winners vs W2 losers)
 *   L3 (1 match, L2 winners vs L2 winners)
 *   L4 (1 match, L3 winner vs W3 loser) = LB Final
 *   Grand Final: WB champ vs LB champ
 *
 * @param participantIds - Array of participant IDs in seed order
 * @param options - Optional configuration (grandFinalReset, bestOf)
 * @returns Array of matches with full linking information
 */
export function generateDoubleElimination(
  participantIds: string[],
  options?: DoubleEliminationOptions
): MatchSeed[] {
  if (participantIds.length < 2) return [];
  validateParticipants(participantIds);

  const n = participantIds.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const totalWinnersRounds = Math.log2(bracketSize);
  const seeded = standardSeed(participantIds, bracketSize);

  const matches: MatchSeed[] = [];
  let matchNumber = 1;

  // ============ WINNERS BRACKET ============
  const winnersRoundStart: number[] = [];

  for (let round = 1; round <= totalWinnersRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    winnersRoundStart.push(matches.length);
    const roundName = resolveRoundName("winners", round, totalWinnersRounds);

    for (let i = 0; i < matchesInRound; i++) {
      const isFirstRound = round === 1;
      const p1 = isFirstRound ? seeded[i * 2] : null;
      const p2 = isFirstRound ? seeded[i * 2 + 1] : null;
      // is_bye: only in R1 when at least one player is null (a real bye)
      const isBye = isFirstRound && (p1 === null || p2 === null);

      matches.push({
        match_id: generateMatchId("winners", round, i + 1),
        round,
        match_number: matchNumber++,
        player1_id: p1,
        player2_id: p2,
        bracket_type: "winners",
        next_match_index: null,
        loser_next_match_index: null,
        next_match_slot: null,
        loser_next_match_slot: null,
        round_name: roundName,
        is_bye: isBye,
        best_of: resolveBestOf("winners", roundName, options?.bestOf),
      });
    }
  }

  // Link winners bracket internally: winner advances to next round
  // Even position (0, 2, 4...) → player1 of next match
  // Odd position  (1, 3, 5...) → player2 of next match
  for (let r = 0; r < totalWinnersRounds - 1; r++) {
    const start = winnersRoundStart[r];
    const nextStart = winnersRoundStart[r + 1];
    const count = bracketSize / Math.pow(2, r + 1);

    for (let i = 0; i < count; i++) {
      matches[start + i].next_match_index = nextStart + Math.floor(i / 2);
      matches[start + i].next_match_slot = i % 2 === 0 ? "player1" : "player2";
    }
  }

  // WB Final links to Grand Final (slot set after GF is created)
  const winnersMatchCount = matches.length;

  // ============ LOSERS BRACKET ============
  // totalLosersRounds = (totalWinnersRounds - 1) * 2
  // For n=2 (bracketSize=2, totalWinnersRounds=1): totalLosersRounds = 0
  const totalLosersRounds = (totalWinnersRounds - 1) * 2;
  const losersRoundStart: number[] = [];
  const losersRoundCounts: number[] = [];

  // Match counts per losers round:
  // L1: bracketSize/4 (W1 losers paired)
  // Pattern: count halves every 2 rounds (on even→odd transition)
  let currentCount = bracketSize / 4;

  for (let lRound = 1; lRound <= totalLosersRounds; lRound++) {
    losersRoundStart.push(matches.length);
    losersRoundCounts.push(currentCount);
    const lRoundName = resolveRoundName("losers", lRound, totalLosersRounds);

    for (let i = 0; i < currentCount; i++) {
      matches.push({
        match_id: generateMatchId("losers", lRound, i + 1),
        round: lRound,
        match_number: matchNumber++,
        player1_id: null,
        player2_id: null,
        bracket_type: "losers",
        next_match_index: null,
        loser_next_match_index: null,
        next_match_slot: null,
        loser_next_match_slot: null,
        round_name: lRoundName,
        is_bye: false,
        best_of: resolveBestOf("losers", lRoundName, options?.bestOf),
      });
    }

    // Count halves on even→odd transition (after even rounds)
    if (lRound % 2 === 0) {
      currentCount = Math.max(1, currentCount / 2);
    }
  }

  // Link losers bracket internally (winner advances to next losers round)
  for (let lr = 0; lr < totalLosersRounds - 1; lr++) {
    const start = losersRoundStart[lr];
    const nextStart = losersRoundStart[lr + 1];
    const count = losersRoundCounts[lr];
    const nextCount = losersRoundCounts[lr + 1];

    for (let i = 0; i < count; i++) {
      if (count === nextCount) {
        // Same count: 1-to-1 mapping (odd→even losers rounds, LB survivor meets WB dropdown)
        // LB survivor fills player1
        matches[start + i].next_match_index = nextStart + i;
        matches[start + i].next_match_slot = "player1";
      } else {
        // Halved: 2-to-1 mapping (even→odd losers rounds, internal LB matches)
        // Even position → player1, odd position → player2
        matches[start + i].next_match_index = nextStart + Math.floor(i / 2);
        matches[start + i].next_match_slot = i % 2 === 0 ? "player1" : "player2";
      }
    }
  }

  // LB Final links to Grand Final (slot set after GF is created)

  // ============ LINK WINNERS LOSERS → LOSERS BRACKET ============
  // W1 losers → L1: paired (2 W1 losers per 1 L1 match)
  //   even W1 match (0, 2...) → player1, odd (1, 3...) → player2
  // W2+ losers → even LB rounds as player2 (LB survivor fills player1)
  for (let wRound = 0; wRound < totalWinnersRounds; wRound++) {
    const wStart = winnersRoundStart[wRound];
    const wCount = bracketSize / Math.pow(2, wRound + 1);

    if (wRound === 0) {
      // W1 losers → L1: pair them 2-to-1
      const lStart = losersRoundStart[0];
      for (let i = 0; i < wCount; i++) {
        matches[wStart + i].loser_next_match_index = lStart + Math.floor(i / 2);
        // Even match → player1, odd match → player2
        matches[wStart + i].loser_next_match_slot = i % 2 === 0 ? "player1" : "player2";
      }
    } else {
      // W(r+1) losers → L(r*2) for r=1,2,...
      // lRoundIndex is 0-based: wRound*2 - 1
      const lRoundIndex = wRound * 2 - 1;
      if (lRoundIndex < totalLosersRounds) {
        const lStart = losersRoundStart[lRoundIndex];
        for (let i = 0; i < wCount; i++) {
          if (
            lStart + i < matches.length &&
            matches[lStart + i].bracket_type === "losers"
          ) {
            matches[wStart + i].loser_next_match_index = lStart + i;
            // WB dropdown fills player2; LB survivor fills player1
            matches[wStart + i].loser_next_match_slot = "player2";
          }
        }
      }
    }
  }

  // ============ 2-PLAYER EDGE CASE ============
  // When bracketSize=2: no LB rounds, WB match loser must go directly to GF as player2
  // (WB winner goes to GF as player1, WB loser goes to GF as player2)
  // This is handled after GF is created below.

  // ============ GRAND FINAL ============
  const grandFinalIndex = matches.length;
  const gfRoundName = resolveRoundName("grand_final", 1, 1);

  matches.push({
    match_id: generateMatchId("grand_final", 1, 1),
    round: 1,
    match_number: matchNumber++,
    player1_id: null,
    player2_id: null,
    bracket_type: "grand_final",
    next_match_index: null,
    loser_next_match_index: null,
    next_match_slot: null,
    loser_next_match_slot: null,
    round_name: gfRoundName,
    is_bye: false,
    best_of: resolveBestOf("grand_final", gfRoundName, options?.bestOf),
  });

  // Link WB Final → Grand Final as player1
  matches[winnersMatchCount - 1].next_match_index = grandFinalIndex;
  matches[winnersMatchCount - 1].next_match_slot = "player1";

  if (totalLosersRounds === 0) {
    // 2-player case: WB match loser goes directly to GF as player2
    matches[0].loser_next_match_index = grandFinalIndex;
    matches[0].loser_next_match_slot = "player2";
  } else {
    // Link LB Final → Grand Final as player2
    const lbFinalIndex = grandFinalIndex - 1;
    if (matches[lbFinalIndex]?.bracket_type === "losers") {
      matches[lbFinalIndex].next_match_index = grandFinalIndex;
      matches[lbFinalIndex].next_match_slot = "player2";
    }
  }

  // ============ GRAND FINAL RESET (optional) ============
  if (options?.grandFinalReset) {
    const resetIndex = matches.length;
    const resetRoundName = resolveRoundName("grand_final_reset", 1, 1);

    // GF winner links to reset match
    matches[grandFinalIndex].next_match_index = resetIndex;
    matches[grandFinalIndex].next_match_slot = "player1";

    matches.push({
      match_id: generateMatchId("grand_final_reset", 1, 1),
      round: 1,
      match_number: matchNumber++,
      player1_id: null,
      player2_id: null,
      bracket_type: "grand_final_reset",
      next_match_index: null,
      loser_next_match_index: null,
      next_match_slot: null,
      loser_next_match_slot: null,
      round_name: resetRoundName,
      is_bye: false,
      best_of: resolveBestOf("grand_final_reset", resetRoundName, options?.bestOf),
    });
  }

  return matches;
}
