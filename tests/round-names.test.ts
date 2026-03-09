import { describe, it, expect } from "vitest";
import { resolveRoundName } from "../src/round-names";

describe("resolveRoundName", () => {
  describe("winners bracket", () => {
    it("returns Final for last round", () => {
      expect(resolveRoundName("winners", 3, 3)).toBe("Final");
    });

    it("returns Semi-final for second to last", () => {
      expect(resolveRoundName("winners", 2, 3)).toBe("Semi-final");
    });

    it("returns Quarter-final for third to last", () => {
      expect(resolveRoundName("winners", 1, 3)).toBe("Quarter-final");
    });

    it("returns Round N for earlier rounds", () => {
      expect(resolveRoundName("winners", 1, 4)).toBe("Round 1");
      expect(resolveRoundName("winners", 2, 5)).toBe("Round 2");
    });
  });

  describe("losers bracket", () => {
    it("returns LB Final for last round", () => {
      expect(resolveRoundName("losers", 4, 4)).toBe("LB Final");
    });

    it("returns LB Semi-final for second to last", () => {
      expect(resolveRoundName("losers", 3, 4)).toBe("LB Semi-final");
    });

    it("returns LB Round N for earlier rounds", () => {
      expect(resolveRoundName("losers", 1, 4)).toBe("LB Round 1");
    });
  });

  describe("special types", () => {
    it("returns Grand Final", () => {
      expect(resolveRoundName("grand_final", 1, 1)).toBe("Grand Final");
    });

    it("returns Grand Final Reset", () => {
      expect(resolveRoundName("grand_final_reset", 1, 1)).toBe("Grand Final Reset");
    });

    it("returns 3rd Place Match", () => {
      expect(resolveRoundName("third_place", 1, 1)).toBe("3rd Place Match");
    });
  });

  describe("round-robin and swiss", () => {
    it("returns Round N for round_robin", () => {
      expect(resolveRoundName("round_robin", 3, 5)).toBe("Round 3");
    });

    it("returns Round N for swiss", () => {
      expect(resolveRoundName("swiss", 2, 4)).toBe("Round 2");
    });
  });

  describe("group stage", () => {
    it("returns Round N for group matches", () => {
      expect(resolveRoundName("group_0", 1, 3)).toBe("Round 1");
      expect(resolveRoundName("group_2", 2, 3)).toBe("Round 2");
    });
  });
});
