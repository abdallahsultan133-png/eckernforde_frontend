import { describe, expect, it } from "vitest";
import { letterForScore } from "./grade-bands";

describe("Academix score bands", () => {
  it.each([[100, "A"], [75, "A"], [74, "B"], [65, "B"], [64, "C"], [45, "C"], [44, "D"], [30, "D"], [29, "F"], [0, "F"]])("maps %s to %s", (score, expected) => {
    expect(letterForScore(score)).toBe(expected);
  });

  it("returns null for missing scores", () => {
    expect(letterForScore(null)).toBeNull();
    expect(letterForScore(undefined)).toBeNull();
  });
});
