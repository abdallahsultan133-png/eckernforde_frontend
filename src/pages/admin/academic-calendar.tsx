import { useState, type FormEvent } from "react";
import { CalendarPlus, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_BASE_URL } from "@/constants";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";

type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string; active: boolean };
type AcademicTerm = { id: number; name: string; type: "midterm" | "terminal"; startsOn: string; endsOn: string; academicYearId: number; academicYear: { name: string } };

const schoolToday = () => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Dar_es_Salaam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};
const suggestedYear = () => {
  const calendarYear = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Africa/Dar_es_Salaam" }).format(new Date()));
  return { name: String(calendarYear), startsOn: `${calendarYear}-01-01`, endsOn: `${calendarYear}-12-31`, active: true };
};
async function post(path: string, body: unknown) {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Request failed.");
  return response.json();
}

export default function AcademicCalendarAdmin() {
  const yearsQuery = useApiQuery<{ data: AcademicYear[] }>("/grades/academic-years");
  const termsQuery = useApiQuery<{ data: AcademicTerm[] }>("/grades/academic-terms");
  const years = yearsQuery.data?.data ?? [];
  const terms = termsQuery.data?.data ?? [];
  const [year, setYear] = useState(suggestedYear);
  const [term, setTerm] = useState({ academicYearId: "", name: "", type: "midterm" as "midterm" | "terminal", startsOn: schoolToday(), endsOn: schoolToday() });
  const [savingYear, setSavingYear] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);
  const [activatingYearId, setActivatingYearId] = useState<number | null>(null);

  const submitYear = async (event: FormEvent) => {
    event.preventDefault(); setSavingYear(true);
    try { await post("/grades/academic-years", year); toast.success("Academic year created."); setYear(suggestedYear()); await yearsQuery.refetch(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not create academic year."); }
    finally { setSavingYear(false); }
  };
  const submitTerm = async (event: FormEvent) => {
    event.preventDefault();
    if (!term.academicYearId) return toast.error("Choose an academic year.");
    setSavingTerm(true);
    try { await post("/grades/academic-terms", { ...term, academicYearId: Number(term.academicYearId) }); toast.success("Assessment period created."); setTerm({ academicYearId: "", name: "", type: "midterm", startsOn: schoolToday(), endsOn: schoolToday() }); await termsQuery.refetch(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not create assessment period."); }
    finally { setSavingTerm(false); }
  };
  const activateYear = async (id: number) => {
    setActivatingYearId(id);
    try { const response = await fetch(`${BACKEND_BASE_URL}/grades/academic-years/${id}/activate`, { method: "PATCH", credentials: "include" }); if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not activate academic year."); toast.success("Academic year activated."); await yearsQuery.refetch(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not activate academic year."); }
    finally { setActivatingYearId(null); }
  };

  return <PageContainer>
    <PageHeader breadcrumb title="Academic calendar" description="Manage the academic years and Midterm/Terminal periods used by formal results." />
    <section className="flex flex-col gap-4 border-y bg-muted/20 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">One academic year can be active at a time. Assessment periods must belong to a configured year.</p>
      <div className="grid shrink-0 grid-cols-3 divide-x rounded-lg border bg-background text-center"><div className="px-4 py-2"><p className="font-semibold tabular-nums">{years.length}</p><p className="text-xs text-muted-foreground">Years</p></div><div className="px-4 py-2"><p className="font-semibold tabular-nums">{terms.length}</p><p className="text-xs text-muted-foreground">Periods</p></div><div className="px-4 py-2"><p className="font-semibold tabular-nums">{terms.filter((item) => item.startsOn <= schoolToday() && item.endsOn >= schoolToday()).length}</p><p className="text-xs text-muted-foreground">Current</p></div></div>
    </section>
    {yearsQuery.isError || termsQuery.isError ? <ErrorState title="Unable to load the academic calendar" description="Try again shortly." onRetry={() => { yearsQuery.refetch(); termsQuery.refetch(); }} /> : <>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border bg-background p-5 sm:p-6"><SectionHeader title="Create academic year" description="Academic years run from 1 January through 31 December." /><form className="mt-5 grid gap-4" onSubmit={submitYear}><label className="space-y-1.5 text-sm font-medium">Year label<Input required placeholder="2026" value={year.name} onChange={(event) => setYear({ ...year, name: event.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Starts on<Input required readOnly type="date" value={year.startsOn} /></label><label className="space-y-1.5 text-sm font-medium">Ends on<Input required readOnly type="date" value={year.endsOn} /></label></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={year.active} onChange={(event) => setYear({ ...year, active: event.target.checked })} /> Set as active academic year</label><div><Button type="submit" disabled={savingYear}>{savingYear ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Create year</Button></div></form></section>
        <section className="rounded-lg border bg-background p-5 sm:p-6"><SectionHeader title="Create assessment period" description="Define a Midterm or Terminal window used for formal subject results." /><form className="mt-5 grid gap-4" onSubmit={submitTerm}><label className="space-y-1.5 text-sm font-medium">Academic year<Select value={term.academicYearId} onValueChange={(academicYearId) => setTerm({ ...term, academicYearId })}><SelectTrigger><SelectValue placeholder="Choose academic year" /></SelectTrigger><SelectContent>{years.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Term name<Input required placeholder="Term 1" value={term.name} onChange={(event) => setTerm({ ...term, name: event.target.value })} /></label><label className="space-y-1.5 text-sm font-medium">Assessment type<Select value={term.type} onValueChange={(type: "midterm" | "terminal") => setTerm({ ...term, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="midterm">Midterm</SelectItem><SelectItem value="terminal">Terminal</SelectItem></SelectContent></Select></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Starts on<Input required type="date" value={term.startsOn} onChange={(event) => setTerm({ ...term, startsOn: event.target.value })} /></label><label className="space-y-1.5 text-sm font-medium">Ends on<Input required type="date" value={term.endsOn} onChange={(event) => setTerm({ ...term, endsOn: event.target.value })} /></label></div><div><Button type="submit" disabled={savingTerm || years.length === 0}>{savingTerm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}Create period</Button></div></form></section>
      </div>
      {yearsQuery.isLoading ? <Skeleton className="h-40 w-full" /> : <section><SectionHeader title="Academic years" /><div className="mt-3 overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Year</TableHead><TableHead>Dates</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{years.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No academic years configured.</TableCell></TableRow> : years.map((item) => { const inRange = item.startsOn <= schoolToday() && item.endsOn >= schoolToday(); return <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="whitespace-nowrap tabular-nums">{item.startsOn} – {item.endsOn}</TableCell><TableCell><StatusBadge tone={item.active ? "success" : "neutral"}>{item.active ? "Active" : "Inactive"}</StatusBadge></TableCell><TableCell className="text-right">{!item.active && <Button size="sm" variant="outline" disabled={!inRange || activatingYearId !== null} onClick={() => activateYear(item.id)}>{activatingYearId === item.id ? "Activating…" : inRange ? "Activate" : "Outside date range"}</Button>}</TableCell></TableRow>; })}</TableBody></Table></div></section>}
      {termsQuery.isLoading ? <Skeleton className="h-56 w-full" /> : <section><SectionHeader title="Configured assessment periods" description="Review assessment dates before staff enter formal subject results." /><div className="mt-3 overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Academic year</TableHead><TableHead>Term</TableHead><TableHead>Type</TableHead><TableHead>Dates</TableHead></TableRow></TableHeader><TableBody>{terms.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No assessment periods configured.</TableCell></TableRow> : terms.map((item) => <TableRow key={item.id}><TableCell>{item.academicYear.name}</TableCell><TableCell className="font-medium">{item.name}</TableCell><TableCell><StatusBadge tone="neutral">{item.type === "terminal" ? "Terminal" : "Midterm"}</StatusBadge></TableCell><TableCell className="text-muted-foreground">{item.startsOn} – {item.endsOn}</TableCell></TableRow>)}</TableBody></Table></div></section>}
    </>}
  </PageContainer>;
}
