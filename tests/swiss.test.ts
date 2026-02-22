import { describe, it, expect } from "vitest";
import { generateSwiss } from "../src";

describe("generateSwiss", () => {
  it("returns empty array for less than 2 participants", () => {
    expect(generateSwiss([])).toEqual([]);
    expect(generateSwiss(["A"])).toEqual([]);
  });

  it("generates correct matches for 2 players", () => {
    const matches = generateSwiss(["A", "B"]);
    // ceil(log2(2)) = 1 round, 1 match per round
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      round: 1,
      match_number: 1,
      player1_id: "A",
      player2_id: "B",
      bracket_type: "winners",
    });
  });

  it("generates correct number of rounds for 8 players", () => {
    const matches = generateSwiss(["A", "B", "C", "D", "E", "F", "G", "H"]);
    // ceil(log2(8)) = 3 rounds, 4 matches per round
    expect(matches).toHaveLength(12);

    const round1 = matches.filter((m) => m.round === 1);
    const round2 = matches.filter((m) => m.round === 2);
    const round3 = matches.filter((m) => m.round === 3);

    expect(round1).toHaveLength(4);
    expect(round2).toHaveLength(4);
    expect(round3).toHaveLength(4);
  });

  it("round 1 has real players, rounds 2+ have null placeholders", () => {
    const matches = generateSwiss(["A", "B", "C", "D"]);
    // ceil(log2(4)) = 2 rounds, 2 matches per round

    const round1 = matches.filter((m) => m.round === 1);
    const round2 = matches.filter((m) => m.round === 2);

    // Round 1: all players assigned
    for (const m of round1) {
      expect(m.player1_id).not.toBeNull();
      expect(m.player2_id).not.toBeNull();
    }

    // Round 2: placeholder (app fills later)
    for (const m of round2) {
      expect(m.player1_id).toBeNull();
      expect(m.player2_id).toBeNull();
    }
  });

  it("round 1 pairs by seed order (1v2, 3v4, ...)", () => {
    const matches = generateSwiss(["A", "B", "C", "D", "E", "F"]);
    const round1 = matches.filter((m) => m.round === 1);

    expect(round1[0]).toMatchObject({ player1_id: "A", player2_id: "B" });
    expect(round1[1]).toMatchObject({ player1_id: "C", player2_id: "D" });
    expect(round1[2]).toMatchObject({ player1_id: "E", player2_id: "F" });
  });

  it("supports custom number of rounds", () => {
    const matches = generateSwiss(["A", "B", "C", "D"], 5);
    // 5 rounds, 2 matches per round
    expect(matches).toHaveLength(10);

    const rounds = new Set(matches.map((m) => m.round));
    expect(rounds.size).toBe(5);
  });

  it("handles odd number of players (bye player sits out)", () => {
    const matches = generateSwiss(["A", "B", "C", "D", "E"]);
    // 5 players → 2 matches per round (1 player gets bye)
    // ceil(log2(5)) = 3 rounds
    expect(matches).toHaveLength(6);

    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(2);
    // Player E doesn't have a pair in round 1 (bye)
    expect(round1[0]).toMatchObject({ player1_id: "A", player2_id: "B" });
    expect(round1[1]).toMatchObject({ player1_id: "C", player2_id: "D" });
  });

  it("generates sequential match numbers", () => {
    const matches = generateSwiss(["A", "B", "C", "D", "E", "F", "G", "H"]);
    for (let i = 0; i < matches.length; i++) {
      expect(matches[i].match_number).toBe(i + 1);
    }
  });

  it("has no match linking (standalone matches)", () => {
    const matches = generateSwiss(["A", "B", "C", "D"]);
    for (const m of matches) {
      expect(m.next_match_index).toBeNull();
      expect(m.loser_next_match_index).toBeNull();
    }
  });

  it("all matches have bracket_type winners", () => {
    const matches = generateSwiss(["A", "B", "C", "D", "E", "F"]);
    for (const m of matches) {
      expect(m.bracket_type).toBe("winners");
    }
  });

  it("generates correct rounds for 16 players", () => {
    const ids = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
    const matches = generateSwiss(ids);
    // ceil(log2(16)) = 4 rounds, 8 matches per round
    expect(matches).toHaveLength(32);

    for (let round = 1; round <= 4; round++) {
      expect(matches.filter((m) => m.round === round)).toHaveLength(8);
    }
  });

  it("generates correct rounds for 32 players", () => {
    const ids = Array.from({ length: 32 }, (_, i) => `P${i + 1}`);
    const matches = generateSwiss(ids);
    // ceil(log2(32)) = 5 rounds, 16 matches per round
    expect(matches).toHaveLength(80);
  });
});
