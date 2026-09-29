import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, CalendarDays, ClipboardCheck, FileText, GraduationCap } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";

export type ParentAcademicMode = "homework" | "attendance" | "reports";
type Child = { id: string; name: string; profile: { registrationNumber: string | null } | null };
type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string; active?: boolean };

export function ParentAcademicSelector({ mode }: { mode: ParentAcademicMode }) {
  const navigate = useNavigate();
  const childrenQuery = useApiQuery<{ data: Child[] }>("/profile/my-children");
  const yearsQuery = useApiQuery<{ data: AcademicYear[] }>("/grades/academic-years");
  const children = childrenQuery.data?.data ?? [];
  const years = useMemo(() => [...(yearsQuery.data?.data ?? [])].sort((a, b) => Number(b.active ?? false) - Number(a.active ?? false) || b.startsOn.localeCompare(a.startsOn)), [yearsQuery.data]);
  const [childId, setChildId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const selectedChildId = childId || children[0]?.id || "";
  const selectedYearId = academicYearId || (years.find((year) => year.active)?.id ?? years[0]?.id)?.toString() || "";
  const isLoading = childrenQuery.isLoading || yearsQuery.isLoading;
  const isError = childrenQuery.isError || yearsQuery.isError;

  const openRecords = () => {
    if (!selectedChildId || !selectedYearId) return;
    const query = new URLSearchParams({ childId: selectedChildId, academicYearId: selectedYearId });
    navigate(`/parent/${mode}/view?${query.toString()}`);
  };

  const title = mode === "attendance" ? "Review attendance" : mode === "reports" ? "Generate report" : "Review homework";
  const description = mode === "attendance"
    ? "Choose a child and academic year before opening their attendance record."
    : mode === "reports"
      ? "Choose a child and academic year before opening their published academic report."
      : "Choose a child and academic year before opening their homework.";
  const Icon = mode === "attendance" ? ClipboardCheck : mode === "reports" ? BarChart3 : FileText;
  const openLabel = mode === "reports" ? "Open report" : `Open ${mode}`;

  return <PageContainer className="max-w-3xl">
    <PageHeader breadcrumb title={title} description={description} />
    {isLoading ? <div className="space-y-4 rounded-lg border p-6" aria-busy="true"><Skeleton className="h-6 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      : isError ? <ErrorState title="Unable to load family records" description="Check your connection and try again." onRetry={() => { childrenQuery.refetch(); yearsQuery.refetch(); }} />
      : children.length === 0 ? <EmptyState icon={GraduationCap} title="No children linked" description="Contact the school office to link a student to this parent account." />
      : years.length === 0 ? <EmptyState icon={CalendarDays} title="No academic years available" description="The school has not configured an academic year for these records yet." />
      : <section className="rounded-lg border bg-background p-5 sm:p-6">
        <SectionHeader title="Record context" description="The selected context scopes every record shown on the next page." />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">Child<Select value={selectedChildId} onValueChange={setChildId}><SelectTrigger aria-label="Select child"><SelectValue placeholder="Choose a child" /></SelectTrigger><SelectContent>{children.map((child) => <SelectItem key={child.id} value={child.id}>{child.name}{child.profile?.registrationNumber ? ` · ${child.profile.registrationNumber}` : ""}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-2 text-sm font-medium">Academic year<Select value={selectedYearId} onValueChange={setAcademicYearId}><SelectTrigger aria-label="Select academic year"><SelectValue placeholder="Choose an academic year" /></SelectTrigger><SelectContent>{years.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " · Current" : ""}</SelectItem>)}</SelectContent></Select></label>
        </div>
        <div className="mt-6 flex items-center justify-between border-t pt-5"><p className="text-sm text-muted-foreground">Only records available to your parent account will be shown.</p><Button onClick={openRecords} disabled={!selectedChildId || !selectedYearId}><Icon className="mr-2 h-4 w-4" />{openLabel}</Button></div>
      </section>}
  </PageContainer>;
}
