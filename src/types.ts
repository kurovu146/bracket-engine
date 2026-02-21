/** Bracket type for a match */
export type BracketType = "winners" | "losers" | "grand_final";

/** A generated match in the bracket */
export interface MatchSeed {
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
}
