import * as React from "react";
import { useRefineKbar } from "@refinedev/kbar";
import { useGetIdentity } from "@refinedev/core";
import {
    KBarPortal,
    KBarPositioner,
    KBarAnimator,
    KBarSearch,
    KBarResults,
    useMatches,
    type ActionId,
    type ActionImpl,
} from "kbar";
import { ArrowRight, ChevronRight, CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { APP_NAME } from "@/constants";
import { isStaff } from "@/lib/roles.ts";
import type { User } from "@/types";
import { CommandSearchActions } from "./command-search-actions.tsx";

/**
 * Fully custom-styled replacement for @refinedev/kbar's default <RefineKbar />.
 * Reuses its action-registration hook (resource list/create/edit/delete actions,
 * "go to" navigation, etc.) but replaces the default black-on-white, non-theme-aware
 * UI with one that matches this app's shadcn design tokens and dark mode.
 */
export function CommandPalette() {
    useRefineKbar();
    const { data: identity } = useGetIdentity<User>();
    const placeholder = isStaff(identity?.role)
        ? "Search classes, students, and pages…"
        : "Search classes and pages…";

    return (
        <>
        <CommandSearchActions />
        <KBarPortal>
            <KBarPositioner className="z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150">
                <KBarAnimator className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3 border-b border-border px-4">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <KBarSearch
                            defaultPlaceholder={placeholder}
                            className="h-14 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        />
                        <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
                            Esc
                        </kbd>
                    </div>

                    <RenderResults />

                    <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">&uarr;</kbd>
                                <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">&darr;</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="flex items-center rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">
                                    <CornerDownLeft className="h-2.5 w-2.5" />
                                </kbd>
                                Select
                            </span>
                        </div>
                        <span className="font-medium">{APP_NAME}</span>
                    </div>
                </KBarAnimator>
            </KBarPositioner>
        </KBarPortal>
        </>
    );
}

function RenderResults() {
    const { results, rootActionId } = useMatches();

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center gap-1.5 px-4 py-12 text-center">
                <Search className="h-5 w-5 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No results found.</p>
            </div>
        );
    }

    return (
        <KBarResults
            items={results}
            maxHeight={420}
            onRender={({ item, active }) =>
                typeof item === "string" ? (
                    <div className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                        {item}
                    </div>
                ) : (
                    <ResultItem action={item} active={active} currentRootActionId={rootActionId as ActionId} />
                )
            }
        />
    );
}

const ResultItem = React.forwardRef<
    HTMLDivElement,
    { action: ActionImpl; active: boolean; currentRootActionId: ActionId }
>(({ action, active, currentRootActionId }, ref) => {
    const ancestors = React.useMemo(() => {
        if (!currentRootActionId) return action.ancestors;
        const index = action.ancestors.findIndex((ancestor) => ancestor.id === currentRootActionId);
        return action.ancestors.slice(index + 1);
    }, [action.ancestors, currentRootActionId]);

    const isDestructive = action.name.toUpperCase() === "DELETE";

    return (
        <div
            ref={ref}
            className={cn(
                "mx-2 my-0.5 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-foreground"
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md [&>svg]:h-4 [&>svg]:w-4",
                        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}
                >
                    {action.icon ?? <ArrowRight />}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1 truncate">
                        {ancestors.length > 0 &&
                            ancestors.map((ancestor) => (
                                <span key={ancestor.id} className="flex shrink-0 items-center gap-1 text-muted-foreground">
                                    {ancestor.name}
                                    <ChevronRight className="h-3 w-3" />
                                </span>
                            ))}
                        <span className={cn("truncate font-medium", isDestructive && "text-destructive")}>
                            {action.name}
                        </span>
                    </div>
                    {action.subtitle && <div className="truncate text-xs text-muted-foreground">{action.subtitle}</div>}
                </div>
            </div>

            {action.shortcut?.length ? (
                <div className="flex shrink-0 items-center gap-1">
                    {action.shortcut.map((sc) => (
                        <kbd
                            key={sc}
                            className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground"
                        >
                            {sc}
                        </kbd>
                    ))}
                </div>
            ) : null}
        </div>
    );
});

ResultItem.displayName = "ResultItem";
