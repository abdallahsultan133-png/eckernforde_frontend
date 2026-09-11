import { Link } from "react-router";
import { FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { DeadlineCountdown } from "@/components/deadline-countdown.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { SectionCard } from "./section-card.tsx";

type AssignmentRow = {
  id: number;
  title: string;
  dueAt: string | null;
  maxScore: number;
  createdAt: string;
  creator: { id: string; name: string };
};

export function AssignmentsTab({ classId, canManage }: { classId: number; canManage: boolean }) {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AssignmentRow[] }>(
    `/assignments?classId=${classId}`,
  );
  const assignments = (data?.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const createHref = `/assignments/create?classId=${classId}`;
  const createButton = canManage ? (
    <Button asChild size="sm">
      <Link to={createHref}>
        <Plus className="mr-1.5 h-4 w-4" />
        New assignment
      </Link>
    </Button>
  ) : undefined;

  return (
    <SectionCard
      title="Assignments"
      count={isLoading || isError ? undefined : assignments.length}
      action={createButton}
      flush
    >
      {isLoading ? (
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-5">
          <ErrorState description="Couldn't load this class's assignments." onRetry={refetch} />
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={FileText}
            title="No assignments yet"
            description={
              canManage
                ? "Set the first assignment for this class to start tracking submissions."
                : "Your teacher hasn't posted any assignments for this class yet."
            }
            action={canManage ? { label: "Create assignment", to: createHref } : undefined}
          />
        </div>
      ) : (
        <ul className="divide-y">
          {assignments.map((a) => (
            <li key={a.id}>
              <Link
                to={`/assignments/${a.id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{a.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.maxScore} pts · by {a.creator.name}
                  </span>
                </span>
                <DeadlineCountdown dueAt={a.dueAt} variant="inline" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

AssignmentsTab.displayName = "AssignmentsTab";
