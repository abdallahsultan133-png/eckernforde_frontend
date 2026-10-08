import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { setPublicMotionPreference, usePublicReducedMotion } from "./public-motion";

afterEach(() => { cleanup(); localStorage.removeItem("academix.public.motion"); vi.unstubAllGlobals(); });

it("keeps normal motion on by default and follows a real preference change in both directions", () => {
  const listeners = new Set<() => void>();
  const preference = { matches: false, addEventListener: (_: string, listener: () => void) => listeners.add(listener), removeEventListener: (_: string, listener: () => void) => listeners.delete(listener) };
  vi.stubGlobal("matchMedia", vi.fn(() => preference));
  const { result, unmount } = renderHook(usePublicReducedMotion);
  expect(result.current).toBe(false);
  act(() => { preference.matches = true; listeners.forEach(listener => listener()); });
  expect(result.current).toBe(true);
  act(() => { preference.matches = false; listeners.forEach(listener => listener()); });
  expect(result.current).toBe(false);
  unmount();
  expect(listeners.size).toBe(0);
});

it("respects a reduced system preference until the user explicitly chooses full public-site motion", () => {
  const preference = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", vi.fn(() => preference));
  const { result, unmount } = renderHook(usePublicReducedMotion);
  expect(result.current).toBe(true);
  act(() => setPublicMotionPreference("full"));
  expect(result.current).toBe(false);
  expect(preference.matches).toBe(true);
  unmount();
  const reopened = renderHook(usePublicReducedMotion);
  expect(reopened.result.current).toBe(false);
  act(() => setPublicMotionPreference("system"));
  expect(reopened.result.current).toBe(true);
});

it("allows reduced public-site motion on a device with no reduced-motion preference", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const { result } = renderHook(usePublicReducedMotion);
  expect(result.current).toBe(false);
  act(() => setPublicMotionPreference("reduced"));
  expect(result.current).toBe(true);
  act(() => setPublicMotionPreference("system"));
  expect(result.current).toBe(false);
});
