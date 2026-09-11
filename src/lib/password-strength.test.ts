import { describe, expect, it } from "vitest";

import { scorePassword } from "./password-strength";

describe("scorePassword", () => {
    it("returns an empty score for an empty string", () => {
        expect(scorePassword("")).toMatchObject({ score: 0, label: "", meetsMinimum: false });
    });

    it("is always Weak below 8 characters, however varied", () => {
        expect(scorePassword("aB3$")).toMatchObject({ score: 1, label: "Weak", meetsMinimum: false });
        expect(scorePassword("abcd")).toMatchObject({ score: 1, meetsMinimum: false });
    });

    it("flags a plain 8-char lowercase password as Weak", () => {
        expect(scorePassword("password")).toMatchObject({ score: 1, label: "Weak", meetsMinimum: true });
    });

    it("rates a short but varied password as Fair, not Strong", () => {
        // 8 chars, all four classes → past the minimum but not long
        expect(scorePassword("aB3$xyz!").score).toBe(2);
    });

    it("rates a 12-char three-class password as Good", () => {
        expect(scorePassword("Abcdefgh1234").label).toBe("Good");
    });

    it("only calls a 16+ char, four-class password Strong", () => {
        expect(scorePassword("Abcdefghij123456").label).toBe("Good"); // no symbol
        expect(scorePassword("Abcdefghij123$%^").label).toBe("Strong");
    });

    it("suggests what is missing", () => {
        const { suggestions } = scorePassword("abc");
        expect(suggestions[0]).toMatch(/at least 8/i);
        expect(scorePassword("abcdefghij").suggestions).toContain("Add a number");
    });
});
