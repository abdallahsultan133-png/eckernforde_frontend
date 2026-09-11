import { afterEach, describe, expect, it, vi } from "vitest";
import { authProvider } from "./auth";

describe("authProvider session resilience", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("accepts a valid Better Auth session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { id: "student-1" } }), { status: 200 })));

    await expect(authProvider.check?.({})).resolves.toEqual({ authenticated: true });
  });

  it("returns the sign-in redirect when the session endpoint is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));

    await expect(authProvider.check?.({})).resolves.toEqual({ authenticated: false, redirectTo: "/login" });
  });

  it("does not throw when identity data is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("temporarily unavailable", { status: 503 })));

    await expect(authProvider.getIdentity?.({})).resolves.toBeNull();
  });
});
