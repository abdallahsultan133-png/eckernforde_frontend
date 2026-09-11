"use client";

import { Header } from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { cn } from "@/lib/utils.ts";
import type { CSSProperties, PropsWithChildren } from "react";
import { useLocation } from "react-router";
import { Sidebar } from "./sidebar.tsx";

// Desktop starts expanded, but a user's explicit collapse/expand choice is
// persisted by the shadcn SidebarProvider in the `sidebar_state` cookie — honour
// it on reload instead of always snapping back to expanded.
function getDefaultSidebarOpen() {
  if (typeof document === "undefined") return true;
  const match = document.cookie.match(/(?:^|;\s*)sidebar_state=([^;]+)/);
  return match ? match[1] === "true" : true;
}

export function Layout({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  return (
      <SidebarProvider
        defaultOpen={getDefaultSidebarOpen()}
        style={{ "--sidebar-width-icon": "3.25rem" } as CSSProperties}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <Sidebar />
        {/* SidebarInset renders the page's single <main> landmark; the skip
            link targets it and it takes programmatic focus once. */}
        <SidebarInset id="main-content" tabIndex={-1} className="outline-none">
          <div className="print:hidden">
            <Header />
          </div>

          <div
              className={cn(
                  "@container/main",
                  "container",
                  "mx-auto",
                  "relative",
                  "w-full",
                  "flex",
                  "flex-col",
                  "flex-1",
                  "px-2",
                  "pt-4",
                  "md:p-4",
                  "lg:px-6",
                  "lg:pt-6",
                  "print:p-0"
              )}
          >
            {/* Re-keyed on the route so every navigation replays the entrance
                fade — replaces the old hardcoded per-page class list in App.css. */}
            <div key={pathname} className="animate-page min-w-0">
              {children}
            </div>
          </div>

        </SidebarInset>
      </SidebarProvider>
  );
}
Layout.displayName = "Layout";
