import type { ReactNode } from "react";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";

/**
 * Development-only. App.tsx imports this lazily and only when
 * `import.meta.env.DEV` is true, so `@refinedev/devtools` is never pulled into
 * a production bundle and the panel never renders for real users.
 */
export default function Devtools({ children }: { children: ReactNode }) {
  return (
    <DevtoolsProvider>
      {children}
      <DevtoolsPanel />
    </DevtoolsProvider>
  );
}
