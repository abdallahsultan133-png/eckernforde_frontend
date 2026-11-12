import { describe, expect, it } from "vitest";
import { getPublicChapterOpacity } from "./public-chapter-progress";
describe("paused chapter readability", () => {
  it.each([1, 2, 3, 4])(
    "keeps content visible throughout a %i chapter sequence",
    (count) => {
      for (let step = 0; step <= 100; step++) {
        const opacity = Array.from({ length: count }, (_, index) =>
          getPublicChapterOpacity(step / 100, index, count)
        );
        expect(opacity.every((value) => value >= 0 && value <= 1)).toBe(true);
        expect(
          opacity.reduce((sum, value) => sum + value, 0)
        ).toBeGreaterThanOrEqual(0.999);
      }
    }
  );
});
