import type { BracketType } from "./types";

/**
 * Resolve a human-readable round name based on bracket type and round position.
 *
 * For elimination brackets:
 * - Last round: "Final"
 * - Second to last: "Semi-final"
 * - Third to last: "Quarter-final"
 * - Others: "Round {round}"
 *
 * For losers bracket:
 * - Last round: "LB Final"
 * - Second to last: "LB Semi-final"
 * - Others: "LB Round {round}"
 *
 * Special types return fixed names.
 * Round-robin/Swiss/Group: "Round {round}"
 */
export function resolveRoundName(
  bracketType: BracketType,
  round: number,
  totalRounds: number
): string {
  switch (bracketType) {
    case "grand_final":
      return "Grand Final";
    case "grand_final_reset":
      return "Grand Final Reset";
    case "third_place":
      return "3rd Place Match";

    case "winners": {
      const fromFinal = totalRounds - round;
      if (fromFinal === 0) return "Final";
      if (fromFinal === 1) return "Semi-final";
      if (fromFinal === 2) return "Quarter-final";
      return `Round ${round}`;
    }

    case "losers": {
      const fromFinal = totalRounds - round;
      if (fromFinal === 0) return "LB Final";
      if (fromFinal === 1) return "LB Semi-final";
      return `LB Round ${round}`;
    }

    case "round_robin":
    case "swiss":
      return `Round ${round}`;

    default:
      // group_N
      if (bracketType.startsWith("group_")) {
        return `Round ${round}`;
      }
      return `Round ${round}`;
  }
}
