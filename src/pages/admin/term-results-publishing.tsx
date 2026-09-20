import { useEffect, useMemo, useState } from "react";
import { useList } from "@refinedev/core";
import { CheckCircle2, EyeOff, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_BASE_URL } from "@/constants";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ClassDetails } from "@/types";

type Term = { id: number; name: string; type: "midterm" | "terminal"; academicYear: { name: string } };

export default function TermResultsPublishing() {
  const { query: classesQuery } = useList<ClassDetails>({ resource: "classes", pagination: { pageSize: 100 } });
  const classes = useMemo(() => classesQuery?.data?.data ?? [], [classesQuery?.data?.data]);
  const { data: termsData, isLoading: termsLoading, isError: termsError, refetch: refetchTerms } = useApiQuery<{ data: Term[] }>("/grades/academic-terms");
  const terms = useMemo(() => termsData?.data ?? [], [termsData?.data]);
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [saving, setSaving] = useState<"publish" | "hide" | null>(null);

  useEffect(() => { if (!classId && classes.length) setClassId(String(classes[0].id)); }, [classId, classes]);
  useEffect(() => { if (!termId && terms.length) setTermId(String(terms[0].id)); }, [termId, terms]);

  const publish = async (published: boolean) => {
    if (!classId || !termId) return toast.error("Choose a class and term.");
    setSaving(published ? "publish" : "hide");
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/grades/term-results/publish`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ academicTermId: Number(termId), classId: Number(classId), published }) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not update publication.");
      const result = await response.json();
      toast.success(`${result.data?.count ?? 0} result(s) ${published ? "published" : "hidden"}.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update publication."); }
    finally { setSaving(null); }
  };

  const loading = classesQuery.isLoading || termsLoading;
  const error = classesQuery.isError || termsError;
  return <PageContainer className="max-w-4xl">
    <PageHeader breadcrumb title="Publish term results" description="Control when approved Midterm and Terminal subject results become available to students and families." />
    {loading ? <div className="space-y-4 rounded-lg border p-6" aria-busy="true"><Skeleton className="h-6 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      : error ? <ErrorState title="Unable to load publication controls" description="Check your connection and permissions, then retry." onRetry={() => { classesQuery.refetch(); refetchTerms(); }} />
      : terms.length === 0 || classes.length === 0 ? <EmptyState icon={Send} title="Set up terms and classes first" description="Create an academic term and at least one class before publishing results." />
      : <section className="rounded-lg border bg-background p-5 sm:p-6">
        <SectionHeader title="Publication control" description="Select the exact class and assessment period. This affects saved formal results only." />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">Class<Select value={classId} onValueChange={setClassId}><SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger><SelectContent>{classes.map((course) => <SelectItem key={course.id} value={String(course.id)}>{course.name}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-2 text-sm font-medium">Assessment period<Select value={termId} onValueChange={setTermId}><SelectTrigger><SelectValue placeholder="Choose term" /></SelectTrigger><SelectContent>{terms.map((term) => <SelectItem key={term.id} value={String(term.id)}>{term.academicYear.name} · {term.name} ({term.type})</SelectItem>)}</SelectContent></Select></label>
        </div>
        <div className="mt-6 border-t pt-5"><p className="mb-3 text-sm text-muted-foreground">Hiding results keeps the records but removes them from student and parent views.</p><div className="flex flex-col gap-2 sm:flex-row"><Button onClick={() => publish(true)} disabled={saving !== null}>{saving === "publish" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Publish results</Button><Button variant="outline" onClick={() => publish(false)} disabled={saving !== null}>{saving === "hide" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}Hide results</Button></div></div>
      </section>}
  </PageContainer>;
}
