import { useEffect, useMemo, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useSearchParams } from "react-router";
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
import { UserRole, type User } from "@/types";

type Term = { id: number; name: string; type: "midterm" | "terminal"; academicYear: { id: number; name: string } };
type PublishClass = { id: number; name: string; academicYearId: number | null; schoolLevel: "nursery" | "primary" | "secondary" | null; subject: { id: number; name: string } };
type PublishClassGroup = { key: string; label: string; classIds: number[] };

const classStageLabel = (course: Pick<PublishClass, "name">) => {
  const value = course.name.trim().replace(/[._-]+/g, " ");
  const match = value.match(/^(nursery|kg|kindergarten|class|standard|form)\s*(iv|iii|ii|i|1|2|3|4|5|6|7)?\b/i);
  if (!match) return course.name;
  const prefix = match[1]!.toLowerCase();
  if (prefix === "nursery") return "Nursery";
  const roman = ({ "1": "I", "2": "II", "3": "III", "4": "IV", "5": "V", "6": "VI", "7": "VII" } as Record<string, string>)[match[2] ?? ""] ?? match[2]?.toUpperCase() ?? "";
  if (prefix === "kg" || prefix === "kindergarten") return `KG ${roman}`.trim();
  if (prefix === "class" || prefix === "standard") return `Class ${roman}`.trim();
  return `Form ${roman}`.trim();
};

export default function TermResultsPublishing() {
  const [searchParams] = useSearchParams();
  const { data: identity } = useGetIdentity<User>();
  const headmasterSchoolLevel = identity?.role === UserRole.PRIMARY_HEADMASTER ? "primary" : identity?.role === UserRole.SECONDARY_HEADMASTER ? "secondary" : null;
  const { data: classesData, isLoading: classesLoading, isError: classesError, refetch: refetchClasses } = useApiQuery<{ data: PublishClass[] }>("/grades/publishable-classes");
  const classes = useMemo(() => classesData?.data ?? [], [classesData?.data]);
  const { data: termsData, isLoading: termsLoading, isError: termsError, refetch: refetchTerms } = useApiQuery<{ data: Term[] }>("/grades/academic-terms");
  const classGroups = useMemo<PublishClassGroup[]>(() => {
    const groups = new Map<string, PublishClassGroup>();
    for (const course of classes) {
      const label = classStageLabel(course);
      const key = label.toLowerCase();
      const group = groups.get(key) ?? { key, label, classIds: [] };
      group.classIds.push(course.id);
      groups.set(key, group);
    }
    if (headmasterSchoolLevel === "secondary") {
      return ["Form I", "Form II", "Form III", "Form IV"].map((label) =>
        groups.get(label.toLowerCase()) ?? { key: label.toLowerCase(), label, classIds: [] },
      );
    }
    return [...groups.values()];
  }, [classes, headmasterSchoolLevel]);
  const terms = useMemo(() => termsData?.data ?? [], [termsData?.data]);
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [saving, setSaving] = useState<"publish" | "hide" | null>(null);
  const requestedClassName = searchParams.get("className");
  const requestedTermId = searchParams.get("termId");
  const requestedSubjectId = searchParams.get("subjectId");
  const [focusedSubjectId, setFocusedSubjectId] = useState<number | null>(() => {
    const value = Number(requestedSubjectId);
    return Number.isInteger(value) && value > 0 ? value : null;
  });

  useEffect(() => {
    if (classGroups.length && (!classId || !classGroups.some((group) => group.key === classId))) {
      const requestedLabel = requestedClassName ? classStageLabel({ name: requestedClassName }).toLowerCase() : "";
      const requestedGroup = classGroups.find((group) => group.key === requestedLabel);
      setClassId(requestedGroup?.key ?? classGroups[0]!.key);
    }
    if (!classGroups.length && classId) setClassId("");
  }, [classId, classGroups, requestedClassName]);
  useEffect(() => {
    const requestedLabel = requestedClassName ? classStageLabel({ name: requestedClassName }).toLowerCase() : "";
    const requestedGroup = classGroups.find((group) => group.key === requestedLabel);
    if (requestedGroup) setClassId(requestedGroup.key);
  }, [classGroups, requestedClassName]);
  useEffect(() => {
    if (!termId && terms.length) {
      setTermId(requestedTermId && terms.some((term) => String(term.id) === requestedTermId) ? requestedTermId : String(terms[0]!.id));
    }
  }, [termId, terms, requestedTermId]);
  useEffect(() => {
    if (requestedTermId && terms.some((term) => String(term.id) === requestedTermId)) setTermId(requestedTermId);
  }, [requestedTermId, terms]);
  useEffect(() => {
    const value = Number(requestedSubjectId);
    setFocusedSubjectId(Number.isInteger(value) && value > 0 ? value : null);
  }, [requestedSubjectId]);

  const publish = async (published: boolean) => {
    const selectedGroup = classGroups.find((group) => group.key === classId);
    if (!selectedGroup || !termId) return toast.error("Choose a class and term.");
    if (selectedGroup.classIds.length === 0) return toast.error(`${selectedGroup.label} has no class records yet.`);
    const selectedTerm = terms.find((term) => String(term.id) === termId);
    if (!selectedTerm) return toast.error("Choose a valid assessment period.");
    const yearClasses = classes.filter((course) => selectedGroup.classIds.includes(course.id) && course.academicYearId === selectedTerm.academicYear.id);
    const targetClasses = focusedSubjectId === null ? yearClasses : yearClasses.filter((course) => course.subject.id === focusedSubjectId);
    if (targetClasses.length === 0) return toast.error("No matching subject class belongs to this assessment period's academic year.");
    const targetClassIds = targetClasses.map((course) => course.id);
    setSaving(published ? "publish" : "hide");
    try {
      let count = 0;
      for (const selectedClassId of targetClassIds) {
        const response = await fetch(`${BACKEND_BASE_URL}/grades/term-results/publish`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ academicTermId: Number(termId), classId: selectedClassId, published }) });
        if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not update publication.");
        count += (await response.json()).data?.count ?? 0;
      }
      if (count === 0) {
        toast.error(`No saved ${selectedTerm.name} results were found for ${focusedSubjectId === null ? selectedGroup.label : targetClasses[0]!.subject.name}.`);
        return;
      }
      toast.success(`${count} result(s) ${published ? "published" : "hidden"}.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update publication."); }
    finally { setSaving(null); }
  };

  const loading = classesLoading || termsLoading;
  const error = classesError || termsError;
  return <PageContainer className="max-w-4xl">
    <PageHeader breadcrumb title="Publish term results" description="Control when approved Midterm and Terminal subject results become available to students and families." />
    {loading ? <div className="space-y-4 rounded-lg border p-6" aria-busy="true"><Skeleton className="h-6 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      : error ? <ErrorState title="Unable to load publication controls" description="Check your connection and permissions, then retry." onRetry={() => { refetchClasses(); refetchTerms(); }} />
      : terms.length === 0 || classGroups.length === 0 ? <EmptyState icon={Send} title="Set up terms and classes first" description="Create an academic term and at least one class before publishing results." />
      : <section className="rounded-lg border bg-background p-5 sm:p-6">
        <SectionHeader title="Publication control" description={focusedSubjectId !== null ? "This alert targets one subject. Select its class and assessment period to publish the saved marks." : "Select the exact class and assessment period. This affects saved formal results only."} />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">Class or form<Select value={classId} onValueChange={(value) => { setClassId(value); setFocusedSubjectId(null); }}><SelectTrigger><SelectValue placeholder="Choose class or form" /></SelectTrigger><SelectContent>{classGroups.map((group) => <SelectItem key={group.key} value={group.key}>{group.label}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-2 text-sm font-medium">Assessment period<Select value={termId} onValueChange={setTermId}><SelectTrigger><SelectValue placeholder="Choose term" /></SelectTrigger><SelectContent>{terms.map((term) => <SelectItem key={term.id} value={String(term.id)}>{term.academicYear.name} · {term.name} ({term.type})</SelectItem>)}</SelectContent></Select></label>
        </div>
        <div className="mt-6 border-t pt-5"><p className="mb-3 text-sm text-muted-foreground">Publishing again refreshes the release for students and families. Other relevant administrators are notified each time results are published or republished.</p><div className="flex flex-col gap-2 sm:flex-row"><Button onClick={() => publish(true)} disabled={saving !== null}>{saving === "publish" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Publish results</Button><Button variant="outline" onClick={() => publish(false)} disabled={saving !== null}>{saving === "hide" ? <Loader2 className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}Hide results</Button></div></div>
      </section>}
  </PageContainer>;
}
