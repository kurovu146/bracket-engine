import { describe, it, expect } from "vitest";
import { BracketError, validateParticipants } from "../src/errors";

describe("validateParticipants", () => {
  it("passes for valid participants", () => {
    expect(() => validateParticipants(["A", "B", "C"])).not.toThrow();
  });

  it("throws for less than 2 participants by default", () => {
    expect(() => validateParticipants([])).toThrow(BracketError);
    expect(() => validateParticipants(["A"])).toThrow(BracketError);
  });

  it("respects custom minParticipants", () => {
    expect(() =>
      validateParticipants(["A", "B"], { minParticipants: 3 })
    ).toThrow(BracketError);
    expect(() =>
      validateParticipants(["A", "B", "C"], { minParticipants: 3 })
    ).not.toThrow();
  });

  it("throws for empty string IDs", () => {
    expect(() => validateParticipants(["A", ""])).toThrow(BracketError);
    expect(() => validateParticipants(["", "B"])).toThrow(BracketError);
  });

  it("throws for whitespace-only IDs", () => {
    expect(() => validateParticipants(["A", "  "])).toThrow(BracketError);
    expect(() => validateParticipants(["\t", "B"])).toThrow(BracketError);
  });

  it("throws for duplicate IDs", () => {
    expect(() => validateParticipants(["A", "A", "B"])).toThrow(BracketError);
    expect(() => validateParticipants(["A", "B", "A"])).toThrow(BracketError);
  });

  it("error message includes index for duplicates", () => {
    expect(() => validateParticipants(["X", "Y", "X"])).toThrow(
      /index 2/
    );
  });

  it("error message includes index for invalid IDs", () => {
    expect(() => validateParticipants(["A", ""])).toThrow(/index 1/);
  });

  it("BracketError is instanceof Error", () => {
    const err = new BracketError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("BracketError");
  });
});
