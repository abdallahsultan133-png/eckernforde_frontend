import { type ComponentType, useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export type Campus3DQuality = "standard" | "low";

type Campus3DComponent = ComponentType<{
  onReady: () => void;
  onUnavailable: (reason: string) => void;
  quality: Campus3DQuality;
}>;
type LoadState = "idle" | "loading" | "ready" | "unavailable";

interface NavigatorWithCapabilities extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export interface Campus3DCapability {
  available: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  quality: Campus3DQuality;
  reason?: string;
  saveData: boolean;
  webgl: boolean;
}

interface Campus3DSignals {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  saveData: boolean;
  webgl: boolean;
}

function debugCampus3D(stage: string, details: Record<string, unknown> = {}) {
  if (import.meta.env.DEV) console.info(`[Campus3D] ${stage}`, details);
}

export function decideCampus3DCapability({
  deviceMemory,
  hardwareConcurrency,
  saveData,
  webgl,
}: Campus3DSignals): Campus3DCapability {
  const lowerCapability = (typeof deviceMemory === "number" && deviceMemory <= 4)
    || (typeof hardwareConcurrency === "number" && hardwareConcurrency <= 4);

  if (saveData) {
    return { available: false, deviceMemory, hardwareConcurrency, quality: "low", reason: "data-saver", saveData, webgl };
  }

  return {
    available: webgl,
    deviceMemory,
    hardwareConcurrency,
    quality: lowerCapability ? "low" : "standard",
    reason: webgl ? undefined : "webgl-unavailable",
    saveData,
    webgl,
  };
}

function inspectCampus3DCapability(): Campus3DCapability {
  const capabilities = navigator as NavigatorWithCapabilities;
  const saveData = capabilities.connection?.saveData === true;
  const deviceMemory = capabilities.deviceMemory;
  const hardwareConcurrency = capabilities.hardwareConcurrency;
  if (saveData) return decideCampus3DCapability({ deviceMemory, hardwareConcurrency, saveData, webgl: false });

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const webgl = Boolean(context);
    context?.getExtension("WEBGL_lose_context")?.loseContext();

    return decideCampus3DCapability({ deviceMemory, hardwareConcurrency, saveData, webgl });
  } catch (error) {
    debugCampus3D("capability check failed", { error });
    return { available: false, deviceMemory, hardwareConcurrency, quality: "low", reason: "webgl-check-failed", saveData, webgl: false };
  }
}

export function Campus3DLoader() {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [Experience, setExperience] = useState<Campus3DComponent | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [quality, setQuality] = useState<Campus3DQuality>("standard");
  const handleReady = useCallback(() => {
    debugCampus3D("first frame visible");
    setLoadState("ready");
  }, []);
  const handleUnavailable = useCallback((reason: string) => {
    debugCampus3D("static fallback retained", { reason });
    setLoadState("unavailable");
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) debugCampus3D("static fallback retained", { reason: "reduced-motion" });
  }, [shouldReduceMotion]);

  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!boundary || shouldReduceMotion) return;

    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        debugCampus3D("lazy boundary reached", { rootMargin: "400px 0px" });
        setIsNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(boundary);
    return () => observer.disconnect();
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!isNearViewport || shouldReduceMotion) return;

    const capability = inspectCampus3DCapability();
    debugCampus3D("capability result", capability as unknown as Record<string, unknown>);

    if (!capability.available) {
      setLoadState("unavailable");
      return;
    }

    let cancelled = false;
    setQuality(capability.quality);
    setLoadState("loading");
    debugCampus3D("dynamic import started", { quality: capability.quality });

    import("./campus-3d-experience")
      .then(({ Campus3DExperience }) => {
        if (!cancelled) {
          debugCampus3D("dynamic import completed");
          setExperience(() => Campus3DExperience);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          debugCampus3D("dynamic import failed", { error });
          setLoadState("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isNearViewport, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <div
      className={`campus-3d-loader${loadState === "ready" ? " is-ready" : ""}`}
      ref={boundaryRef}
      data-campus-3d-state={loadState}
      data-campus-3d-quality={quality}
    >
      {Experience ? (
        <Experience onReady={handleReady} onUnavailable={handleUnavailable} quality={quality} />
      ) : null}
      {loadState === "loading" ? (
        <span className="campus-3d-loader__status" role="status">Preparing campus view…</span>
      ) : null}
    </div>
  );
}
