import { useEffect, useState } from "react";
import { useList } from "@refinedev/core";
import { CheckCircle2, EyeOff, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_BASE_URL } from "@/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ClassDetails } from "@/types";
type Term = { id: number; name: string; type: "midterm" | "terminal"; academicYear: { name: string } };
export default function TermResultsPublishing() {
  const { query: classesQuery } = useList<ClassDetails>({ resource: "classes", pagination: { pageSize: 100 } });
  const classes = classesQuery?.data?.data ?? [];
  const { data: termsData } = useApiQuery<{ data: Term[] }>("/grades/academic-terms");
  const terms = termsData?.data ?? [];
  const [classId, setClassId] = useState(""); const [termId, setTermId] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!classId && classes.length) setClassId(String(classes[0].id)); }, [classId, classes]);
  useEffect(() => { if (!termId && terms.length) setTermId(String(terms[0].id)); }, [termId, terms]);
  const publish = async (published: boolean) => { if (!classId || !termId) return toast.error("Choose a class and term."); setSaving(true); try { const response = await fetch(`${BACKEND_BASE_URL}/grades/term-results/publish`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ academicTermId: Number(termId), classId: Number(classId), published }) }); if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not update publication."); const result = await response.json(); toast.success(`${result.data?.count ?? 0} result(s) ${published ? "published" : "hidden"}.`); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update publication."); } finally { setSaving(false); } };
  return <div className="space-y-6"><PageHeader breadcrumb title="Publish Term Results" description="Review the selected class and term before students and parents can see formal results." />{terms.length === 0 || classes.length === 0 ? <EmptyState icon={Send} title="Set up terms and classes first" description="Create an academic term and at least one class before publishing results." /> : <Card className="max-w-2xl"><CardHeader><CardTitle>Publication control</CardTitle><CardDescription>Saving new scores automatically hides that class-term result set until it is reviewed again.</CardDescription></CardHeader><CardContent className="grid gap-5"><Select value={classId} onValueChange={setClassId}><SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger><SelectContent>{classes.map((course) => <SelectItem key={course.id} value={String(course.id)}>{course.name}</SelectItem>)}</SelectContent></Select><Select value={termId} onValueChange={setTermId}><SelectTrigger><SelectValue placeholder="Choose term" /></SelectTrigger><SelectContent>{terms.map((term) => <SelectItem key={term.id} value={String(term.id)}>{term.academicYear.name} · {term.name} ({term.type})</SelectItem>)}</SelectContent></Select><div className="flex flex-wrap gap-3"><Button onClick={() => publish(true)} disabled={saving}><CheckCircle2 className="mr-2 h-4 w-4" />Publish results</Button><Button variant="outline" onClick={() => publish(false)} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}Hide results</Button></div></CardContent></Card>}</div>;
}
