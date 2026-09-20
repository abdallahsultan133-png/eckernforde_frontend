import { Link } from "react-router";
import { BookOpenCheck, CalendarClock, GraduationCap } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";

type HistoryRow = {
  id: number;
  schoolBand: "primary" | "secondary";
  stage: string;
  isCurrent: boolean;
  academicYear: { id: number; name: string; startsOn: string; endsOn: string };
  classes: Array<{ id: number; name: string; subject: { id: number; name: string } | null }>;
};

const stageLabel = (stage: string) => stage.split("_").map((part) => part === "i" || part === "ii" || part === "iii" || part === "iv" || part === "v" || part === "vi" || part === "vii" ? part.toUpperCase() : `${part[0]?.toUpperCase()}${part.slice(1)}`).join(" ");

export default function AcademicHistory() {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: HistoryRow[] }>("/portal-context/history");
  if (isLoading) return <PageContainer><Skeleton className="h-24 w-full" /><Skeleton className="h-36 w-full" /></PageContainer>;
  if (isError) return <PageContainer><ErrorState title="Unable to load academic history" description="Please retry in a moment." onRetry={refetch} /></PageContainer>;
  const previous = (data?.data ?? []).filter((row) => !row.isCurrent);
  return <PageContainer className="max-w-4xl">
    <PageHeader breadcrumb title="Change form or class" description="Choose a previous academic year to open its read-only portal. Your current class or form stays fixed for this year." />
    {!previous.length ? <EmptyState icon={CalendarClock} title="No previous academic years" description="Completed academic years will appear here after your school records results." /> : <div className="divide-y border">
      {previous.map((row) => <article key={row.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3"><GraduationCap className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" /><div><h2 className="font-semibold">{row.academicYear.name}</h2><p className="mt-1 text-sm text-muted-foreground">{stageLabel(row.stage)} · {row.schoolBand === "primary" ? "Primary school" : "Secondary school"}</p><p className="mt-1 text-xs text-muted-foreground">{row.academicYear.startsOn} to {row.academicYear.endsOn}</p>{row.classes.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{row.classes.map((item) => <span key={item.id} className="border px-2 py-1 text-xs text-muted-foreground">{item.name}{item.subject ? ` · ${item.subject.name}` : ""}</span>)}</div>}</div></div>
        <Link to={`/portal/history/${row.academicYear.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><BookOpenCheck className="h-4 w-4" /> Open previous year</Link>
      </article>)}
    </div>}
  </PageContainer>;
}
