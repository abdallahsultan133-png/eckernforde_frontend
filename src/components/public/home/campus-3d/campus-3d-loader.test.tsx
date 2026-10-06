import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { Campus3DLoader, decideCampus3DCapability } from "./campus-3d-loader";

const { useReducedMotionMock } = vi.hoisted(() => ({
  useReducedMotionMock: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  useReducedMotion: useReducedMotionMock,
}));

describe("Campus3DLoader", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", class {
      observe() {}
      disconnect() {}
    });
  });

  beforeEach(() => useReducedMotionMock.mockReturnValue(false));
  afterEach(() => cleanup());
  afterAll(() => vi.unstubAllGlobals());

  it("does not request the 3D chunk before the campus approaches the viewport", () => {
    const { container } = render(<Campus3DLoader />);

    expect(container.querySelector('[data-campus-3d-state="idle"]')).toBeTruthy();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders nothing when reduced motion is requested", () => {
    useReducedMotionMock.mockReturnValue(true);
    const { container } = render(<Campus3DLoader />);

    expect(container.firstChild).toBeNull();
  });

  it("uses adaptive quality instead of rejecting modest or unknown hardware", () => {
    expect(decideCampus3DCapability({
      deviceMemory: 2,
      hardwareConcurrency: 2,
      saveData: false,
      webgl: true,
    })).toMatchObject({ available: true, quality: "low" });

    expect(decideCampus3DCapability({
      saveData: false,
      webgl: true,
    })).toMatchObject({ available: true, quality: "standard" });
  });

  it("retains the fallback for explicit Data Saver or actual WebGL failure", () => {
    expect(decideCampus3DCapability({ saveData: true, webgl: true })).toMatchObject({
      available: false,
      reason: "data-saver",
    });
    expect(decideCampus3DCapability({ saveData: false, webgl: false })).toMatchObject({
      available: false,
      reason: "webgl-unavailable",
    });
  });
});
