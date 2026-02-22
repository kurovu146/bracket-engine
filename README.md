# @kurovu146/bracket-engine

Tournament bracket generation engine — single/double elimination, round-robin, Swiss system, and group stage.

## Installation

```bash
npm install @kurovu146/bracket-engine
```

## Features

- **Single Elimination** — Classic knockout bracket with automatic bye handling for non-power-of-2 participant counts
- **Double Elimination** — Full winners/losers bracket with grand final, proper loser drop-down linking
- **Round-Robin** — Every participant plays every other exactly once using the circle rotation algorithm
- **Swiss System** — Pair players with similar records each round; all players play every round (no elimination)
- **Group Stage** — Divide participants into groups, each group plays round-robin
- Written in TypeScript with full type definitions
- Supports both CommonJS and ES Modules

## Usage

```typescript
import {
  generateSingleElimination,
  generateDoubleElimination,
  generateRoundRobin,
  generateSwiss,
  generateGroupStage,
} from '@kurovu146/bracket-engine';
```

### Single Elimination

```typescript
const matches = generateSingleElimination(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']);
// 7 matches: 4 quarter-finals → 2 semi-finals → 1 final
// Non-power-of-2 counts are handled automatically with byes
```

### Double Elimination

```typescript
const matches = generateDoubleElimination(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']);
// 14 matches: 7 winners bracket + 6 losers bracket + 1 grand final
// Losers drop to losers bracket; eliminated after second loss
```

### Round-Robin

```typescript
const matches = generateRoundRobin(['P1', 'P2', 'P3', 'P4']);
// 6 matches: every player plays every other player once
// Odd participant counts handled with virtual bye
```

### Swiss System

```typescript
const matches = generateSwiss(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']);
// 12 matches: 3 rounds × 4 matches (ceil(log2(8)) = 3 rounds)
// Round 1: paired by seed order (P1vP2, P3vP4, ...)
// Rounds 2+: placeholder matches (null players) — app fills dynamically based on standings

// Custom number of rounds:
const matches5r = generateSwiss(['P1', 'P2', 'P3', 'P4'], 5);
// 10 matches: 5 rounds × 2 matches
```

### Group Stage

```typescript
const result = generateGroupStage(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'], 2);
// result.groups: [['P1','P3','P5','P7'], ['P2','P4','P6','P8']]
// result.matches: 12 matches (6 per group, round-robin within each group)
// Each match has bracket_type: "group_0", "group_1", etc.

// Auto-calculate groups (~4 players per group):
const result16 = generateGroupStage(sixteenPlayers);
// 4 groups of 4 players
```

## API

### `generateSingleElimination(participantIds: string[]): MatchSeed[]`

Generates a single elimination bracket. Automatically rounds up to the nearest power of 2 and fills empty slots with byes.

### `generateDoubleElimination(participantIds: string[]): MatchSeed[]`

Generates a double elimination bracket with winners bracket, losers bracket, and grand final. Winners bracket losers drop into the losers bracket at the appropriate round.

### `generateRoundRobin(participantIds: string[]): MatchSeed[]`

Generates a round-robin schedule where every participant plays every other participant exactly once.

### `generateSwiss(participantIds: string[], numRounds?: number): MatchSeed[]`

Generates a Swiss-system tournament. Round 1 is paired by seed order. Rounds 2+ have null players — the app must fill them dynamically based on standings after each round completes. Default rounds: `ceil(log2(n))`.

### `generateGroupStage(participantIds: string[], numGroups?: number): GroupStageResult`

Divides participants into groups and generates round-robin matches within each group. Returns both group assignments and matches. Default groups: `round(n / 4)`.

```typescript
interface GroupStageResult {
  groups: string[][];   // Group assignments (group index → participant IDs)
  matches: MatchSeed[]; // All matches with bracket_type "group_0", "group_1", etc.
}
```

### `MatchSeed`

```typescript
interface MatchSeed {
  round: number;                        // 1-based round number
  match_number: number;                 // Sequential match number across the tournament
  player1_id: string | null;            // Player 1 ID (null = TBD/bye)
  player2_id: string | null;            // Player 2 ID (null = TBD/bye)
  bracket_type: BracketType;            // "winners" | "losers" | "grand_final" | "group_N"
  next_match_index: number | null;      // Array index of the winner's next match
  loser_next_match_index: number | null; // Array index of the loser's next match (double elim only)
}
```

### `BracketType`

```typescript
type BracketType = "winners" | "losers" | "grand_final" | `group_${number}`;
```

## Design Philosophy

The library provides **root tournament formats only** (building blocks). Multi-phase/hybrid tournaments (e.g., Group Stage → Single Elimination, Swiss → Top 8 Knockout) should be orchestrated by the app layer, combining multiple generators as needed.

## Development

```bash
npm run build        # Build with tsup (CJS + ESM + types)
npm test             # Run tests with vitest
npm run test:watch   # Run tests in watch mode
npm run lint         # Type-check without emitting
```

## License

MIT
