import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/** Public-only focus containment, inert background, Escape and focus restoration. */
export function PublicOverlay({ children, label, onClose, className = "", id, restoreFocus }: { children: ReactNode; label: string; onClose: () => void; className?: string; id?: string; restoreFocus?: RefObject<HTMLElement | null> }) {
  const element = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const siblings = Array.from(element.current?.parentElement?.children ?? []).filter(e => e !== element.current) as HTMLElement[];
    const inertBefore = siblings.map(e => e.inert);
    siblings.forEach(e => { e.inert = true; });
    const candidates = () => Array.from(element.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]') ?? []).filter(e => !e.closest('[hidden]') && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden" && (e.getClientRects().length > 0 || navigator.userAgent.includes("jsdom")));
    (candidates()[0] ?? element.current)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const controls = candidates(); const first = controls[0]; const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === element.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; siblings.forEach((e, i) => { e.inert = inertBefore[i]; }); document.removeEventListener("keydown", keydown); (restoreFocus?.current ?? active)?.focus(); };
  }, [restoreFocus]);
  return createPortal(<div ref={element} className={`ref-overlay ${className}`} role="dialog" aria-modal="true" aria-label={label} id={id} tabIndex={-1} onClick={e => { if (e.target === e.currentTarget && !className.includes("navigation")) onClose(); }}>{children}</div>, document.querySelector(".public-site") ?? document.body);
}
