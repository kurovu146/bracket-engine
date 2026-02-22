import type { MatchSeed } from "./types";
import { generateRoundRobin } from "./round-robin";

/**
 * Generate a group stage tournament schedule.
 *
 * Divides participants into groups, each group plays round-robin.
 * The app handles advancement (top N from each group → knockout phase).
 *
 * Groups are filled sequentially: participants are distributed evenly.
 * If not perfectly divisible, earlier groups get one extra player.
 *
 * @param participantIds - Array of participant IDs
 * @param numGroups - Number of groups (default: auto-calculated based on participant count)
 * @returns Object with group assignments and all matches
 */
export interface GroupStageResult {
  /** Group assignments: group index (0-based) → participant IDs */
  groups: string[][];
  /** All matches across all groups, with group_index in bracket_type field */
  matches: MatchSeed[];
}

/**
 * Extended bracket type for group stage matches.
 * Format: "group_0", "group_1", etc. to identify which group a match belongs to.
 */
export type GroupBracketType = `group_${number}`;

export function generateGroupStage(
  participantIds: string[],
  numGroups?: number
): GroupStageResult {
  const n = participantIds.length;
  if (n < 2) return { groups: [], matches: [] };

  // Auto-calculate groups: aim for 3-4 players per group
  const groupCount =
    numGroups ?? Math.max(2, Math.round(n / 4));

  // Distribute participants into groups (snake/sequential)
  const groups: string[][] = Array.from(
    { length: groupCount },
    () => []
  );
  for (let i = 0; i < n; i++) {
    groups[i % groupCount].push(participantIds[i]);
  }

  // Filter out groups with less than 2 players (can't have matches)
  const validGroups = groups.filter((g) => g.length >= 2);

  // Generate round-robin matches for each group
  const allMatches: MatchSeed[] = [];
  let matchNumber = 1;

  for (let gi = 0; gi < validGroups.length; gi++) {
    const groupMatches = generateRoundRobin(validGroups[gi]);

    for (const match of groupMatches) {
      allMatches.push({
        ...match,
        match_number: matchNumber++,
        // Use bracket_type to encode group index for the app
        // App can parse this to know which group the match belongs to
        bracket_type: `group_${gi}` as any,
      });
    }
  }

  return { groups: validGroups, matches: allMatches };
}
