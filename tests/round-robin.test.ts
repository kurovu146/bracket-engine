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
      bracket_type: "winners",
    });
  });

  it("generates correct number of matches for 4 players", () => {
    const matches = generateRoundRobin(["A", "B", "C", "D"]);
    // C(4,2) = 6 matches
    expect(matches).toHaveLength(6);
    // 3 rounds, 2 matches each
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
      expect(pairs.has(pair)).toBe(false); // no duplicate
      pairs.add(pair);
    }

    // Total unique pairs = C(4,2) = 6
    expect(pairs.size).toBe(6);
  });

  it("handles odd number of players (3 players)", () => {
    const matches = generateRoundRobin(["A", "B", "C"]);
    // C(3,2) = 3 matches, no bye matches in output
    expect(matches).toHaveLength(3);

    // No match contains __bye__
    for (const m of matches) {
      expect(m.player1_id).not.toBe("__bye__");
      expect(m.player2_id).not.toBe("__bye__");
    }
  });

  it("handles odd number of players (5 players)", () => {
    const ids = ["A", "B", "C", "D", "E"];
    const matches = generateRoundRobin(ids);
    // C(5,2) = 10 matches
    expect(matches).toHaveLength(10);

    // Each player appears in exactly 4 matches (plays against 4 others)
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
    // C(6,2) = 15 matches, 5 rounds x 3 matches
    expect(matches).toHaveLength(15);

    const pairs = new Set<string>();
    for (const m of matches) {
      pairs.add([m.player1_id!, m.player2_id!].sort().join("-"));
    }
    expect(pairs.size).toBe(15);
  });
});
