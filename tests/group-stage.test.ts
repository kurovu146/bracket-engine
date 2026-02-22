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

    // 4 players per group → C(4,2) = 6 matches per group → 12 total
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

    // 7 players, 2 groups: group 0 gets 4, group 1 gets 3
    expect(result.groups[0]).toHaveLength(4);
    expect(result.groups[1]).toHaveLength(3);

    // Group 0: C(4,2) = 6 matches, Group 1: C(3,2) = 3 matches
    expect(result.matches).toHaveLength(9);
  });

  it("auto-calculates groups when not specified", () => {
    const ids = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
    const result = generateGroupStage(ids);

    // round(16/4) = 4 groups, 4 players each
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
    // 3 players per group → C(3,2) = 3 matches per group → 12 total
    expect(result.matches).toHaveLength(12);
  });

  it("has no match linking (standalone matches)", () => {
    const ids = ["A", "B", "C", "D", "E", "F"];
    const result = generateGroupStage(ids, 2);

    for (const m of result.matches) {
      expect(m.next_match_index).toBeNull();
      expect(m.loser_next_match_index).toBeNull();
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

  it("handles 2 players with 2 groups (each group has 1 player, no valid matches)", () => {
    const result = generateGroupStage(["A", "B"], 2);
    // Each group has 1 player → both filtered out → no valid groups
    expect(result.groups).toHaveLength(0);
    expect(result.matches).toHaveLength(0);
  });
});
