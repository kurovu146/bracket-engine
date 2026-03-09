/** Bracket type for a match */
export type BracketType =
  | "winners"
  | "losers"
  | "grand_final"
  | "grand_final_reset"
  | "third_place"
  | "round_robin"
  | "swiss"
  | `group_${number}`;

/** Which slot in the next match the winner/loser goes to */
export type MatchSlot = "player1" | "player2";

/** Best-of configuration */
export interface BestOfConfig {
  /** Default best-of for all matches */
  default?: number;
  /** Best-of for the final match */
  final?: number;
  /** Best-of for the 3rd place match */
  thirdPlace?: number;
  /** Best-of for grand final */
  grandFinal?: number;
  /** Best-of for grand final reset */
  grandFinalReset?: number;
}

/** A generated match in the bracket */
export interface MatchSeed {
  /** Stable unique identifier (e.g., "WB-R1-M1", "LB-R3-M2", "GF-M1") */
  match_id: string;
  /** Round number (1-based) */
  round: number;
  /** Sequential match number across the entire tournament */
  match_number: number;
  /** Player 1 ID (null if TBD) */
  player1_id: string | null;
  /** Player 2 ID (null if TBD) */
  player2_id: string | null;
  /** Which bracket this match belongs to */
  bracket_type: BracketType;
  /** Index of the next match in the array (for winner advancement) */
  next_match_index: number | null;
  /** Index of the losers bracket match (for loser drop-down in double elimination) */
  loser_next_match_index: number | null;
  /** Which slot (player1 or player2) the winner fills in the next match */
  next_match_slot: MatchSlot | null;
  /** Which slot the loser fills in the loser's next match */
  loser_next_match_slot: MatchSlot | null;
  /** Human-readable round name (e.g., "Quarter-final", "Semi-final", "Final") */
  round_name: string | null;
  /** Whether this is a bye match (one or both players are null/auto-advance) */
  is_bye: boolean;
  /** Best-of hint for this match (e.g., 3 = best of 3). null = not specified */
  best_of: number | null;
}

/** Options for single elimination */
export interface SingleEliminationOptions {
  /** Generate a 3rd place match (default: false) */
  thirdPlaceMatch?: boolean;
  /** Best-of configuration */
  bestOf?: BestOfConfig;
}

/** Options for double elimination */
export interface DoubleEliminationOptions {
  /** Allow grand final reset if LB winner beats WB winner (default: false) */
  grandFinalReset?: boolean;
  /** Best-of configuration */
  bestOf?: BestOfConfig;
}

/** Options for round-robin */
export interface RoundRobinOptions {
  /** Play each opponent twice (home/away) (default: false) */
  doubleRoundRobin?: boolean;
  /** Best-of configuration */
  bestOf?: BestOfConfig;
}

/** Options for Swiss system */
export interface SwissOptions {
  /** Number of rounds (default: ceil(log2(n))) */
  numRounds?: number;
  /** Best-of configuration */
  bestOf?: BestOfConfig;
}

/** Options for group stage */
export interface GroupStageOptions {
  /** Number of groups (default: auto ~4 per group) */
  numGroups?: number;
  /** Distribution method (default: "sequential") */
  distribution?: "sequential" | "snake";
  /** Double round-robin within groups (default: false) */
  doubleRoundRobin?: boolean;
  /** Best-of configuration */
  bestOf?: BestOfConfig;
}

/** Group stage result */
export interface GroupStageResult {
  /** Group assignments: group index (0-based) → participant IDs */
  groups: string[][];
  /** All matches across all groups */
  matches: MatchSeed[];
}
