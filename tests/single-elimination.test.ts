import { describe, it, expect } from "vitest";
import { generateSingleElimination } from "../src";

describe("generateSingleElimination", () => {
  it("returns empty array for less than 2 participants", () => {
    expect(generateSingleElimination([])).toEqual([]);
    expect(generateSingleElimination(["A"])).toEqual([]);
  });

  it("generates correct bracket for 2 players", () => {
    const matches = generateSingleElimination(["A", "B"]);
    expect(matches).toHaveLength(1);
    expect(matches[0].round).toBe(1);
    expect(matches[0].player1_id).toBe("A");
    expect(matches[0].player2_id).toBe("B");
    expect(matches[0].bracket_type).toBe("winners");
    expect(matches[0].next_match_index).toBeNull();
  });

  it("generates correct bracket for 4 players (power of 2)", () => {
    const matches = generateSingleElimination(["A", "B", "C", "D"]);
    expect(matches).toHaveLength(3); // 2 first round + 1 final

    // Round 1
    expect(matches[0]).toMatchObject({ round: 1, player1_id: "A", player2_id: "B" });
    expect(matches[1]).toMatchObject({ round: 1, player1_id: "C", player2_id: "D" });

    // Final
    expect(matches[2]).toMatchObject({ round: 2, player1_id: null, player2_id: null });

    // Linking
    expect(matches[0].next_match_index).toBe(2);
    expect(matches[1].next_match_index).toBe(2);
    expect(matches[2].next_match_index).toBeNull();
  });

  it("generates correct bracket for 8 players", () => {
    const ids = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
    const matches = generateSingleElimination(ids);
    expect(matches).toHaveLength(7); // 4 + 2 + 1

    // Round 1: 4 matches
    const r1 = matches.filter((m) => m.round === 1);
    expect(r1).toHaveLength(4);

    // Round 2: 2 matches
    const r2 = matches.filter((m) => m.round === 2);
    expect(r2).toHaveLength(2);

    // Round 3 (final): 1 match
    const r3 = matches.filter((m) => m.round === 3);
    expect(r3).toHaveLength(1);

    // Linking: R1 match 0,1 → R2 match 0; R1 match 2,3 → R2 match 1
    expect(matches[0].next_match_index).toBe(4);
    expect(matches[1].next_match_index).toBe(4);
    expect(matches[2].next_match_index).toBe(5);
    expect(matches[3].next_match_index).toBe(5);

    // R2 → Final
    expect(matches[4].next_match_index).toBe(6);
    expect(matches[5].next_match_index).toBe(6);
  });

  it("handles byes for 3 players (non-power of 2)", () => {
    const matches = generateSingleElimination(["A", "B", "C"]);
    // bracketSize = 4, so 2 first round + 1 final = 3 matches
    expect(matches).toHaveLength(3);

    // First match: A vs B (both present)
    expect(matches[0]).toMatchObject({ player1_id: "A", player2_id: "B" });
    // Second match: C vs null (bye)
    expect(matches[1]).toMatchObject({ player1_id: "C", player2_id: null });

    // Both link to final
    expect(matches[0].next_match_index).toBe(2);
    expect(matches[1].next_match_index).toBe(2);
  });

  it("handles byes for 5 players", () => {
    const ids = ["A", "B", "C", "D", "E"];
    const matches = generateSingleElimination(ids);
    // bracketSize = 8: 4 + 2 + 1 = 7 matches
    expect(matches).toHaveLength(7);

    // 3 null slots: [A,B,C,D,E,null,null,null]
    // R1: (A,B), (C,D), (E,null), (null,null) → 2 matches with at least 1 null
    const r1 = matches.filter((m) => m.round === 1);
    const byeMatches = r1.filter((m) => !m.player1_id || !m.player2_id);
    expect(byeMatches.length).toBe(2);
  });

  it("generates sequential match numbers", () => {
    const matches = generateSingleElimination(["A", "B", "C", "D", "E", "F", "G", "H"]);
    for (let i = 0; i < matches.length; i++) {
      expect(matches[i].match_number).toBe(i + 1);
    }
  });

  it("all matches have bracket_type = winners", () => {
    const matches = generateSingleElimination(["A", "B", "C", "D"]);
    for (const m of matches) {
      expect(m.bracket_type).toBe("winners");
    }
  });

  it("final match has no next_match_index", () => {
    const matches = generateSingleElimination(["A", "B", "C", "D", "E", "F", "G", "H"]);
    const final = matches[matches.length - 1];
    expect(final.next_match_index).toBeNull();
  });

  it("handles 16 players correctly", () => {
    const ids = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
    const matches = generateSingleElimination(ids);
    expect(matches).toHaveLength(15); // 8 + 4 + 2 + 1
  });
});
