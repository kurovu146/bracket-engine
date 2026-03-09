import { describe, it, expect } from "vitest";
import { generateGroupStage } from "../src";

describe("generateGroupStage", () => {
  it("returns empty for less than 2 participants", () => {
    const result = generateGroupStage([]);
    expect(result.groups).toEqual([]);
    expect(result.matches).toEqual([]);

    const result2 = generateGroupStage(["A"]);
    expect(result2.groups).toEqual([]);
    expect(result2.matches).toEqual([]);
  });

  it("generates correct groups for 8 players, 2 groups", () => {
    const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const result = generateGroupStage(ids, 2);

    expect(result.groups).toHaveLength(2);
    // Sequential distribution: A,C,E,G in group 0 | B,D,F,H in group 1
    expect(result.groups[0]).toEqual(["A", "C", "E", "G"]);
    expect(result.groups[1]).toEqual(["B", "D", "F", "H"]);
  });

  it("generates correct number of matches (round-robin per group)", () => {
    const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const result = generateGroupStage(ids, 2);

    expect(result.matches).toHaveLength(12);
  });

  it("matches have correct group bracket_type", () => {
    const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const result = generateGroupStage(ids, 2);

    const group0Matches = result.matches.filter(
      (m) => m.bracket_type === "group_0"
    );
    const group1Matches = result.matches.filter(
      (m) => m.bracket_type === "group_1"
    );

    expect(group0Matches).toHaveLength(6);
    expect(group1Matches).toHaveLength(6);
  });

  it("group matches only contain players from that group", () => {
    const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const result = generateGroupStage(ids, 2);

    const group0Players = new Set(result.groups[0]);
    const group0Matches = result.matches.filter(
      (m) => m.bracket_type === "group_0"
    );

    for (const m of group0Matches) {
      expect(group0Players.has(m.player1_id!)).toBe(true);
      expect(group0Players.has(m.player2_id!)).toBe(true);
    }
  });

  it("generates sequential match numbers across all groups", () => {
    const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const result = generateGroupStage(ids, 2);

    for (let i = 0; i < result.matches.length; i++) {
      expect(result.matches[i].match_number).toBe(i + 1);
    }
  });

  it("handles uneven group distribution", () => {
    const ids = ["A", "B", "C", "D", "E", "F", "G"];
    const result = generateGroupStage(ids, 2);

    expect(result.groups[0]).toHaveLength(4);
    expect(result.groups[1]).toHaveLength(3);

    expect(result.matches).toHaveLength(9);
  });

  it("auto-calculates groups when not specified", () => {
    const ids = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
    const result = generateGroupStage(ids);

    expect(result.groups).toHaveLength(4);
    for (const group of result.groups) {
      expect(group.length).toBeGreaterThanOrEqual(3);
      expect(group.length).toBeLessThanOrEqual(5);
    }
  });

  it("generates 4 groups for 12 players", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `P${i + 1}`);
    const result = generateGroupStage(ids, 4);

    expect(result.groups).toHaveLength(4);
    expect(result.matches).toHaveLength(12);
  });

  it("has no match linking (standalone matches)", () => {
    const ids = ["A", "B", "C", "D", "E", "F"];
    const result = generateGroupStage(ids, 2);

    for (const m of result.matches) {
      expect(m.next_match_index).toBeNull();
      expect(m.loser_next_match_index).toBeNull();
      expect(m.next_match_slot).toBeNull();
      expect(m.loser_next_match_slot).toBeNull();
    }
  });

  it("every pair plays exactly once within their group", () => {
    const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const result = generateGroupStage(ids, 2);

    for (let gi = 0; gi < result.groups.length; gi++) {
      const groupMatches = result.matches.filter(
        (m) => m.bracket_type === `group_${gi}`
      );
      const pairs = new Set<string>();

      for (const m of groupMatches) {
        const pair = [m.player1_id!, m.player2_id!].sort().join("-");
        expect(pairs.has(pair)).toBe(false);
        pairs.add(pair);
      }

      const groupSize = result.groups[gi].length;
      const expectedPairs = (groupSize * (groupSize - 1)) / 2;
      expect(pairs.size).toBe(expectedPairs);
    }
  });

  it("handles 2 players with 1 group", () => {
    const result = generateGroupStage(["A", "B"], 1);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]).toEqual(["A", "B"]);
    expect(result.matches).toHaveLength(1);
  });

  it("handles 2 players with 2 groups (each group has 1 player)", () => {
    const result = generateGroupStage(["A", "B"], 2);
    // Groups preserved: [["A"], ["B"]] — both have < 2 players, 0 matches
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0]).toEqual(["A"]);
    expect(result.groups[1]).toEqual(["B"]);
    expect(result.matches).toHaveLength(0);
  });

  // ===== NEW TESTS =====

  describe("group index stability", () => {
    it("preserves original group indices even when some groups have < 2 players", () => {
      // 5 players, 3 groups: group_0=[A,D], group_1=[B,E], group_2=[C]
      const result = generateGroupStage(["A", "B", "C", "D", "E"], 3);

      expect(result.groups).toHaveLength(3);
      expect(result.groups[2]).toEqual(["C"]); // 1 player, preserved

      // group_2 has no matches but bracket_type "group_0" and "group_1" exist
      const g0 = result.matches.filter((m) => m.bracket_type === "group_0");
      const g1 = result.matches.filter((m) => m.bracket_type === "group_1");
      const g2 = result.matches.filter((m) => m.bracket_type === "group_2");

      expect(g0.length).toBeGreaterThan(0);
      expect(g1.length).toBeGreaterThan(0);
      expect(g2).toHaveLength(0); // no matches, but index preserved
    });
  });

  describe("match_id", () => {
    it("generates G{N}-format match IDs", () => {
      const result = generateGroupStage(["A", "B", "C", "D"], 2);
      for (const m of result.matches) {
        expect(m.match_id).toMatch(/^G\d+-R\d+-M\d+$/);
      }
    });

    it("match IDs are unique", () => {
      const result = generateGroupStage(
        Array.from({ length: 16 }, (_, i) => `P${i + 1}`),
        4
      );
      const ids = result.matches.map((m) => m.match_id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("snake draft distribution", () => {
    it("distributes players in snake order", () => {
      const ids = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
      const result = generateGroupStage(ids, { numGroups: 2, distribution: "snake" });

      // Snake: 0,1,1,0,0,1,1,0
      // Group 0: P1, P4, P5, P8
      // Group 1: P2, P3, P6, P7
      expect(result.groups[0]).toEqual(["P1", "P4", "P5", "P8"]);
      expect(result.groups[1]).toEqual(["P2", "P3", "P6", "P7"]);
    });

    it("snake with 4 groups", () => {
      const ids = Array.from({ length: 8 }, (_, i) => `P${i + 1}`);
      const result = generateGroupStage(ids, { numGroups: 4, distribution: "snake" });

      // Snake 4 groups: 0,1,2,3,3,2,1,0
      // Group 0: P1, P8
      // Group 1: P2, P7
      // Group 2: P3, P6
      // Group 3: P4, P5
      expect(result.groups[0]).toEqual(["P1", "P8"]);
      expect(result.groups[1]).toEqual(["P2", "P7"]);
      expect(result.groups[2]).toEqual(["P3", "P6"]);
      expect(result.groups[3]).toEqual(["P4", "P5"]);
    });

    it("default distribution is sequential", () => {
      const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const result = generateGroupStage(ids, { numGroups: 2 });

      // Sequential: 0,1,0,1,...
      expect(result.groups[0]).toEqual(["A", "C", "E", "G"]);
      expect(result.groups[1]).toEqual(["B", "D", "F", "H"]);
    });
  });

  describe("doubleRoundRobin option", () => {
    it("doubles matches within each group", () => {
      const single = generateGroupStage(["A", "B", "C", "D"], { numGroups: 2 });
      const double = generateGroupStage(["A", "B", "C", "D"], {
        numGroups: 2,
        doubleRoundRobin: true,
      });
      expect(double.matches).toHaveLength(single.matches.length * 2);
    });
  });

  describe("bestOf option", () => {
    it("applies best_of to all matches", () => {
      const result = generateGroupStage(["A", "B", "C", "D"], {
        numGroups: 2,
        bestOf: { default: 3 },
      });
      for (const m of result.matches) {
        expect(m.best_of).toBe(3);
      }
    });
  });

  describe("backward compatibility", () => {
    it("number argument still works as numGroups", () => {
      const result = generateGroupStage(["A", "B", "C", "D", "E", "F"], 2);
      expect(result.groups).toHaveLength(2);
    });

    it("options object works", () => {
      const result = generateGroupStage(["A", "B", "C", "D", "E", "F"], { numGroups: 3 });
      expect(result.groups).toHaveLength(3);
    });
  });

  describe("input validation", () => {
    it("throws for duplicate IDs", () => {
      expect(() => generateGroupStage(["A", "A", "B"])).toThrow();
    });

    it("throws for empty string IDs", () => {
      expect(() => generateGroupStage(["A", ""])).toThrow();
    });
  });

  describe("round_name", () => {
    it("matches have Round N format", () => {
      const result = generateGroupStage(["A", "B", "C", "D"], 2);
      for (const m of result.matches) {
        expect(m.round_name).toBe(`Round ${m.round}`);
      }
    });
  });
});
