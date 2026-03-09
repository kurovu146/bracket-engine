import { describe, it, expect } from "vitest";
import { generateSwiss } from "../src";

describe("generateSwiss", () => {
  it("returns empty array for less than 2 participants", () => {
    expect(generateSwiss([])).toEqual([]);
    expect(generateSwiss(["A"])).toEqual([]);
  });

  it("generates correct matches for 2 players", () => {
    const matches = generateSwiss(["A", "B"]);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      round: 1,
      match_number: 1,
      player1_id: "A",
      player2_id: "B",
      bracket_type: "swiss",
    });
  });

  it("generates correct number of rounds for 8 players", () => {
    const matches = generateSwiss(["A", "B", "C", "D", "E", "F", "G", "H"]);
    expect(matches).toHaveLength(12);

    expect(matches.filter((m) => m.round === 1)).toHaveLength(4);
    expect(matches.filter((m) => m.round === 2)).toHaveLength(4);
    expect(matches.filter((m) => m.round === 3)).toHaveLength(4);
  });

  it("round 1 has real players, rounds 2+ have null placeholders", () => {
    const matches = generateSwiss(["A", "B", "C", "D"]);

    const round1 = matches.filter((m) => m.round === 1);
    const round2 = matches.filter((m) => m.round === 2);

    for (const m of round1) {
      expect(m.player1_id).not.toBeNull();
      expect(m.player2_id).not.toBeNull();
    }

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

  it("supports custom number of rounds (number argument, backward compat)", () => {
    const matches = generateSwiss(["A", "B", "C", "D"], 5);
    expect(matches).toHaveLength(10);

    const rounds = new Set(matches.map((m) => m.round));
    expect(rounds.size).toBe(5);
  });

  it("supports custom number of rounds (options object)", () => {
    const matches = generateSwiss(["A", "B", "C", "D"], { numRounds: 5 });
    expect(matches).toHaveLength(10);

    const rounds = new Set(matches.map((m) => m.round));
    expect(rounds.size).toBe(5);
  });

  it("handles odd number of players (bye player sits out)", () => {
    const matches = generateSwiss(["A", "B", "C", "D", "E"]);
    expect(matches).toHaveLength(6);

    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(2);
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
      expect(m.next_match_slot).toBeNull();
      expect(m.loser_next_match_slot).toBeNull();
    }
  });

  it("generates correct rounds for 16 players", () => {
    const ids = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
    const matches = generateSwiss(ids);
    expect(matches).toHaveLength(32);

    for (let round = 1; round <= 4; round++) {
      expect(matches.filter((m) => m.round === round)).toHaveLength(8);
    }
  });

  it("generates correct rounds for 32 players", () => {
    const ids = Array.from({ length: 32 }, (_, i) => `P${i + 1}`);
    const matches = generateSwiss(ids);
    expect(matches).toHaveLength(80);
  });

  // ===== NEW TESTS =====

  describe("bracket_type", () => {
    it("all matches have bracket_type = swiss", () => {
      const matches = generateSwiss(["A", "B", "C", "D", "E", "F"]);
      for (const m of matches) {
        expect(m.bracket_type).toBe("swiss");
      }
    });
  });

  describe("match_id", () => {
    it("generates SW-format match IDs", () => {
      const matches = generateSwiss(["A", "B", "C", "D"]);
      for (const m of matches) {
        expect(m.match_id).toMatch(/^SW-R\d+-M\d+$/);
      }
    });

    it("match IDs are unique", () => {
      const matches = generateSwiss(
        Array.from({ length: 16 }, (_, i) => `P${i + 1}`)
      );
      const ids = matches.map((m) => m.match_id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("round_name", () => {
    it("all matches have Round N format", () => {
      const matches = generateSwiss(["A", "B", "C", "D"]);
      for (const m of matches) {
        expect(m.round_name).toBe(`Round ${m.round}`);
      }
    });
  });

  describe("is_bye", () => {
    it("all matches have is_bye = false", () => {
      const matches = generateSwiss(["A", "B", "C", "D", "E"]);
      for (const m of matches) {
        expect(m.is_bye).toBe(false);
      }
    });
  });

  describe("bestOf option", () => {
    it("applies default best_of", () => {
      const matches = generateSwiss(["A", "B", "C", "D"], { bestOf: { default: 3 } });
      for (const m of matches) {
        expect(m.best_of).toBe(3);
      }
    });

    it("best_of is null when not specified", () => {
      const matches = generateSwiss(["A", "B", "C", "D"]);
      for (const m of matches) {
        expect(m.best_of).toBeNull();
      }
    });
  });

  describe("input validation", () => {
    it("throws for duplicate IDs", () => {
      expect(() => generateSwiss(["A", "A", "B"])).toThrow();
    });

    it("throws for empty string IDs", () => {
      expect(() => generateSwiss(["A", ""])).toThrow();
    });
  });
});
