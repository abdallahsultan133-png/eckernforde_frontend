import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, ChevronRight, ListChecks, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export interface ActionQueueItem {
  id: string | number;
  /** Leading icon in the row's chip. Falls back to the card's list icon. */
  icon?: LucideIcon;
  title: ReactNode;
  /** Secondary line — class name, due date, who it's from. */
  meta?: ReactNode;
  /** Makes the whole row a link. */
  href?: string;
  /** Right-aligned status pill. */
  badge?: { label: string; tone?: StatusTone };
  /** Right-aligned custom node (rendered instead of `badge` when both given). */
  trailing?: ReactNode;
}

interface ActionQueueProps {
  title: string;
  items: ActionQueueItem[];
  icon?: LucideIcon;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Empty-state copy — this is what the user sees when there's nothing to act on. */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  /** "See all N" link in the footer. */
  viewAll?: { label: string; href: string };
  /** Cap the rows shown; the rest are reachable via `viewAll`. */
  maxItems?: number;
  className?: string;
}

/**
 * A prioritised list of things the signed-in user needs to act on — grading to
 * do, assignments due, students at risk. Deliberately NOT a grid of cards: the
 * point is a scannable queue that answers "what should I do next?". Pair several
 * of these, fed by role-scoped endpoints, to make each dashboard genuinely
 * different rather than the same layout with different numbers.
 */
export function ActionQueue({
  title,
  items,
  icon: ListIcon = ListChecks,
  isLoading = false,
  isError = false,
  onRetry,
  emptyTitle = "Nothing needs your attention",
  emptyDescription = "You're all caught up here.",
  emptyIcon,
  viewAll,
  maxItems,
  className,
}: ActionQueueProps) {
  const shown = typeof maxItems === "number" ? items.slice(0, maxItems) : items;
  const overflow = items.length - shown.length;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListIcon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        {!isLoading && !isError && items.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {items.length}
          </span>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        {isLoading ? (
          <ul className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </li>
            ))}
          </ul>
        ) : isError ? (
          <ErrorState
            description={`Unable to load ${title.toLowerCase()}.`}
            onRetry={onRetry}
          />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={emptyIcon ?? ListIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <ul className="-my-1 divide-y divide-border/60">
            {shown.map((item) => {
              const RowIcon = item.icon ?? ListIcon;
              const inner = (
                <>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <RowIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    {item.meta && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.meta}
                      </span>
                    )}
                  </span>
                  {item.trailing ??
                    (item.badge && (
                      <StatusBadge tone={item.badge.tone}>
                        {item.badge.label}
                      </StatusBadge>
                    ))}
                  {item.href && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </>
              );

              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-0 py-2.5">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {viewAll && !isLoading && !isError && items.length > 0 && (
        <div className="border-t px-6 py-3">
          <Link
            to={viewAll.href}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {overflow > 0 ? `${viewAll.label} (${overflow} more)` : viewAll.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </Card>
  );
}

ActionQueue.displayName = "ActionQueue";
