import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "./auth-messages";

describe("friendlyAuthError", () => {
  it("does not expose duplicate-account backend details", () => {
    expect(friendlyAuthError(new Error("users_email_key duplicate constraint"))).toBe("An account with this email already exists.");
  });

  it("maps network failures to an actionable message", () => {
    expect(friendlyAuthError(new Error("fetch failed"))).toBe("Unable to connect. Please try again.");
  });

  it("uses a safe fallback for unknown errors", () => {
    expect(friendlyAuthError({ secret: "do not show" })).toContain("We could not complete");
  });
});
