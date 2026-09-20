import { useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { BookOpen, Check, ChevronRight, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User } from "@/types";

type Stage = "nursery" | "kindergarten" | "standard_i" | "standard_ii" | "standard_iii" | "standard_iv" | "standard_v" | "standard_vi" | "standard_vii" | "form_i" | "form_ii" | "form_iii" | "form_iv";
type SchoolBand = "primary" | "secondary";
type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string };
type ContextData = {
  setupRequired: boolean;
  configurationRequired?: boolean;
  academicYear: AcademicYear | null;
  academicYears?: AcademicYear[];
  stages: Stage[];
};

const stageLabels: Record<Stage, string> = {
  nursery: "Nursery", kindergarten: "Kindergarten",
  standard_i: "Standard I", standard_ii: "Standard II", standard_iii: "Standard III",
  standard_iv: "Standard IV", standard_v: "Standard V", standard_vi: "Standard VI", standard_vii: "Standard VII",
  form_i: "Form I", form_ii: "Form II", form_iii: "Form III", form_iv: "Form IV",
};
const primaryStages: Stage[] = ["nursery", "kindergarten", "standard_i", "standard_ii", "standard_iii", "standard_iv", "standard_v", "standard_vi", "standard_vii"];
const secondaryStages: Stage[] = ["form_i", "form_ii", "form_iii", "form_iv"];

export default function PortalSetup() {
  const { data: identity, isLoading: identityLoading } = useGetIdentity<User>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { data, isLoading, isFetching, isError, refetch } = useApiQuery<{ data: ContextData }>("/portal-context", { staleTime: 0, refetchOnMount: "always" });
  const [band, setBand] = useState<SchoolBand | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [yearId, setYearId] = useState("");
  const [saving, setSaving] = useState(false);

  const context = data?.data;
  const isEligible = identity?.role === UserRole.STUDENT || identity?.role === UserRole.TEACHER;
  const changing = searchParams.get("change") === "1";

  if (identityLoading || isLoading || isFetching) {
    return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (isError) return <ErrorState title="Unable to prepare your portal" description="Please retry in a moment." onRetry={refetch} />;
  if (!isEligible || (context && !context.setupRequired && !changing)) return <Navigate to="/portal" replace />;
  if (!context?.academicYear || context.configurationRequired) {
    return <EmptyState icon={GraduationCap} title="Academic year setup is needed" description="An administrator needs to configure the current academic year before the portal can be opened." />;
  }

  const academicYear = context.academicYear;
  const academicYears = context.academicYears?.length ? context.academicYears : [academicYear];
  const visibleStages = band === "primary" ? primaryStages : secondaryStages;
  const restrictToEnrolledStages = identity?.role === UserRole.STUDENT && context.stages.length > 0;

  const save = async () => {
    if (!band || !stage || yearId !== String(academicYear.id)) return;
    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/portal-context`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYearId: academicYear.id, schoolBand: band, stage }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? "Could not save your selection.");

      queryClient.setQueryData<{ data: ContextData & { context?: unknown } }>(["/portal-context"], (previous) =>
        previous ? { data: { ...previous.data, setupRequired: false, context: json.data } } : previous,
      );
      await queryClient.invalidateQueries();
      toast.success("Portal context saved.");
      navigate("/portal", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your selection.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="mx-auto max-w-3xl space-y-6">
    <PageHeader breadcrumb title="Set up your portal" description="Choose your school level, form or class, and academic year." />
    <Card>
      <CardHeader>
        <CardTitle>{identity?.role === UserRole.TEACHER ? "Where are you teaching?" : "Where are you studying?"}</CardTitle>
        <CardDescription>Your portal will show information for this context only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["primary", "secondary"] as const).map((item) => <button
            key={item}
            type="button"
            aria-pressed={band === item}
            onClick={() => { setBand(item); setStage(null); setYearId(""); }}
            className={`flex min-h-28 items-start gap-3 border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${band === item ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-primary" aria-hidden="true">{item === "primary" ? <BookOpen className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}</span>
            <span><span className="block font-semibold capitalize">{item} school</span><span className="mt-1 block text-xs text-muted-foreground">{item === "primary" ? "Nursery, Kindergarten and Standard I–VII" : "Form I–IV"}</span></span>
            {band === item && <Check className="ml-auto h-4 w-4 text-primary" aria-hidden="true" />}
          </button>)}
        </div>

        {band && <div className="space-y-3 border-t pt-5">
          <div><h2 className="text-sm font-semibold">Select your {band === "primary" ? "class" : "form"}</h2><p className="mt-1 text-xs text-muted-foreground">Choose your school stage. Class records will appear after the school assigns you to classes.</p></div>
          {restrictToEnrolledStages ? <p role="status" className="border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">Choose the class or form assigned to you. Other stages are unavailable.</p> : visibleStages.every((item) => !context.stages.includes(item)) && <p role="status" className="border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">No class records are assigned yet. You can still open your portal after choosing your stage and year.</p>}
          <div className="grid gap-2 sm:grid-cols-3">{visibleStages.map((item) => {
            const unavailable = restrictToEnrolledStages && !context.stages.includes(item);
            return <button
              key={item}
              type="button"
              aria-pressed={stage === item}
              disabled={unavailable}
              onClick={() => setStage(item)}
              className={`flex min-h-12 items-center justify-between gap-2 border px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 ${stage === item ? "border-primary bg-primary/5" : ""}`}
            >
              <span>{stageLabels[item]}</span>
              {stage === item ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
            </button>;
          })}</div>
        </div>}

        {stage && <div className="max-w-sm space-y-2 border-t pt-5">
          <label htmlFor="portal-academic-year" className="text-sm font-semibold">Academic year</label>
          <Select value={yearId} onValueChange={setYearId}>
            <SelectTrigger id="portal-academic-year" className="w-full"><SelectValue placeholder="Choose academic year" /></SelectTrigger>
            <SelectContent>{academicYears.map((year) => <SelectItem key={year.id} value={String(year.id)} disabled={year.id !== academicYear.id}>{year.name} · {year.startsOn} to {year.endsOn}{year.id !== academicYear.id ? " · Previous" : " · Current"}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Only the current school year can be selected here. Previous years remain in academic history.</p>
        </div>}

        <div className="flex justify-end border-t pt-5"><Button onClick={save} disabled={!yearId || !band || !stage || saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Open portal</Button></div>
      </CardContent>
    </Card>
  </div>;
}
