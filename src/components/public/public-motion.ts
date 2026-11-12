import { useSyncExternalStore } from "react";

export type PublicMotionPreference = "system" | "full" | "reduced";
const preferenceKey = "academix.public.motion";
const preferenceEvent = "academix:public-motion-change";

function getPreference(): PublicMotionPreference {
  try {
    const value = localStorage.getItem(preferenceKey);
    return value === "full" || value === "reduced" ? value : "system";
  } catch { return "system"; }
}

/** An explicit choice for this public website, independent of portal settings. */
export function setPublicMotionPreference(value: PublicMotionPreference) {
  try {
    if (value === "system") localStorage.removeItem(preferenceKey);
    else localStorage.setItem(preferenceKey, value);
  } catch { return; }
  window.dispatchEvent(new Event(preferenceEvent));
}

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  query?.addEventListener("change", onChange);
  const storageChanged = (event: StorageEvent) => { if (!event.key || event.key === preferenceKey) onChange(); };
  window.addEventListener("storage", storageChanged);
  window.addEventListener(preferenceEvent, onChange);
  return () => {
    query?.removeEventListener("change", onChange);
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener(preferenceEvent, onChange);
  };
}

/** Respect the system by default; an explicit public-site choice takes precedence. */
export function usePublicReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, () => {
    const preference = getPreference();
    return preference === "reduced" || (preference === "system" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false));
  }, () => false);
}
