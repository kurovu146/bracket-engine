import { describe, it, expect } from "vitest";
import { generateSingleElimination } from "../src";
import type { MatchSeed } from "../src";

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
    expect(matches[0].match_id).toBe("WB-R1-M1");
    expect(matches[0].round_name).toBe("Final");
    expect(matches[0].is_bye).toBe(false);
  });

  it("generates correct bracket for 4 players with standard seeding", () => {
    const matches = generateSingleElimination(["P1", "P2", "P3", "P4"]);
    expect(matches).toHaveLength(3);

    // Standard seeding: 1v4, 2v3
    expect(matches[0]).toMatchObject({ round: 1, player1_id: "P1", player2_id: "P4" });
    expect(matches[1]).toMatchObject({ round: 1, player1_id: "P2", player2_id: "P3" });

    // Final
    expect(matches[2]).toMatchObject({ round: 2, player1_id: null, player2_id: null });

    // Linking
    expect(matches[0].next_match_index).toBe(2);
    expect(matches[1].next_match_index).toBe(2);
    expect(matches[2].next_match_index).toBeNull();
  });

  it("generates correct bracket for 8 players with standard seeding", () => {
    const ids = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
    const matches = generateSingleElimination(ids);
    expect(matches).toHaveLength(7);

    // Standard seeding for 8: 1v8, 4v5, 2v7, 3v6
    expect(matches[0]).toMatchObject({ player1_id: "P1", player2_id: "P8" });
    expect(matches[1]).toMatchObject({ player1_id: "P4", player2_id: "P5" });
    expect(matches[2]).toMatchObject({ player1_id: "P2", player2_id: "P7" });
    expect(matches[3]).toMatchObject({ player1_id: "P3", player2_id: "P6" });

    // Round counts
    expect(matches.filter((m) => m.round === 1)).toHaveLength(4);
    expect(matches.filter((m) => m.round === 2)).toHaveLength(2);
    expect(matches.filter((m) => m.round === 3)).toHaveLength(1);

    // Linking: R1 → R2
    expect(matches[0].next_match_index).toBe(4);
    expect(matches[1].next_match_index).toBe(4);
    expect(matches[2].next_match_index).toBe(5);
    expect(matches[3].next_match_index).toBe(5);

    // R2 → Final
    expect(matches[4].next_match_index).toBe(6);
    expect(matches[5].next_match_index).toBe(6);
  });

  it("handles byes for 3 players — seed 1 gets bye", () => {
    const matches = generateSingleElimination(["A", "B", "C"]);
    expect(matches).toHaveLength(3);

    // Standard seeding for size 4: [1,4,2,3] → [A,null,B,C]
    // Match 1: A vs null (bye) — seed 1 gets bye
    expect(matches[0]).toMatchObject({ player1_id: "A", player2_id: null });
    expect(matches[0].is_bye).toBe(true);
    // Match 2: B vs C
    expect(matches[1]).toMatchObject({ player1_id: "B", player2_id: "C" });
    expect(matches[1].is_bye).toBe(false);

    // Both link to final
    expect(matches[0].next_match_index).toBe(2);
    expect(matches[1].next_match_index).toBe(2);
  });

  it("handles byes for 5 players — top 3 seeds get byes", () => {
    const ids = ["P1", "P2", "P3", "P4", "P5"];
    const matches = generateSingleElimination(ids);
    expect(matches).toHaveLength(7);

    // bracketSize 8, seed order: [1,8,4,5,2,7,3,6]
    // With 5 players: seeds 6,7,8 = null
    // Matches R1: P1 vs null, P4 vs P5, P2 vs null, P3 vs null
    const r1 = matches.filter((m) => m.round === 1);
    const byeMatches = r1.filter((m) => m.is_bye);
    expect(byeMatches).toHaveLength(3); // 3 byes for top seeds
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
    expect(matches).toHaveLength(15);
  });

  // ===== NEW TESTS =====

  describe("match_id", () => {
    it("generates correct match IDs", () => {
      const matches = generateSingleElimination(["A", "B", "C", "D"]);
      expect(matches[0].match_id).toBe("WB-R1-M1");
      expect(matches[1].match_id).toBe("WB-R1-M2");
      expect(matches[2].match_id).toBe("WB-R2-M1");
    });

    it("match IDs are unique", () => {
      const matches = generateSingleElimination(
        Array.from({ length: 16 }, (_, i) => `P${i + 1}`)
      );
      const ids = matches.map((m) => m.match_id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("next_match_slot", () => {
    it("first feeder goes to player1, second to player2", () => {
      const matches = generateSingleElimination(["A", "B", "C", "D"]);
      // Match 0 (first in round) → player1 of final
      expect(matches[0].next_match_slot).toBe("player1");
      // Match 1 (second in round) → player2 of final
      expect(matches[1].next_match_slot).toBe("player2");
      // Final has no next
      expect(matches[2].next_match_slot).toBeNull();
    });

    it("correct slots for 8 players", () => {
      const matches = generateSingleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);
      // R1: match 0,1 → R2 match 0 (index 4)
      expect(matches[0].next_match_slot).toBe("player1");
      expect(matches[1].next_match_slot).toBe("player2");
      // R1: match 2,3 → R2 match 1 (index 5)
      expect(matches[2].next_match_slot).toBe("player1");
      expect(matches[3].next_match_slot).toBe("player2");
    });
  });

  describe("round_name", () => {
    it("names rounds correctly for 8-player bracket", () => {
      const matches = generateSingleElimination(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);
      // 3 rounds: Quarter-final, Semi-final, Final
      const r1 = matches.filter((m) => m.round === 1);
      const r2 = matches.filter((m) => m.round === 2);
      const r3 = matches.filter((m) => m.round === 3);

      for (const m of r1) expect(m.round_name).toBe("Quarter-final");
      for (const m of r2) expect(m.round_name).toBe("Semi-final");
      for (const m of r3) expect(m.round_name).toBe("Final");
    });

    it("names rounds correctly for 4-player bracket", () => {
      const matches = generateSingleElimination(["A", "B", "C", "D"]);
      expect(matches[0].round_name).toBe("Semi-final");
      expect(matches[1].round_name).toBe("Semi-final");
      expect(matches[2].round_name).toBe("Final");
    });

    it("names rounds correctly for 2-player bracket", () => {
      const matches = generateSingleElimination(["A", "B"]);
      expect(matches[0].round_name).toBe("Final");
    });
  });

  describe("thirdPlaceMatch option", () => {
    it("adds 3rd place match for 4+ players", () => {
      const matches = generateSingleElimination(["A", "B", "C", "D"], {
        thirdPlaceMatch: true,
      });
      // 3 regular matches + 1 third place = 4
      expect(matches).toHaveLength(4);

      const thirdPlace = matches.find((m) => m.bracket_type === "third_place");
      expect(thirdPlace).toBeDefined();
      expect(thirdPlace!.match_id).toBe("3RD-M1");
      expect(thirdPlace!.round_name).toBe("3rd Place Match");
      expect(thirdPlace!.next_match_index).toBeNull();
    });

    it("semi-final losers link to 3rd place match", () => {
      const matches = generateSingleElimination(
        ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"],
        { thirdPlaceMatch: true }
      );
      const thirdPlaceIndex = matches.findIndex((m) => m.bracket_type === "third_place");
      expect(thirdPlaceIndex).toBeGreaterThan(0);

      // Semi-finals (round 2 for 8 players, which is totalRounds - 1 = 2)
      const semis = matches.filter((m) => m.round === 2 && m.bracket_type === "winners");
      expect(semis).toHaveLength(2);

      for (const semi of semis) {
        expect(semi.loser_next_match_index).toBe(thirdPlaceIndex);
      }
      // First semi loser → player1, second → player2
      expect(semis[0].loser_next_match_slot).toBe("player1");
      expect(semis[1].loser_next_match_slot).toBe("player2");
    });

    it("does not add 3rd place match for 2 players (no semi-finals)", () => {
      const matches2 = generateSingleElimination(["A", "B"], { thirdPlaceMatch: true });
      expect(matches2.find((m) => m.bracket_type === "third_place")).toBeUndefined();
    });

    it("adds 3rd place match for 3 players (has semi-finals)", () => {
      const matches3 = generateSingleElimination(["A", "B", "C"], { thirdPlaceMatch: true });
      // 3 players → bracketSize 4 → 2 rounds. Semi-final IS round 1.
      const tp = matches3.find((m) => m.bracket_type === "third_place");
      expect(tp).toBeDefined();
    });

    it("without option, no loser links on semi-finals", () => {
      const matches = generateSingleElimination(["A", "B", "C", "D"]);
      const semis = matches.filter((m) => m.round === 1);
      for (const semi of semis) {
        expect(semi.loser_next_match_index).toBeNull();
        expect(semi.loser_next_match_slot).toBeNull();
      }
    });
  });

  describe("bestOf option", () => {
    it("applies default best_of to all matches", () => {
      const matches = generateSingleElimination(["A", "B", "C", "D"], {
        bestOf: { default: 3 },
      });
      for (const m of matches) {
        expect(m.best_of).toBe(3);
      }
    });

    it("final best_of overrides default", () => {
      const matches = generateSingleElimination(["A", "B", "C", "D"], {
        bestOf: { default: 3, final: 5 },
      });
      const final = matches.find((m) => m.round_name === "Final");
      expect(final!.best_of).toBe(5);

      const nonFinal = matches.filter((m) => m.round_name !== "Final");
      for (const m of nonFinal) {
        expect(m.best_of).toBe(3);
      }
    });

    it("thirdPlace best_of applies to 3rd place match", () => {
      const matches = generateSingleElimination(["A", "B", "C", "D"], {
        thirdPlaceMatch: true,
        bestOf: { default: 3, thirdPlace: 1 },
      });
      const tp = matches.find((m) => m.bracket_type === "third_place");
      expect(tp!.best_of).toBe(1);
    });

    it("best_of is null when not specified", () => {
      const matches = generateSingleElimination(["A", "B", "C", "D"]);
      for (const m of matches) {
        expect(m.best_of).toBeNull();
      }
    });
  });

  describe("input validation", () => {
    it("throws for duplicate IDs", () => {
      expect(() => generateSingleElimination(["A", "A", "B"])).toThrow();
    });

    it("throws for empty string IDs", () => {
      expect(() => generateSingleElimination(["A", ""])).toThrow();
    });
  });
});
