import { describe, it, expect } from "vitest";
import { generateMatchId } from "../src/match-id";

describe("generateMatchId", () => {
  it("generates winners bracket ID", () => {
    expect(generateMatchId("winners", 1, 1)).toBe("WB-R1-M1");
    expect(generateMatchId("winners", 3, 2)).toBe("WB-R3-M2");
  });

  it("generates losers bracket ID", () => {
    expect(generateMatchId("losers", 1, 1)).toBe("LB-R1-M1");
    expect(generateMatchId("losers", 4, 3)).toBe("LB-R4-M3");
  });

  it("generates grand final ID", () => {
    expect(generateMatchId("grand_final", 1, 1)).toBe("GF-M1");
  });

  it("generates grand final reset ID", () => {
    expect(generateMatchId("grand_final_reset", 1, 1)).toBe("GF-M2");
  });

  it("generates third place ID", () => {
    expect(generateMatchId("third_place", 1, 1)).toBe("3RD-M1");
  });

  it("generates round robin ID", () => {
    expect(generateMatchId("round_robin", 2, 3)).toBe("RR-R2-M3");
  });

  it("generates swiss ID", () => {
    expect(generateMatchId("swiss", 1, 4)).toBe("SW-R1-M4");
  });

  it("generates group stage ID", () => {
    expect(generateMatchId("group_0", 1, 2)).toBe("G0-R1-M2");
    expect(generateMatchId("group_3", 2, 1)).toBe("G3-R2-M1");
  });
});
