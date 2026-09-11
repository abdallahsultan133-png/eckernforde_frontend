import { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { Award, FileText, Printer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { UserRole, type User } from "@/types";

type Term = { id: number; name: string; type: "midterm" | "terminal"; academicYear: { name: string } };
type Result = { id: number; score: number; schoolLevel: "nursery" | "primary" | "secondary"; applicable: boolean; subject: { name: string; code: string }; class: { name: string } };
type Division = { totalPoints: number | null; division: "I" | "II" | "III" | "IV" | "0" | null; bestSeven: Array<{ subjectId: number; grade: string; points: number }> } | null;
type TermResultsResponse = { data: Result[]; term: { id: number; name: string; type: "midterm" | "terminal" }; division: Division };
type Child = { id: string; name: string; email: string };

const letterFor = (score: number) => score >= 75 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : score >= 30 ? "D" : "F";
const toneFor = (letter: string): StatusTone => letter === "A" || letter === "B" ? "success" : letter === "C" ? "warning" : "critical";

export default function TermResults() {
  const { data: identity } = useGetIdentity<User>();
  const isParent = identity?.role === UserRole.PARENT;
  const { data: childrenData, isLoading: childrenLoading, isError: childrenError, refetch: refetchChildren } = useApiQuery<{ data: Child[] }>(isParent ? "/profile/my-children" : null);
  const children = childrenData?.data ?? [];
  const { data: termsData, isLoading: termsLoading, isError: termsError, refetch: refetchTerms } = useApiQuery<{ data: Term[] }>("/grades/academic-terms");
  const terms = termsData?.data ?? [];
  const [termId, setTermId] = useState("");
  const [studentId, setStudentId] = useState("");
  useEffect(() => { if (!termId && terms.length) setTermId(String(terms[0].id)); }, [termId, terms]);
  useEffect(() => { if (isParent && !studentId && children.length) setStudentId(children[0].id); }, [children, isParent, studentId]);
  const resultStudentId = isParent ? studentId : identity?.id;
  const { data, isLoading, isError, refetch } = useApiQuery<TermResultsResponse>(resultStudentId && termId ? `/grades/term-results/${resultStudentId}?academicTermId=${termId}` : null);
  const results = data?.data ?? [];
  const division = data?.division;
  const selected = terms.find((term) => String(term.id) === termId);

  return <div className="space-y-6">
    <PageHeader className="print:hidden" breadcrumb title="Term Results" description="Approved Midterm and Terminal subject results." actions={<Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />Print results</Button>} />
    {termsLoading || childrenLoading ? <Skeleton className="h-10 w-64" /> : termsError || childrenError ? <ErrorState title="Can’t load academic terms" description="Try again shortly." onRetry={() => { refetchTerms(); refetchChildren(); }} /> : isParent && children.length === 0 ? <EmptyState icon={FileText} title="No linked children" description="Ask the school administrator to link your parent account to a student profile." /> : terms.length === 0 ? <EmptyState icon={FileText} title="No academic terms yet" description="Results will appear after the school creates an academic year and term." /> : <>
      <div className="flex flex-wrap items-center gap-3">
        {isParent && <Select value={studentId} onValueChange={setStudentId}><SelectTrigger className="w-full sm:w-[240px]"><SelectValue placeholder="Choose child" /></SelectTrigger><SelectContent>{children.map((child) => <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>)}</SelectContent></Select>}
        <Select value={termId} onValueChange={setTermId}><SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Choose a term" /></SelectTrigger><SelectContent>{terms.map((term) => <SelectItem key={term.id} value={String(term.id)}>{term.academicYear.name} · {term.name} ({term.type === "terminal" ? "Terminal" : "Midterm"})</SelectItem>)}</SelectContent></Select>
        {selected && <span className="text-sm text-muted-foreground">{selected.type === "terminal" ? "Terminal results" : "Midterm results"}</span>}
      </div>
      {isLoading ? <Card className="p-5"><Skeleton className="h-48 w-full" /></Card> : isError ? <ErrorState title="Can’t load term results" description="Results may not be published yet, or you may not have access." onRetry={refetch} /> : <>
        {division?.division && <Card className="border-[#ba4a32]/30 bg-[#ba4a32]/5"><CardContent className="flex flex-wrap items-center gap-5 p-6"><Award className="h-9 w-9 text-[#ba4a32]" aria-hidden="true" /><div><p className="text-sm font-medium text-muted-foreground">Secondary Terminal Division</p><p className="font-serif text-4xl font-semibold">Division {division.division}</p></div><div className="border-l border-border pl-5"><p className="text-sm font-medium text-muted-foreground">Best Seven points</p><p className="text-2xl font-bold">{division.totalPoints}</p></div></CardContent></Card>}
        <Card><CardHeader><CardTitle>Subject results</CardTitle></CardHeader><CardContent className="p-0">{results.length === 0 ? <div className="p-6"><EmptyState icon={FileText} title="No results published" description="Your school has not published results for this term." /></div> : <Table><TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Class</TableHead><TableHead className="text-center">Score</TableHead><TableHead className="text-center">Grade</TableHead></TableRow></TableHeader><TableBody>{results.map((result) => { const letter = letterFor(result.score); return <TableRow key={result.id}><TableCell className="font-medium">{result.subject.name}</TableCell><TableCell className="text-muted-foreground">{result.class.name}</TableCell><TableCell className="text-center font-semibold">{result.score}%</TableCell><TableCell className="text-center"><StatusBadge tone={toneFor(letter)}>{letter}</StatusBadge></TableCell></TableRow>; })}</TableBody></Table>}</CardContent></Card>
      </>}
    </>}
  </div>;
}
