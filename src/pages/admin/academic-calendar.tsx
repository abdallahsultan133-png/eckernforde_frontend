import { useState, type FormEvent } from "react";
import { useGetIdentity } from "@refinedev/core";
import { CalendarPlus, Loader2, Plus, Trash2 } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { UserRole, type User } from "@/types";

type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string; active: boolean };
type AcademicTerm = { id: number; name: string; type: "midterm" | "terminal"; startsOn: string; endsOn: string; academicYearId: number; academicYear: { name: string } };

const schoolToday = () => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Dar_es_Salaam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};
const suggestedYear = () => {
  const calendarYear = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Africa/Dar_es_Salaam" }).format(new Date()));
  const nextYear = calendarYear + 1;
  return { name: `${nextYear}/${String(nextYear + 1).slice(-2)}`, startsOn: `${nextYear}-01-01`, endsOn: `${nextYear}-12-31`, active: true };
};
async function post(path: string, body: unknown) {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Request failed.");
  return response.json();
}

export default function AcademicCalendarAdmin() {
  const { data: identity } = useGetIdentity<User>();
  const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;
  const yearsQuery = useApiQuery<{ data: AcademicYear[] }>("/grades/academic-years");
  const termsQuery = useApiQuery<{ data: AcademicTerm[] }>("/grades/academic-terms");
  const years = yearsQuery.data?.data ?? [];
  const terms = termsQuery.data?.data ?? [];
  const [year, setYear] = useState(suggestedYear);
  const [term, setTerm] = useState({ academicYearId: "", name: "", type: "midterm" as "midterm" | "terminal", startsOn: schoolToday(), endsOn: schoolToday() });
  const [savingYear, setSavingYear] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);
  const [activatingYearId, setActivatingYearId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null);
  const [deletingYear, setDeletingYear] = useState(false);

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
  const deleteYear = async () => {
    if (!deleteTarget) return;
    setDeletingYear(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/grades/academic-years/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not delete academic year.");
      toast.success(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      if (term.academicYearId === String(deleteTarget.id)) setTerm((current) => ({ ...current, academicYearId: "" }));
      await Promise.all([yearsQuery.refetch(), termsQuery.refetch()]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete academic year."); }
    finally { setDeletingYear(false); }
  };

  return <PageContainer>
    <PageHeader breadcrumb showBackLink={false} title="Academic calendar" description="Manage the academic years and Midterm/Terminal periods used by formal results." />
    <section className="flex flex-col gap-4 border-y bg-muted/20 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">One academic year can be active at a time. Assessment periods must belong to a configured year.</p>
      <div className="grid shrink-0 grid-cols-3 divide-x rounded-lg border bg-background text-center"><div className="px-4 py-2"><p className="font-semibold tabular-nums">{years.length}</p><p className="text-xs text-muted-foreground">Years</p></div><div className="px-4 py-2"><p className="font-semibold tabular-nums">{terms.length}</p><p className="text-xs text-muted-foreground">Periods</p></div><div className="px-4 py-2"><p className="font-semibold tabular-nums">{terms.filter((item) => item.startsOn <= schoolToday() && item.endsOn >= schoolToday()).length}</p><p className="text-xs text-muted-foreground">Current</p></div></div>
    </section>
    <section className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4 sm:p-5" aria-labelledby="create-year-steps-title">
      <h2 id="create-year-steps-title" className="text-sm font-semibold">Steps to create another academic year</h2>
      <ol className="mt-3 grid gap-3 text-sm leading-5 text-muted-foreground sm:grid-cols-2">
        <li className="flex gap-2"><span className="font-semibold text-primary">1.</span><span><strong className="text-foreground">Enter the year label.</strong> Use a label such as 2027/28.</span></li>
        <li className="flex gap-2"><span className="font-semibold text-primary">2.</span><span><strong className="text-foreground">Set the dates.</strong> Choose the start and end dates for the school year.</span></li>
        <li className="flex gap-2"><span className="font-semibold text-primary">3.</span><span><strong className="text-foreground">Choose rollover.</strong> Keep automatic rollover enabled if the year should become active on its start date.</span></li>
        <li className="flex gap-2"><span className="font-semibold text-primary">4.</span><span><strong className="text-foreground">Create the periods.</strong> Add Midterm and Terminal assessment windows for the new year.</span></li>
      </ol>
    </section>
    {yearsQuery.isError || termsQuery.isError ? <ErrorState title="Unable to load the academic calendar" description="Try again shortly." onRetry={() => { yearsQuery.refetch(); termsQuery.refetch(); }} /> : <>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border bg-background p-5 sm:p-6"><SectionHeader title="Create academic year" description="Prepare a year in advance; it becomes current automatically when its start date arrives." /><form className="mt-5 grid gap-4" onSubmit={submitYear}><label className="space-y-1.5 text-sm font-medium">Year label<Input required placeholder="2027/28" value={year.name} onChange={(event) => setYear({ ...year, name: event.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Starts on<Input required type="date" value={year.startsOn} onChange={(event) => setYear({ ...year, startsOn: event.target.value })} /></label><label className="space-y-1.5 text-sm font-medium">Ends on<Input required type="date" value={year.endsOn} onChange={(event) => setYear({ ...year, endsOn: event.target.value })} /></label></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={year.active} onChange={(event) => setYear({ ...year, active: event.target.checked })} /> Schedule automatic rollover</label><div><Button type="submit" disabled={savingYear}>{savingYear ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Create year</Button></div></form></section>
        <section className="rounded-lg border bg-background p-5 sm:p-6"><SectionHeader title="Create assessment period" description="Define a Midterm or Terminal window used for formal subject results." /><form className="mt-5 grid gap-4" onSubmit={submitTerm}><label className="space-y-1.5 text-sm font-medium">Academic year<Select value={term.academicYearId} onValueChange={(academicYearId) => setTerm({ ...term, academicYearId })}><SelectTrigger><SelectValue placeholder="Choose academic year" /></SelectTrigger><SelectContent>{years.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Term name<Input required placeholder="Term 1" value={term.name} onChange={(event) => setTerm({ ...term, name: event.target.value })} /></label><label className="space-y-1.5 text-sm font-medium">Assessment type<Select value={term.type} onValueChange={(type: "midterm" | "terminal") => setTerm({ ...term, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="midterm">Midterm</SelectItem><SelectItem value="terminal">Terminal</SelectItem></SelectContent></Select></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Starts on<Input required type="date" value={term.startsOn} onChange={(event) => setTerm({ ...term, startsOn: event.target.value })} /></label><label className="space-y-1.5 text-sm font-medium">Ends on<Input required type="date" value={term.endsOn} onChange={(event) => setTerm({ ...term, endsOn: event.target.value })} /></label></div><div><Button type="submit" disabled={savingTerm || years.length === 0}>{savingTerm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}Create period</Button></div></form></section>
      </div>
      {yearsQuery.isLoading ? <Skeleton className="h-40 w-full" /> : <section><SectionHeader title="Academic years" /><div className="mt-3 overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Year</TableHead><TableHead>Dates</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{years.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No academic years configured.</TableCell></TableRow> : years.map((item) => { const inRange = item.startsOn <= schoolToday() && item.endsOn >= schoolToday(); return <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="whitespace-nowrap tabular-nums">{item.startsOn} – {item.endsOn}</TableCell><TableCell><StatusBadge tone={item.active ? "success" : "neutral"}>{item.active ? "Active" : "Inactive"}</StatusBadge></TableCell><TableCell><div className="flex justify-end gap-2">{!item.active && <Button size="sm" variant="outline" disabled={!inRange || activatingYearId !== null} onClick={() => activateYear(item.id)}>{activatingYearId === item.id ? "Activating…" : inRange ? "Activate" : "Outside date range"}</Button>}{isSuperAdmin && <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={item.active || deletingYear} title={item.active ? "Activate another academic year before deleting this one" : `Delete ${item.name}`} onClick={() => setDeleteTarget(item)}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>}</div></TableCell></TableRow>; })}</TableBody></Table></div></section>}
      {termsQuery.isLoading ? <Skeleton className="h-56 w-full" /> : <section><SectionHeader title="Configured assessment periods" description="Review assessment dates before staff enter formal subject results." /><div className="mt-3 overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Academic year</TableHead><TableHead>Term</TableHead><TableHead>Type</TableHead><TableHead>Dates</TableHead></TableRow></TableHeader><TableBody>{terms.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No assessment periods configured.</TableCell></TableRow> : terms.map((item) => <TableRow key={item.id}><TableCell>{item.academicYear.name}</TableCell><TableCell className="font-medium">{item.name}</TableCell><TableCell><StatusBadge tone="neutral">{item.type === "terminal" ? "Terminal" : "Midterm"}</StatusBadge></TableCell><TableCell className="text-muted-foreground">{item.startsOn} – {item.endsOn}</TableCell></TableRow>)}</TableBody></Table></div></section>}
    </>}
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deletingYear) setDeleteTarget(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete academic year?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget?.name} will be permanently removed. A year containing classes, assessment periods, or portal history cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingYear}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={deletingYear} onClick={(event) => { event.preventDefault(); void deleteYear(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deletingYear ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : "Delete year"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </PageContainer>;
}
