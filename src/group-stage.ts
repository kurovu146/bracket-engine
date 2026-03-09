import type {
  MatchSeed,
  GroupStageOptions,
  GroupStageResult,
  BracketType,
  RoundRobinOptions,
} from "./types";
import { validateParticipants } from "./errors";
import { generateMatchId } from "./match-id";
import { generateRoundRobin } from "./round-robin";
import { resolveRoundName } from "./round-names";

/**
 * Generate a group stage tournament schedule.
 *
 * Divides participants into groups, each group plays round-robin.
 * The app handles advancement (top N from each group → knockout phase).
 *
 * Supports two call signatures for backward compatibility:
 *   generateGroupStage(ids, 4)              // legacy: number as numGroups
 *   generateGroupStage(ids, { numGroups: 4, distribution: "snake" })  // options object
 *
 * Groups are filled sequentially by default (0,1,2,...,0,1,2,...).
 * With distribution "snake", alternating rows are reversed (0,1,2,2,1,0,...).
 *
 * Groups with fewer than 2 players are preserved in the output array (index
 * stability) but produce 0 matches — this prevents a group index shift bug
 * where filtering would cause bracket_type "group_1" to appear on what was
 * logically group_2 in the original assignment.
 *
 * @param participantIds      - Array of participant IDs
 * @param numGroupsOrOptions  - Number of groups or GroupStageOptions object
 * @returns Object with group assignments and all matches
 */
export function generateGroupStage(
  participantIds: string[],
  numGroupsOrOptions?: number | GroupStageOptions
): GroupStageResult {
  // Early return for < 2 participants — before validateParticipants which throws
  if (participantIds.length < 2) return { groups: [], matches: [] };

  validateParticipants(participantIds);

  // Normalize dual signature into a single options object
  const options: GroupStageOptions =
    typeof numGroupsOrOptions === "number"
      ? { numGroups: numGroupsOrOptions }
      : (numGroupsOrOptions ?? {});

  const n = participantIds.length;

  // Auto-calculate groups: aim for ~4 players per group, minimum 2 groups
  const groupCount = options.numGroups ?? Math.max(2, Math.round(n / 4));

  // Distribute participants into groups
  const groups: string[][] = Array.from({ length: groupCount }, () => []);

  if (options.distribution === "snake") {
    // Snake draft: alternating direction each row
    // e.g. 4 groups: 0,1,2,3,3,2,1,0,0,1,2,3,...
    for (let i = 0; i < n; i++) {
      const cycle = Math.floor(i / groupCount);
      const pos = i % groupCount;
      const groupIndex = cycle % 2 === 0 ? pos : groupCount - 1 - pos;
      groups[groupIndex].push(participantIds[i]);
    }
  } else {
    // Sequential (default): 0,1,2,...,0,1,2,...
    for (let i = 0; i < n; i++) {
      groups[i % groupCount].push(participantIds[i]);
    }
  }

  // Build RoundRobinOptions to pass through to each group's generator
  const roundRobinOptions: RoundRobinOptions = {
    doubleRoundRobin: options.doubleRoundRobin,
    bestOf: options.bestOf,
  };

  const allMatches: MatchSeed[] = [];
  let matchNumber = 1;

  for (let gi = 0; gi < groups.length; gi++) {
    // Skip groups with < 2 players but preserve their index in the groups array
    if (groups[gi].length < 2) continue;

    const bracketType: BracketType = `group_${gi}`;
    const groupMatches = generateRoundRobin(groups[gi], roundRobinOptions);

    // Track per-round match counter for generating stable match IDs
    const matchInRound: Record<number, number> = {};

    for (const match of groupMatches) {
      if (!matchInRound[match.round]) matchInRound[match.round] = 0;
      matchInRound[match.round]++;

      allMatches.push({
        ...match,
        match_number: matchNumber++,
        bracket_type: bracketType,
        match_id: generateMatchId(bracketType, match.round, matchInRound[match.round]),
        // round_name is "Round N" for group matches — recalculate with the correct
        // bracket_type so resolveRoundName uses the group_N branch, not round_robin
        round_name: resolveRoundName(bracketType, match.round, match.round),
      });
    }
  }

  return { groups, matches: allMatches };
}
