# @kurovu146/bracket-engine

Tournament bracket generation engine for single elimination, double elimination, and round-robin formats.

## Installation

```bash
npm install @kurovu146/bracket-engine
```

## Features

- **Single Elimination** — Classic knockout bracket with automatic bye handling for non-power-of-2 participant counts
- **Double Elimination** — Full winners/losers bracket with grand final, proper loser drop-down linking
- **Round-Robin** — Every participant plays every other exactly once using the circle rotation algorithm
- Written in TypeScript with full type definitions
- Supports both CommonJS and ES Modules

## Usage

```typescript
import {
  generateSingleElimination,
  generateDoubleElimination,
  generateRoundRobin,
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
const matches = generateRoundRobin(['Team1', 'Team2', 'Team3', 'Team4']);
// 6 matches: every team plays every other team once
// Odd participant counts handled with virtual bye
```

## API

### `generateSingleElimination(participantIds: string[]): MatchSeed[]`

Generates a single elimination bracket. Automatically rounds up to the nearest power of 2 and fills empty slots with byes.

### `generateDoubleElimination(participantIds: string[]): MatchSeed[]`

Generates a double elimination bracket with winners bracket, losers bracket, and grand final. Winners bracket losers drop into the losers bracket at the appropriate round.

### `generateRoundRobin(participantIds: string[]): MatchSeed[]`

Generates a round-robin schedule where every participant plays every other participant exactly once.

### `MatchSeed`

```typescript
interface MatchSeed {
  round: number;                        // 1-based round number
  match_number: number;                 // Sequential match number across the tournament
  player1_id: string | null;            // Player 1 ID (null = TBD/bye)
  player2_id: string | null;            // Player 2 ID (null = TBD/bye)
  bracket_type: BracketType;            // "winners" | "losers" | "grand_final"
  next_match_index: number | null;      // Array index of the winner's next match
  loser_next_match_index: number | null; // Array index of the loser's next match (double elim only)
}
```

### `BracketType`

```typescript
type BracketType = "winners" | "losers" | "grand_final";
```

## Development

```bash
npm run build        # Build with tsup (CJS + ESM + types)
npm test             # Run tests with vitest
npm run test:watch   # Run tests in watch mode
npm run lint         # Type-check without emitting
```

## License

MIT
