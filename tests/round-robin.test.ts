import { describe, it, expect } from "vitest";
import { generateRoundRobin } from "../src";

describe("generateRoundRobin", () => {
  it("returns empty array for less than 2 participants", () => {
    expect(generateRoundRobin([])).toEqual([]);
    expect(generateRoundRobin(["A"])).toEqual([]);
  });

  it("generates 1 match for 2 players", () => {
    const matches = generateRoundRobin(["A", "B"]);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      round: 1,
      player1_id: "A",
      player2_id: "B",
      bracket_type: "round_robin",
    });
  });

  it("generates correct number of matches for 4 players", () => {
    const matches = generateRoundRobin(["A", "B", "C", "D"]);
    expect(matches).toHaveLength(6);
    expect(matches.filter((m) => m.round === 1)).toHaveLength(2);
    expect(matches.filter((m) => m.round === 2)).toHaveLength(2);
    expect(matches.filter((m) => m.round === 3)).toHaveLength(2);
  });

  it("every pair plays exactly once", () => {
    const ids = ["A", "B", "C", "D"];
    const matches = generateRoundRobin(ids);
    const pairs = new Set<string>();

    for (const m of matches) {
      const pair = [m.player1_id!, m.player2_id!].sort().join("-");
      expect(pairs.has(pair)).toBe(false);
      pairs.add(pair);
    }

    expect(pairs.size).toBe(6);
  });

  it("handles odd number of players (3 players)", () => {
    const matches = generateRoundRobin(["A", "B", "C"]);
    expect(matches).toHaveLength(3);

    for (const m of matches) {
      expect(m.player1_id).not.toBeNull();
      expect(m.player2_id).not.toBeNull();
    }
  });

  it("handles odd number of players (5 players)", () => {
    const ids = ["A", "B", "C", "D", "E"];
    const matches = generateRoundRobin(ids);
    expect(matches).toHaveLength(10);

    for (const id of ids) {
      const count = matches.filter(
        (m) => m.player1_id === id || m.player2_id === id
      ).length;
      expect(count).toBe(4);
    }
  });

  it("has no next_match_index (no linking)", () => {
    const matches = generateRoundRobin(["A", "B", "C", "D"]);
    for (const m of matches) {
      expect(m.next_match_index).toBeNull();
      expect(m.loser_next_match_index).toBeNull();
      expect(m.next_match_slot).toBeNull();
      expect(m.loser_next_match_slot).toBeNull();
    }
  });

  it("generates sequential match numbers", () => {
    const matches = generateRoundRobin(["A", "B", "C", "D"]);
    for (let i = 0; i < matches.length; i++) {
      expect(matches[i].match_number).toBe(i + 1);
    }
  });

  it("generates correct matches for 6 players", () => {
    const ids = ["A", "B", "C", "D", "E", "F"];
    const matches = generateRoundRobin(ids);
    expect(matches).toHaveLength(15);

    const pairs = new Set<string>();
    for (const m of matches) {
      pairs.add([m.player1_id!, m.player2_id!].sort().join("-"));
    }
    expect(pairs.size).toBe(15);
  });

  // ===== NEW TESTS =====

  describe("bracket_type", () => {
    it("all matches have bracket_type = round_robin", () => {
      const matches = generateRoundRobin(["A", "B", "C", "D"]);
      for (const m of matches) {
        expect(m.bracket_type).toBe("round_robin");
      }
    });
  });

  describe("match_id", () => {
    it("generates RR-format match IDs", () => {
      const matches = generateRoundRobin(["A", "B", "C", "D"]);
      for (const m of matches) {
        expect(m.match_id).toMatch(/^RR-R\d+-M\d+$/);
      }
    });

    it("match IDs are unique", () => {
      const matches = generateRoundRobin(["A", "B", "C", "D", "E", "F"]);
      const ids = matches.map((m) => m.match_id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("round_name", () => {
    it("all matches have Round N format", () => {
      const matches = generateRoundRobin(["A", "B", "C", "D"]);
      for (const m of matches) {
        expect(m.round_name).toBe(`Round ${m.round}`);
      }
    });
  });

  describe("is_bye", () => {
    it("all matches have is_bye = false (byes are filtered out)", () => {
      const matches = generateRoundRobin(["A", "B", "C"]);
      for (const m of matches) {
        expect(m.is_bye).toBe(false);
      }
    });
  });

  describe("bye sentinel safety", () => {
    it("participant ID '__bye__' does not cause collision", () => {
      const matches = generateRoundRobin(["__bye__", "A", "B"]);
      expect(matches).toHaveLength(3);

      // __bye__ should appear as a real player
      const byePlayerMatches = matches.filter(
        (m) => m.player1_id === "__bye__" || m.player2_id === "__bye__"
      );
      expect(byePlayerMatches).toHaveLength(2); // plays against A and B
    });
  });

  describe("doubleRoundRobin option", () => {
    it("doubles the number of matches", () => {
      const single = generateRoundRobin(["A", "B", "C", "D"]);
      const double = generateRoundRobin(["A", "B", "C", "D"], { doubleRoundRobin: true });
      expect(double).toHaveLength(single.length * 2);
    });

    it("second pass has swapped player positions", () => {
      const matches = generateRoundRobin(["A", "B"], { doubleRoundRobin: true });
      expect(matches).toHaveLength(2);
      // First pass: A vs B
      expect(matches[0]).toMatchObject({ player1_id: "A", player2_id: "B" });
      // Second pass: B vs A (swapped)
      expect(matches[1]).toMatchObject({ player1_id: "B", player2_id: "A" });
    });

    it("second pass has higher round numbers", () => {
      const matches = generateRoundRobin(["A", "B", "C", "D"], { doubleRoundRobin: true });
      const firstPassRounds = 3; // n-1 rounds for 4 players
      const secondPassMatches = matches.filter((m) => m.round > firstPassRounds);
      expect(secondPassMatches).toHaveLength(6);
    });

    it("every pair plays exactly twice", () => {
      const matches = generateRoundRobin(["A", "B", "C", "D"], { doubleRoundRobin: true });
      const pairCounts = new Map<string, number>();

      for (const m of matches) {
        const pair = [m.player1_id!, m.player2_id!].sort().join("-");
        pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
      }

      for (const count of pairCounts.values()) {
        expect(count).toBe(2);
      }
    });
  });

  describe("bestOf option", () => {
    it("applies default best_of", () => {
      const matches = generateRoundRobin(["A", "B", "C", "D"], { bestOf: { default: 3 } });
      for (const m of matches) {
        expect(m.best_of).toBe(3);
      }
    });

    it("best_of is null when not specified", () => {
      const matches = generateRoundRobin(["A", "B", "C", "D"]);
      for (const m of matches) {
        expect(m.best_of).toBeNull();
      }
    });
  });

  describe("input validation", () => {
    it("throws for duplicate IDs", () => {
      expect(() => generateRoundRobin(["A", "A", "B"])).toThrow();
    });

    it("throws for empty string IDs", () => {
      expect(() => generateRoundRobin(["A", ""])).toThrow();
    });
  });
});
