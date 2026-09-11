import { useState } from "react";
import { CalendarPlus, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_BASE_URL } from "@/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";

type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string; active: boolean };
type AcademicTerm = { id: number; name: string; type: "midterm" | "terminal"; startsOn: string; endsOn: string; academicYearId: number; academicYear: { name: string } };
const today = () => new Date().toISOString().slice(0, 10);

async function post(path: string, body: unknown) {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Request failed.");
  return response.json();
}

export default function AcademicCalendarAdmin() {
  const { data: yearsData, isLoading: yearsLoading, isError: yearsError, refetch: refetchYears } = useApiQuery<{ data: AcademicYear[] }>("/grades/academic-years");
  const { data: termsData, isLoading: termsLoading, isError: termsError, refetch: refetchTerms } = useApiQuery<{ data: AcademicTerm[] }>("/grades/academic-terms");
  const years = yearsData?.data ?? [];
  const terms = termsData?.data ?? [];
  const [year, setYear] = useState({ name: "", startsOn: today(), endsOn: today(), active: true });
  const [term, setTerm] = useState({ academicYearId: "", name: "", type: "midterm", startsOn: today(), endsOn: today() });
  const [savingYear, setSavingYear] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);
  const submitYear = async (event: React.FormEvent) => { event.preventDefault(); setSavingYear(true); try { await post("/grades/academic-years", year); toast.success("Academic year created."); setYear({ name: "", startsOn: today(), endsOn: today(), active: true }); await refetchYears(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create academic year."); } finally { setSavingYear(false); } };
  const submitTerm = async (event: React.FormEvent) => { event.preventDefault(); if (!term.academicYearId) return toast.error("Choose an academic year."); setSavingTerm(true); try { await post("/grades/academic-terms", { ...term, academicYearId: Number(term.academicYearId) }); toast.success("Academic term created."); setTerm({ academicYearId: "", name: "", type: "midterm", startsOn: today(), endsOn: today() }); await refetchTerms(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create academic term."); } finally { setSavingTerm(false); } };
  const loading = yearsLoading || termsLoading;
  const error = yearsError || termsError;
  return <div className="space-y-6"><PageHeader breadcrumb title="Academic Calendar Setup" description="Create the controlled academic-year and Midterm/Terminal structure used by formal results." />
    {error ? <ErrorState title="Can’t load academic calendar" description="Try again shortly." onRetry={() => { refetchYears(); refetchTerms(); }} /> : <><div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle>Create academic year</CardTitle><CardDescription>Use an unambiguous label, for example 2026 or 2026/27.</CardDescription></CardHeader><CardContent><form className="grid gap-4" onSubmit={submitYear}><Input required placeholder="2026/27" value={year.name} onChange={(e) => setYear({ ...year, name: e.target.value })} /><div className="grid gap-4 sm:grid-cols-2"><Input required type="date" value={year.startsOn} onChange={(e) => setYear({ ...year, startsOn: e.target.value })} /><Input required type="date" value={year.endsOn} onChange={(e) => setYear({ ...year, endsOn: e.target.value })} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={year.active} onChange={(e) => setYear({ ...year, active: e.target.checked })} /> Set as active academic year</label><Button type="submit" disabled={savingYear}>{savingYear ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Create year</Button></form></CardContent></Card><Card><CardHeader><CardTitle>Create assessment term</CardTitle><CardDescription>Formal results are explicitly Midterm or Terminal; assignments do not determine a Secondary Division.</CardDescription></CardHeader><CardContent><form className="grid gap-4" onSubmit={submitTerm}><Select value={term.academicYearId} onValueChange={(academicYearId) => setTerm({ ...term, academicYearId })}><SelectTrigger><SelectValue placeholder="Academic year" /></SelectTrigger><SelectContent>{years.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><Input required placeholder="Term 1" value={term.name} onChange={(e) => setTerm({ ...term, name: e.target.value })} /><Select value={term.type} onValueChange={(type: "midterm" | "terminal") => setTerm({ ...term, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="midterm">Midterm</SelectItem><SelectItem value="terminal">Terminal</SelectItem></SelectContent></Select><div className="grid gap-4 sm:grid-cols-2"><Input required type="date" value={term.startsOn} onChange={(e) => setTerm({ ...term, startsOn: e.target.value })} /><Input required type="date" value={term.endsOn} onChange={(e) => setTerm({ ...term, endsOn: e.target.value })} /></div><Button type="submit" disabled={savingTerm || years.length === 0}>{savingTerm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}Create term</Button></form></CardContent></Card></div>
      {loading ? <Skeleton className="h-56 w-full" /> : <Card><CardHeader><CardTitle>Configured terms</CardTitle><CardDescription>Terms are listed here for review before staff enter subject results.</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Academic year</TableHead><TableHead>Term</TableHead><TableHead>Type</TableHead><TableHead>Dates</TableHead></TableRow></TableHeader><TableBody>{terms.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No terms configured.</TableCell></TableRow> : terms.map((item) => <TableRow key={item.id}><TableCell>{item.academicYear.name}</TableCell><TableCell className="font-medium">{item.name}</TableCell><TableCell className="capitalize">{item.type}</TableCell><TableCell className="text-muted-foreground">{item.startsOn} – {item.endsOn}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>}</>}</div>;
}
