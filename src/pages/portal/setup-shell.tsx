import { useLogout } from "@refinedev/core";
import { LogOut, School } from "lucide-react";
import type { PropsWithChildren } from "react";

import { Button } from "@/components/ui/button";

/** Authentication is required, but onboarding remains outside the portal UI. */
export function PortalSetupShell({ children }: PropsWithChildren) {
  const { mutate: logout, isPending } = useLogout();

  return <div className="min-h-dvh bg-background">
    <header className="border-b bg-card">
      <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5 font-semibold"><School className="h-5 w-5 text-primary" aria-hidden="true" /><span>Academix</span><span className="hidden border-l pl-2.5 text-sm font-normal text-muted-foreground sm:inline">School portal setup</span></div>
        <Button type="button" variant="ghost" size="sm" onClick={() => logout()} disabled={isPending}><LogOut className="mr-1.5 h-4 w-4" aria-hidden="true" />Log out</Button>
      </div>
    </header>
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
  </div>;
}
