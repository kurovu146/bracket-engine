import { describe, it, expect } from "vitest";
import { generateSeedOrder, standardSeed } from "../src/seeding";

describe("generateSeedOrder", () => {
  it("generates correct order for bracketSize 2", () => {
    expect(generateSeedOrder(2)).toEqual([1, 2]);
  });

  it("generates correct order for bracketSize 4", () => {
    // Matchups: 1v4, 2v3
    expect(generateSeedOrder(4)).toEqual([1, 4, 2, 3]);
  });

  it("generates correct order for bracketSize 8", () => {
    // Matchups: 1v8, 4v5, 2v7, 3v6
    expect(generateSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it("generates correct order for bracketSize 16", () => {
    // Matchups: 1v16, 8v9, 4v13, 5v12, 2v15, 7v10, 3v14, 6v11
    const order = generateSeedOrder(16);
    expect(order).toEqual([1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11]);
  });

  it("top 2 seeds are on opposite halves of the bracket", () => {
    const order = generateSeedOrder(8);
    // Seed 1 is in first half (positions 0-3), seed 2 is in second half (positions 4-7)
    const seed1Pos = order.indexOf(1);
    const seed2Pos = order.indexOf(2);
    expect(seed1Pos).toBeLessThan(4);
    expect(seed2Pos).toBeGreaterThanOrEqual(4);
  });

  it("if all top seeds win, seed 1 meets seed 2 in the final", () => {
    const order = generateSeedOrder(8);
    // First half: seeds 1,8,4,5 — winner of top half = seed 1
    // Second half: seeds 2,7,3,6 — winner of bottom half = seed 2
    // They meet in the final ✓
    const firstHalf = order.slice(0, 4);
    const secondHalf = order.slice(4, 8);
    expect(firstHalf).toContain(1);
    expect(secondHalf).toContain(2);
  });
});

describe("standardSeed", () => {
  it("seeds 2 players correctly", () => {
    const result = standardSeed(["A", "B"], 2);
    // Seed 1 (A) vs Seed 2 (B)
    expect(result).toEqual(["A", "B"]);
  });

  it("seeds 4 players correctly", () => {
    const result = standardSeed(["P1", "P2", "P3", "P4"], 4);
    // Order: seed 1,4,2,3 → P1,P4,P2,P3
    // Matchups: P1 vs P4, P2 vs P3
    expect(result).toEqual(["P1", "P4", "P2", "P3"]);
  });

  it("seeds 8 players correctly", () => {
    const result = standardSeed(
      ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"],
      8
    );
    // Order: 1,8,4,5,2,7,3,6 → P1,P8,P4,P5,P2,P7,P3,P6
    expect(result).toEqual(["P1", "P8", "P4", "P5", "P2", "P7", "P3", "P6"]);
  });

  it("handles 3 players in bracketSize 4 — seed 1 gets bye", () => {
    const result = standardSeed(["A", "B", "C"], 4);
    // Seed order for size 4: [1, 4, 2, 3]
    // Seed 4 doesn't exist → null (bye)
    // Result: [A, null, B, C]
    // Matchups: A vs null (bye → A advances), B vs C
    expect(result).toEqual(["A", null, "B", "C"]);
  });

  it("handles 5 players in bracketSize 8 — top 3 seeds get byes", () => {
    const result = standardSeed(["P1", "P2", "P3", "P4", "P5"], 8);
    // Seed order: [1, 8, 4, 5, 2, 7, 3, 6]
    // Seeds 6,7,8 don't exist → null
    // Result: [P1, null, P4, P5, P2, null, P3, null]
    expect(result).toEqual(["P1", null, "P4", "P5", "P2", null, "P3", null]);
  });

  it("handles 6 players in bracketSize 8", () => {
    const result = standardSeed(
      ["P1", "P2", "P3", "P4", "P5", "P6"],
      8
    );
    // Seed order: [1, 8, 4, 5, 2, 7, 3, 6]
    // Seeds 7,8 don't exist → null
    // Result: [P1, null, P4, P5, P2, null, P3, P6]
    expect(result).toEqual(["P1", null, "P4", "P5", "P2", null, "P3", "P6"]);
  });

  it("handles 7 players in bracketSize 8 — seed 1 gets bye", () => {
    const result = standardSeed(
      ["P1", "P2", "P3", "P4", "P5", "P6", "P7"],
      8
    );
    // Seed order: [1, 8, 4, 5, 2, 7, 3, 6]
    // Seed 8 doesn't exist → null
    // Result: [P1, null, P4, P5, P2, P7, P3, P6]
    expect(result).toEqual(["P1", null, "P4", "P5", "P2", "P7", "P3", "P6"]);
  });

  it("full bracket (power of 2) has no byes", () => {
    const result = standardSeed(["A", "B", "C", "D"], 4);
    expect(result.every((id) => id !== null)).toBe(true);
  });
});
