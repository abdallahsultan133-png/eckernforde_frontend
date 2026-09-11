import { Link } from "react-router";
import { UsersRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { SectionCard } from "./section-card.tsx";

type Student = { id: string; name: string; email: string; image: string | null };

const getInitials = (name = "") =>
  name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

export function StudentsTab({ classId, canManage }: { classId: number; canManage: boolean }) {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Student[] }>(
    `/classes/${classId}/students`,
  );
  const students = data?.data ?? [];

  const manageButton = canManage ? (
    <Button asChild variant="outline" size="sm">
      <Link to={`/classes/${classId}/enroll`}>
        <UsersRound className="mr-1.5 h-4 w-4" />
        Manage students
      </Link>
    </Button>
  ) : undefined;

  return (
    <SectionCard title="Enrolled students" count={isLoading || isError ? undefined : students.length} action={manageButton} flush>
      {isLoading ? (
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-5">
          <ErrorState
            title="Roster unavailable"
            description="You don't have access to this class's student list."
            onRetry={refetch}
          />
        </div>
      ) : students.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={UsersRound}
            title="No students enrolled yet"
            description={
              canManage
                ? "Add students from the directory or import a CSV."
                : "Once students join, they'll appear here."
            }
            action={canManage ? { label: "Manage students", to: `/classes/${classId}/enroll` } : undefined}
          />
        </div>
      ) : (
        <ul className="divide-y">
          {students.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar className="h-9 w-9">
                {s.image && <AvatarImage src={s.image} alt={s.name} />}
                <AvatarFallback>{getInitials(s.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Link to={`/students/${s.id}`} className="text-sm font-medium hover:underline">
                  {s.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{s.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

StudentsTab.displayName = "StudentsTab";
