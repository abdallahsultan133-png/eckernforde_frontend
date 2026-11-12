import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Check, ChevronRight, GraduationCap, Loader2, School } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { stageLabel } from "@/components/layout/historical-portal-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query";
import { portalSchoolName } from "@/lib/school-brand";

type SchoolBand = "primary" | "secondary";
type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string };
type ClassOption = { id: number; name: string; subject: { id: number; name: string; code: string } | null };
type Selection = { stage: string; schoolBand: SchoolBand; classes: ClassOption[] };
type HistoryOption = { academicYear: AcademicYear; selections: Selection[] };

export default function TeacherAcademicHistory() {
  const [yearId, setYearId] = useState("");
  const [schoolBand, setSchoolBand] = useState<SchoolBand | "">("");
  const [stage, setStage] = useState("");
  const [opening, setOpening] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const optionsQuery = useApiQuery<{ data: HistoryOption[] }>("/portal-context/teacher-history/options", { staleTime: 0 });
  const years = optionsQuery.data?.data ?? [];
  const selectedYear = years.find((item) => String(item.academicYear.id) === yearId);
  const schoolBands = useMemo(() => [...new Set((selectedYear?.selections ?? []).map((item) => item.schoolBand))], [selectedYear]);
  const stages = useMemo(() => (selectedYear?.selections ?? []).filter((item) => item.schoolBand === schoolBand), [schoolBand, selectedYear]);

  const openPreviousPortal = async (selectedStage: string) => {
    setStage(selectedStage);
    if (!yearId || !schoolBand) return;
    setOpening(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/portal-context/teacher-history/open`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYearId: Number(yearId), schoolBand, stage: selectedStage }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Could not open the previous teaching year.");
      await queryClient.resetQueries({ predicate: (query) => query.queryKey[0] !== "/portal-context/teacher-history/options" });
      toast.success(`${payload.data.academicYear.name} teaching portal opened.`);
      navigate("/portal", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the previous teaching year.");
      setStage("");
    } finally {
      setOpening(false);
    }
  };

  if (optionsQuery.isLoading) return <PageContainer className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-72 w-full" /></PageContainer>;
  if (optionsQuery.isError) return <PageContainer><ErrorState title="Unable to load previous teaching years" description="Please retry in a moment." onRetry={optionsQuery.refetch} /></PageContainer>;

  return <PageContainer className="max-w-5xl space-y-7">
    <PageHeader breadcrumb title="Open a previous teaching year" description="Choose the year, school, and form or class. Your dashboard and sidebar will then show that historical context." />
    {years.length === 0 ? <EmptyState icon={Archive} title="No previous teaching years" description="Completed academic years with classes assigned to you will appear here." /> : <>
      <Card>
        <CardHeader><CardTitle>1. Choose the academic year</CardTitle><CardDescription>Only completed years that contain your classes are listed.</CardDescription></CardHeader>
        <CardContent><Select value={yearId} onValueChange={(value) => { setYearId(value); setSchoolBand(""); setStage(""); }}><SelectTrigger className="w-full sm:max-w-md"><SelectValue placeholder="Select academic year" /></SelectTrigger><SelectContent>{years.map((item) => <SelectItem key={item.academicYear.id} value={String(item.academicYear.id)}>{item.academicYear.name} · {item.academicYear.startsOn} to {item.academicYear.endsOn}</SelectItem>)}</SelectContent></Select></CardContent>
      </Card>

      {selectedYear && <Card>
        <CardHeader><CardTitle>2. Choose the school</CardTitle><CardDescription>The available schools come from your assigned classes in {selectedYear.academicYear.name}.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">{schoolBands.map((band) => <button key={band} type="button" aria-pressed={schoolBand === band} onClick={() => { setSchoolBand(band); setStage(""); }} className={`flex min-h-24 items-center gap-3 rounded-md border p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${schoolBand === band ? "border-primary bg-primary/5" : ""}`}><span className="grid h-11 w-11 place-items-center rounded-md bg-muted"><School className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{portalSchoolName(band)}</strong><span className="mt-1 block text-xs text-muted-foreground">{band === "primary" ? "Primary classes" : "Secondary forms"}</span></span>{schoolBand === band ? <Check className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}</button>)}</CardContent>
      </Card>}

      {schoolBand && <Card>
        <CardHeader><CardTitle>3. Choose the form or class</CardTitle><CardDescription>Selecting it will open the complete previous-year portal in read-only mode.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{stages.map((item) => <button key={item.stage} type="button" disabled={opening} onClick={() => void openPreviousPortal(item.stage)} className={`flex min-h-20 items-center gap-3 rounded-md border p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60 ${stage === item.stage ? "border-primary bg-primary/5" : ""}`}><GraduationCap className="h-5 w-5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><strong className="block text-sm">{stageLabel(item.stage)}</strong><span className="mt-1 block text-xs text-muted-foreground">{item.classes.length} class{item.classes.length === 1 ? "" : "es"} · {item.classes.map((entry) => entry.subject?.name ?? entry.name).join(", ")}</span></span>{opening && stage === item.stage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}</button>)}</CardContent>
      </Card>}
    </>}
  </PageContainer>;
}
