const WIDGET_SRC = "https://upload-widget.cloudinary.com/latest/global/all.js";

let loading: Promise<void> | undefined;

/** Load Cloudinary's browser widget only on authenticated screens that need it. */
export function loadCloudinaryWidget(): Promise<void> {
  if (typeof window === "undefined" || window.cloudinary) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);
    const script = existing ?? document.createElement("script");
    const done = () => window.cloudinary ? resolve() : reject(new Error("Cloudinary widget did not initialise"));
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", () => reject(new Error("Unable to load upload service")), { once: true });
    if (!existing) {
      script.src = WIDGET_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    loading = undefined;
    throw error;
  });

  return loading!;
}
