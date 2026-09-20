import { afterEach, describe, expect, it, vi } from "vitest";
import { authProvider } from "./auth";

describe("authProvider session resilience", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("accepts a valid Better Auth session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { id: "student-1" } }), { status: 200 })));

    await expect(authProvider.check?.({})).resolves.toEqual({ authenticated: true });
  });

  it("keeps the current protected route when the session endpoint is temporarily unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));

    await expect(authProvider.check?.({})).resolves.toEqual({ authenticated: true });
  });

  it("returns the sign-in redirect only when the session is explicitly unauthorized", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(authProvider.check?.({})).resolves.toEqual({ authenticated: false, redirectTo: "/login" });
  });

  it("does not throw when identity data is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("temporarily unavailable", { status: 503 })));

    await expect(authProvider.getIdentity?.({})).resolves.toBeNull();
  });

  it("hydrates a missing session role from the authenticated profile", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: "super-1", name: "Super Admin" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: "super-1", role: "super_admin" } }), { status: 200 })));

    await expect(authProvider.getIdentity?.({})).resolves.toMatchObject({
      id: "super-1",
      role: "super_admin",
    });
  });

  it("does not expose server details from forgot-password failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "internal mail provider details" }), { status: 500 })));

    await expect(authProvider.forgotPassword?.({ email: "student@school.edu" })).resolves.toMatchObject({
      success: false,
      error: { message: "We couldn't send the reset link. Please check the address and try again." },
    });
  });

  it("does not expose server details from reset-password failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "database error details" }), { status: 500 })));

    await expect(authProvider.updatePassword?.({ password: "password123", confirmPassword: "password123", token: "reset-token" })).resolves.toMatchObject({
      success: false,
      error: { message: "This link may have expired or already been used. Request a new one." },
    });
  });

  it("retries a temporary sign-in service failure once", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const login = authProvider.login?.({ email: "teacher@school.edu", password: "password123" });
    await vi.advanceTimersByTimeAsync(350);

    await expect(login).resolves.toMatchObject({ success: true, redirectTo: "/portal" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("does not retry an invalid sign-in", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(authProvider.login?.({ email: "teacher@school.edu", password: "wrong-password" })).resolves.toMatchObject({
      success: false,
      error: { name: "Invalid credentials" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
