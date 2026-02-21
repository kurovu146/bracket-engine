import type { MatchSeed } from "./types";
import { seedParticipants } from "./utils";

/**
 * Generate a double elimination bracket.
 *
 * Players start in the Winners Bracket. Losing once drops you to the
 * Losers Bracket. Losing twice eliminates you. The winners of each bracket
 * meet in the Grand Final.
 *
 * Losers bracket flow:
 * - Odd losers rounds (L1, L3, L5...): losers from a winners round
 *   play among themselves
 * - Even losers rounds (L2, L4, L6...): survivors from the previous
 *   losers round play against new losers dropping from the next winners round
 *
 * Example with 8 players (bracketSize=8, 3 winners rounds):
 *   W1 (4 matches) → W2 (2 matches) → W3/WB Final (1 match)
 *   L1 (2 matches, W1 losers vs W1 losers)
 *   L2 (2 matches, L1 winners vs W2 losers)
 *   L3 (1 match, L2 winners vs L2 winners)
 *   L4 (1 match, L3 winner vs W3 loser) = LB Final
 *   Grand Final: WB champ vs LB champ
 *
 * @param participantIds - Array of participant IDs in seed order
 * @returns Array of matches with linking information
 */
export function generateDoubleElimination(
  participantIds: string[]
): MatchSeed[] {
  const n = participantIds.length;
  if (n < 2) return [];

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const totalWinnersRounds = Math.log2(bracketSize);
  const seeded = seedParticipants(participantIds, bracketSize);

  const matches: MatchSeed[] = [];
  let matchNumber = 1;

  // ============ WINNERS BRACKET ============
  const winnersRoundStart: number[] = [];

  for (let round = 1; round <= totalWinnersRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    winnersRoundStart.push(matches.length);

    for (let i = 0; i < matchesInRound; i++) {
      const isFirstRound = round === 1;
      matches.push({
        round,
        match_number: matchNumber++,
        player1_id: isFirstRound ? seeded[i * 2] : null,
        player2_id: isFirstRound ? seeded[i * 2 + 1] : null,
        bracket_type: "winners",
        next_match_index: null,
        loser_next_match_index: null,
      });
    }
  }

  // Link winners bracket internally (winner advances)
  for (let r = 0; r < totalWinnersRounds - 1; r++) {
    const start = winnersRoundStart[r];
    const nextStart = winnersRoundStart[r + 1];
    const count = bracketSize / Math.pow(2, r + 1);

    for (let i = 0; i < count; i++) {
      matches[start + i].next_match_index = nextStart + Math.floor(i / 2);
    }
  }

  const winnersMatchCount = matches.length;

  // ============ LOSERS BRACKET ============
  const totalLosersRounds = (totalWinnersRounds - 1) * 2;
  const losersRoundStart: number[] = [];
  const losersRoundCounts: number[] = [];

  // Match counts per losers round:
  // L1: bracketSize/4 (W1 losers paired up)
  // L2: bracketSize/4 (L1 winners meet W2 losers)
  // L3: bracketSize/8 (L2 winners play among themselves)
  // L4: bracketSize/8 (L3 winners meet W3 losers)
  // Pattern: count halves every 2 rounds
  let currentCount = bracketSize / 4;

  for (let lRound = 1; lRound <= totalLosersRounds; lRound++) {
    losersRoundStart.push(matches.length);
    losersRoundCounts.push(currentCount);

    for (let i = 0; i < currentCount; i++) {
      matches.push({
        round: lRound,
        match_number: matchNumber++,
        player1_id: null,
        player2_id: null,
        bracket_type: "losers",
        next_match_index: null,
        loser_next_match_index: null,
      });
    }

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
        // Same count: 1-to-1 mapping (odd→even losers round)
        matches[start + i].next_match_index = nextStart + i;
      } else {
        // Halved: 2-to-1 mapping (even→odd losers round)
        matches[start + i].next_match_index =
          nextStart + Math.floor(i / 2);
      }
    }
  }

  // ============ LINK WINNERS LOSERS → LOSERS BRACKET ============
  // W1 losers → L1: paired (2 W1 losers per 1 L1 match)
  // W2 losers → L2: 1-to-1
  // W3 losers → L4: 1-to-1
  // Pattern: W(r+1) losers go to L(r*2) for r=0,1,2,...
  for (let wRound = 0; wRound < totalWinnersRounds; wRound++) {
    const wStart = winnersRoundStart[wRound];
    const wCount = bracketSize / Math.pow(2, wRound + 1);

    if (wRound === 0) {
      const lStart = losersRoundStart[0];
      for (let i = 0; i < wCount; i++) {
        matches[wStart + i].loser_next_match_index =
          lStart + Math.floor(i / 2);
      }
    } else {
      const lRoundIndex = wRound * 2 - 1;
      if (lRoundIndex < totalLosersRounds) {
        const lStart = losersRoundStart[lRoundIndex];
        for (let i = 0; i < wCount; i++) {
          if (
            lStart + i < matches.length &&
            matches[lStart + i].bracket_type === "losers"
          ) {
            matches[wStart + i].loser_next_match_index = lStart + i;
          }
        }
      }
    }
  }

  // ============ GRAND FINAL ============
  const grandFinalIndex = matches.length;
  matches.push({
    round: 1,
    match_number: matchNumber++,
    player1_id: null,
    player2_id: null,
    bracket_type: "grand_final",
    next_match_index: null,
    loser_next_match_index: null,
  });

  // Link WB Final → Grand Final
  matches[winnersMatchCount - 1].next_match_index = grandFinalIndex;

  // Link LB Final → Grand Final
  const lbFinalIndex = grandFinalIndex - 1;
  if (matches[lbFinalIndex]?.bracket_type === "losers") {
    matches[lbFinalIndex].next_match_index = grandFinalIndex;
  }

  return matches;
}
