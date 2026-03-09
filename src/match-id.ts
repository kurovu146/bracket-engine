import type { BracketType } from "./types";

/**
 * Generate a stable, human-readable match ID.
 *
 * Format by bracket type:
 * - winners:             "WB-R{round}-M{matchInRound}"
 * - losers:              "LB-R{round}-M{matchInRound}"
 * - grand_final:         "GF-M1"
 * - grand_final_reset:   "GF-M2"
 * - third_place:         "3RD-M1"
 * - round_robin:         "RR-R{round}-M{matchInRound}"
 * - swiss:               "SW-R{round}-M{matchInRound}"
 * - group_N:             "G{N}-R{round}-M{matchInRound}"
 */
export function generateMatchId(
  bracketType: BracketType,
  round: number,
  matchInRound: number
): string {
  switch (bracketType) {
    case "winners":
      return `WB-R${round}-M${matchInRound}`;
    case "losers":
      return `LB-R${round}-M${matchInRound}`;
    case "grand_final":
      return "GF-M1";
    case "grand_final_reset":
      return "GF-M2";
    case "third_place":
      return "3RD-M1";
    case "round_robin":
      return `RR-R${round}-M${matchInRound}`;
    case "swiss":
      return `SW-R${round}-M${matchInRound}`;
    default: {
      // group_N pattern
      const groupMatch = bracketType.match(/^group_(\d+)$/);
      if (groupMatch) {
        return `G${groupMatch[1]}-R${round}-M${matchInRound}`;
      }
      return `${bracketType}-R${round}-M${matchInRound}`;
    }
  }
}
