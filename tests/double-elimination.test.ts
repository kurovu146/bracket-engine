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

    expect(winners).toHaveLength(3);
    expect(losers).toHaveLength(2);
    expect(grandFinal).toHaveLength(1);
    expect(matches).toHaveLength(6);
  });

  it("generates correct bracket for 8 players", () => {
    const ids = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
    const matches = generateDoubleElimination(ids);

    const winners = getByBracket(matches, "winners");
    const losers = getByBracket(matches, "losers");
    const grandFinal = getByBracket(matches, "grand_final");

    expect(winners).toHaveLength(7);
    expect(losers).toHaveLength(6);
    expect(grandFinal).toHaveLength(1);
    expect(matches).toHaveLength(14);
  });

  describe("winners bracket linking", () => {
    it("W1 winners advance to W2", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[0].next_match_index).toBe(4);
      expect(matches[1].next_match_index).toBe(4);
      expect(matches[2].next_match_index).toBe(5);
      expect(matches[3].next_match_index).toBe(5);
    });

    it("W2 winners advance to W3 (WB Final)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[4].next_match_index).toBe(6);
      expect(matches[5].next_match_index).toBe(6);
    });

    it("WB Final winner advances to Grand Final", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[6].next_match_index).toBe(13);
    });
  });

  describe("losers bracket flow for 8 players", () => {
    it("W1 losers drop to L1 (paired)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[0].loser_next_match_index).toBe(7);
      expect(matches[1].loser_next_match_index).toBe(7);
      expect(matches[2].loser_next_match_index).toBe(8);
      expect(matches[3].loser_next_match_index).toBe(8);
    });

    it("W2 losers drop to L2 (1-to-1)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[4].loser_next_match_index).toBe(9);
      expect(matches[5].loser_next_match_index).toBe(10);
    });

    it("W3 (WB Final) loser drops to L4 (LB Final)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[6].loser_next_match_index).toBe(12);
    });

    it("L1 winners advance to L2", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[7].next_match_index).toBe(9);
      expect(matches[8].next_match_index).toBe(10);
    });

    it("L2 winners advance to L3", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[9].next_match_index).toBe(11);
      expect(matches[10].next_match_index).toBe(11);
    });

    it("L3 winner advances to L4 (LB Final)", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[11].next_match_index).toBe(12);
    });

    it("LB Final winner advances to Grand Final", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);

      expect(matches[12].next_match_index).toBe(13);
    });
  });

  describe("Grand Final", () => {
    it("is the last match (without reset)", () => {
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

      expect(winners).toHaveLength(1);
      expect(losers).toHaveLength(0);
      expect(grandFinal).toHaveLength(1);
    });

    it("2-player: WB loser links to Grand Final", () => {
      const matches = generateDoubleElimination(["A", "B"]);
      // WB match should link loser to GF
      expect(matches[0].loser_next_match_index).toBe(1); // GF is index 1
    });

    it("handles 3 players (with bye)", () => {
      const matches = generateDoubleElimination(["A", "B", "C"]);
      expect(matches).toHaveLength(6);

      const r1 = matches.filter((m) => m.bracket_type === "winners" && m.round === 1);
      const byeMatch = r1.find((m) => m.is_bye);
      expect(byeMatch).toBeDefined();
    });

    it("handles 5 players", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D", "E"]);
      expect(matches).toHaveLength(14);
    });

    it("handles 16 players", () => {
      const ids = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
      const matches = generateDoubleElimination(ids);

      const winners = getByBracket(matches, "winners");
      const losers = getByBracket(matches, "losers");
      const grandFinal = getByBracket(matches, "grand_final");

      expect(winners).toHaveLength(15);
      expect(losers).toHaveLength(14);
      expect(grandFinal).toHaveLength(1);
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

  it("W1 first round has correct player assignments (standard seeding)", () => {
    const ids = ["P1", "P2", "P3", "P4"];
    const matches = generateDoubleElimination(ids);

    // Standard seeding: 1v4, 2v3
    expect(matches[0]).toMatchObject({ player1_id: "P1", player2_id: "P4" });
    expect(matches[1]).toMatchObject({ player1_id: "P2", player2_id: "P3" });
  });

  // ===== NEW TESTS =====

  describe("match_id", () => {
    it("winners bracket has WB prefix", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"]);
      const winners = getByBracket(matches, "winners");
      for (const m of winners) {
        expect(m.match_id).toMatch(/^WB-R\d+-M\d+$/);
      }
    });

    it("losers bracket has LB prefix", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"]);
      const losers = getByBracket(matches, "losers");
      for (const m of losers) {
        expect(m.match_id).toMatch(/^LB-R\d+-M\d+$/);
      }
    });

    it("grand final has GF-M1", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"]);
      const gf = matches.find((m) => m.bracket_type === "grand_final")!;
      expect(gf.match_id).toBe("GF-M1");
    });

    it("all match IDs are unique", () => {
      const matches = generateDoubleElimination(
        Array.from({ length: 16 }, (_, i) => `P${i + 1}`)
      );
      const ids = matches.map((m) => m.match_id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("next_match_slot", () => {
    it("winners bracket: even position → player1, odd → player2", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);
      // W1 match 0 → W2 match 0 as player1
      expect(matches[0].next_match_slot).toBe("player1");
      // W1 match 1 → W2 match 0 as player2
      expect(matches[1].next_match_slot).toBe("player2");
    });
  });

  describe("round_name", () => {
    it("WB Final is named correctly", () => {
      const matches = generateDoubleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);
      // WB has 3 rounds. Round 3 = Final
      const wbFinal = matches.find(
        (m) => m.bracket_type === "winners" && m.round === 3
      );
      expect(wbFinal?.round_name).toBe("Final");
    });

    it("Grand Final is named correctly", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"]);
      const gf = matches.find((m) => m.bracket_type === "grand_final")!;
      expect(gf.round_name).toBe("Grand Final");
    });
  });

  describe("grandFinalReset option", () => {
    it("adds reset match when enabled", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"], {
        grandFinalReset: true,
      });

      const reset = matches.find((m) => m.bracket_type === "grand_final_reset");
      expect(reset).toBeDefined();
      expect(reset!.match_id).toBe("GF-M2");
      expect(reset!.round_name).toBe("Grand Final Reset");
    });

    it("GF links to reset match", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"], {
        grandFinalReset: true,
      });

      const gf = matches.find((m) => m.bracket_type === "grand_final")!;
      const resetIndex = matches.findIndex((m) => m.bracket_type === "grand_final_reset");
      expect(gf.next_match_index).toBe(resetIndex);
    });

    it("reset match is the last match", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"], {
        grandFinalReset: true,
      });

      const last = matches[matches.length - 1];
      expect(last.bracket_type).toBe("grand_final_reset");
      expect(last.next_match_index).toBeNull();
    });

    it("without option, no reset match", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"]);
      expect(matches.find((m) => m.bracket_type === "grand_final_reset")).toBeUndefined();
    });
  });

  describe("bestOf option", () => {
    it("applies default best_of", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"], {
        bestOf: { default: 3 },
      });
      for (const m of matches) {
        expect(m.best_of).toBe(3);
      }
    });

    it("grandFinal best_of overrides default", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"], {
        bestOf: { default: 3, grandFinal: 5 },
      });
      const gf = matches.find((m) => m.bracket_type === "grand_final")!;
      expect(gf.best_of).toBe(5);
    });

    it("grandFinalReset best_of applies", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"], {
        grandFinalReset: true,
        bestOf: { default: 3, grandFinalReset: 5 },
      });
      const reset = matches.find((m) => m.bracket_type === "grand_final_reset")!;
      expect(reset.best_of).toBe(5);
    });
  });

  describe("input validation", () => {
    it("throws for duplicate IDs", () => {
      expect(() => generateDoubleElimination(["A", "A", "B"])).toThrow();
    });

    it("throws for empty string IDs", () => {
      expect(() => generateDoubleElimination(["A", ""])).toThrow();
    });
  });

  describe("is_bye flag", () => {
    it("marks bye matches in first round", () => {
      const matches = generateDoubleElimination(["A", "B", "C"]);
      const r1 = matches.filter((m) => m.bracket_type === "winners" && m.round === 1);
      const byeMatches = r1.filter((m) => m.is_bye);
      expect(byeMatches.length).toBeGreaterThan(0);
    });

    it("non-first-round matches are not byes", () => {
      const matches = generateDoubleElimination(["A", "B", "C", "D"]);
      const nonR1 = matches.filter(
        (m) => !(m.bracket_type === "winners" && m.round === 1)
      );
      for (const m of nonR1) {
        expect(m.is_bye).toBe(false);
      }
    });
  });
});
