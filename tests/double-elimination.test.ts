import { describe, it, expect } from "vitest";
import { generateDoubleElimination } from "../src";
import type { MatchSeed } from "../src";

function getByBracket(matches: MatchSeed[], type: string) {
  return matches.filter((m) => m.bracket_type === type);
}

describe("generateDoubleElimination", () => {
  it("returns empty array for less than 2 participants", () => {
    expect(generateDoubleElimination([])).toEqual([]);
    expect(generateDoubleElimination(["A"])).toEqual([]);
  });

  it("generates correct bracket for 4 players", () => {
    const matches = generateDoubleElimination(["A", "B", "C", "D"]);

    const winners = getByBracket(matches, "winners");
    const losers = getByBracket(matches, "losers");
    const grandFinal = getByBracket(matches, "grand_final");

    // Winners: 2 + 1 = 3 matches
    expect(winners).toHaveLength(3);
    // Losers: L1(1) + L2(1) = 2 matches
    expect(losers).toHaveLength(2);
    // Grand Final: 1
    expect(grandFinal).toHaveLength(1);
    // Total: 6
    expect(matches).toHaveLength(6);
  });

  it("generates correct bracket for 8 players", () => {
    const ids = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
    const matches = generateDoubleElimination(ids);

    const winners = getByBracket(matches, "winners");
    const losers = getByBracket(matches, "losers");
    const grandFinal = getByBracket(matches, "grand_final");

    // Winners: 4 + 2 + 1 = 7
    expect(winners).toHaveLength(7);
    // Losers: L1(2) + L2(2) + L3(1) + L4(1) = 6
    expect(losers).toHaveLength(6);
    // Grand Final: 1
    expect(grandFinal).toHaveLength(1);
    // Total: 14
    expect(matches).toHaveLength(14);
  });

  describe("winners bracket linking", () => {
    it("W1 winners advance to W2", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // W1: indices 0-3, W2: indices 4-5
      expect(matches[0].next_match_index).toBe(4);
      expect(matches[1].next_match_index).toBe(4);
      expect(matches[2].next_match_index).toBe(5);
      expect(matches[3].next_match_index).toBe(5);
    });

    it("W2 winners advance to W3 (WB Final)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // W2: indices 4-5, W3: index 6
      expect(matches[4].next_match_index).toBe(6);
      expect(matches[5].next_match_index).toBe(6);
    });

    it("WB Final winner advances to Grand Final", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // W3 (WB Final): index 6, Grand Final: index 13
      expect(matches[6].next_match_index).toBe(13);
    });
  });

  describe("losers bracket flow for 8 players", () => {
    // 8 players: W1(4) W2(2) W3(1) | L1(2) L2(2) L3(1) L4(1) | GF(1)
    // Indices:   0-3   4-5   6      | 7-8   9-10  11    12     | 13

    it("W1 losers drop to L1 (paired)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // W1 match 0,1 → L1 match 0 (index 7)
      expect(matches[0].loser_next_match_index).toBe(7);
      expect(matches[1].loser_next_match_index).toBe(7);
      // W1 match 2,3 → L1 match 1 (index 8)
      expect(matches[2].loser_next_match_index).toBe(8);
      expect(matches[3].loser_next_match_index).toBe(8);
    });

    it("W2 losers drop to L2 (1-to-1)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // W2 match 0 (index 4) → L2 match 0 (index 9)
      expect(matches[4].loser_next_match_index).toBe(9);
      // W2 match 1 (index 5) → L2 match 1 (index 10)
      expect(matches[5].loser_next_match_index).toBe(10);
    });

    it("W3 (WB Final) loser drops to L4 (LB Final)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // W3 (index 6) → L4 (index 12)
      expect(matches[6].loser_next_match_index).toBe(12);
    });

    it("L1 winners advance to L2", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // L1 match 0 (index 7) → L2 match 0 (index 9)
      expect(matches[7].next_match_index).toBe(9);
      // L1 match 1 (index 8) → L2 match 1 (index 10)
      expect(matches[8].next_match_index).toBe(10);
    });

    it("L2 winners advance to L3", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // L2 match 0 (index 9) → L3 (index 11)
      expect(matches[9].next_match_index).toBe(11);
      // L2 match 1 (index 10) → L3 (index 11)
      expect(matches[10].next_match_index).toBe(11);
    });

    it("L3 winner advances to L4 (LB Final)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // L3 (index 11) → L4 (index 12)
      expect(matches[11].next_match_index).toBe(12);
    });

    it("LB Final winner advances to Grand Final", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      // L4/LB Final (index 12) → Grand Final (index 13)
      expect(matches[12].next_match_index).toBe(13);
    });
  });

  describe("Grand Final", () => {
    it("is the last match", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"]);
      const last = matches[matches.length - 1];
      expect(last.bracket_type).toBe("grand_final");
      expect(last.next_match_index).toBeNull();
    });

    it("has no loser_next_match_index", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"]);
      const gf = matches.find((m) => m.bracket_type === "grand_final")!;
      expect(gf.loser_next_match_index).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles 2 players (minimal double elim)", () => {
      const matches = generateDoubleElimination(["A", "B"]);

      const winners = getByBracket(matches, "winners");
      const losers = getByBracket(matches, "losers");
      const grandFinal = getByBracket(matches, "grand_final");

      // W1: 1 match, no losers bracket rounds (0 losers rounds), 1 grand final
      expect(winners).toHaveLength(1);
      expect(losers).toHaveLength(0);
      expect(grandFinal).toHaveLength(1);
    });

    it("handles 3 players (with bye)", () => {
      const matches = generateDoubleElimination(["A", "B", "C"]);
      // bracketSize = 4, same structure as 4 players
      expect(matches).toHaveLength(6);

      // One first-round match should have a bye
      const r1 = matches.filter((m) => m.bracket_type === "winners" && m.round === 1);
      const byeMatch = r1.find((m) => !m.player2_id);
      expect(byeMatch).toBeDefined();
    });

    it("handles 5 players", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D", "E"]);
      // bracketSize = 8, same structure as 8 players
      expect(matches).toHaveLength(14);
    });

    it("handles 16 players", () => {
      const ids = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
      const matches = generateDoubleElimination(ids);

      const winners = getByBracket(matches, "winners");
      const losers = getByBracket(matches, "losers");
      const grandFinal = getByBracket(matches, "grand_final");

      // Winners: 8+4+2+1 = 15
      expect(winners).toHaveLength(15);
      // Losers: L1(4)+L2(4)+L3(2)+L4(2)+L5(1)+L6(1) = 14
      expect(losers).toHaveLength(14);
      expect(grandFinal).toHaveLength(1);
      // Total: 30
      expect(matches).toHaveLength(30);
    });
  });

  it("generates sequential match numbers", () => {
    const matches = generateDoubleElimination(["A", "B", "C", "D", "E", "F", "G", "H"]);
    for (let i = 0; i < matches.length; i++) {
      expect(matches[i].match_number).toBe(i + 1);
    }
  });

  it("all next_match_index values point to valid indices", () => {
    const matches = generateDoubleElimination(["A", "B", "C", "D", "E", "F", "G", "H"]);
    for (const m of matches) {
      if (m.next_match_index !== null) {
        expect(m.next_match_index).toBeGreaterThanOrEqual(0);
        expect(m.next_match_index).toBeLessThan(matches.length);
      }
      if (m.loser_next_match_index !== null) {
        expect(m.loser_next_match_index).toBeGreaterThanOrEqual(0);
        expect(m.loser_next_match_index).toBeLessThan(matches.length);
        expect(matches[m.loser_next_match_index].bracket_type).toBe("losers");
      }
    }
  });

  it("W1 first round has correct player assignments", () => {
    const ids = ["P1", "P2", "P3", "P4"];
    const matches = generateDoubleElimination(ids);

    expect(matches[0]).toMatchObject({ player1_id: "P1", player2_id: "P2" });
    expect(matches[1]).toMatchObject({ player1_id: "P3", player2_id: "P4" });
  });
});
