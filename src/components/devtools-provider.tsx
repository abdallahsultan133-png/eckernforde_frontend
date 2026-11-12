import type { ReactNode } from "react";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { useLocation } from "react-router";

/**
 * Development-only. App.tsx imports this lazily and only when
 * `import.meta.env.DEV` is true, so `@refinedev/devtools` is never pulled into
 * a production bundle and the panel never renders for real users.
 */
export default function Devtools({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isPublicPage =
    pathname === "/" ||
    /^\/(about|academics|admissions|school-life|news-events|community|contact|gallery)(\/|$)/.test(
      pathname
    );

  if (isPublicPage) return <>{children}</>;

  return (
    <DevtoolsProvider>
      {children}
      <DevtoolsPanel />
    </DevtoolsProvider>
  );
}
