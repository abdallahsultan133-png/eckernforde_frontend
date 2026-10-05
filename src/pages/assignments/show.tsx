import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { toast } from "sonner";
import { BarChart3, CheckCircle2, Download, File as FileIcon, Loader2, Trash2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { EntityHeader } from "@/components/layout/entity-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { SectionHeader } from "@/components/layout/section-header.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Button } from "@/components/ui/button.tsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { StatusBadge } from "@/components/ui/status-badge.tsx";
import FileUploadWidget, { type FileUploadValue } from "@/components/file-upload-widget.tsx";
import { DeadlineCountdown } from "@/components/deadline-countdown.tsx";
import { useHistoricalPortal } from "@/components/layout/historical-portal-banner.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { User } from "@/types";
import { GradingPane } from "./grading-pane.tsx";

type Submission = { id: number; assignmentId: number; studentId: string; content: string | null; fileUrl: string | null; fileName: string | null; status: "submitted" | "late" | "graded"; score: number | null; feedback: string | null; submittedAt: string; aiScore: number | null; aiSummary: string | null; student?: { id: string; name: string; email: string; image: string | null } };
type AssignmentDetail = { id: number; title: string; description: string | null; dueAt: string | null; maxScore: number; attachmentUrl: string | null; attachmentName: string | null; class: { id: number; name: string }; creator: { id: string; name: string }; mySubmission: Submission | null };
const submissionStatus = (status: Submission["status"]) => { const labels = { submitted: ["Submitted", "info"], late: ["Submitted late", "warning"], graded: ["Graded", "success"] } as const; const [label, tone] = labels[status]; return <StatusBadge tone={tone}>{label}</StatusBadge>; };

export default function AssignmentShow() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<User>();
  const isParent = identity?.role === "parent";
  const childId = searchParams.get("childId");
  const academicYearId = searchParams.get("academicYearId");
  const parentContextQuery = childId && academicYearId
    ? `?childId=${encodeURIComponent(childId)}&academicYearId=${encodeURIComponent(academicYearId)}`
    : "";
  const { data: historicalPortal } = useHistoricalPortal();
  const historical = !!historicalPortal?.data.archiveContext;
  const isTeacherOrAdmin = identity?.role === "teacher" || identity?.role === "primary_headmaster" || identity?.role === "secondary_headmaster" || identity?.role === "super_admin";
  const canManage = isTeacherOrAdmin && !historical;
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<FileUploadValue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAssignment = useCallback(() => {
    setLoading(true); setLoadError(null);
    return fetch(`${BACKEND_BASE_URL}/homework/${id}${isParent ? parentContextQuery : ""}`, { credentials: "include" })
      .then(async (res) => { if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message ?? "Failed to load homework"); return res.json(); })
      .then((json: { data: AssignmentDetail }) => { setAssignment(json.data); if (json.data.mySubmission) { setContent(json.data.mySubmission.content ?? ""); if (json.data.mySubmission.fileUrl) setFile({ url: json.data.mySubmission.fileUrl, publicId: "", fileName: json.data.mySubmission.fileName ?? "Attachment" }); } })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Failed to load homework"))
      .finally(() => setLoading(false));
  }, [id, isParent, parentContextQuery]);
  useEffect(() => { if (identity) void loadAssignment(); }, [identity, loadAssignment]);

  const handleSubmit = async () => {
    if (!content.trim() && !file) return toast.error("Add some text or attach a file before submitting.");
    setSubmitting(true);
    try { const res = await fetch(`${BACKEND_BASE_URL}/homework/${id}/submit`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: content.trim() || undefined, fileUrl: file?.url, fileCldPubId: file?.publicId, fileName: file?.fileName }) }); if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message ?? "Failed to submit"); toast.success("Homework submitted."); await loadAssignment(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Failed to submit"); }
    finally { setSubmitting(false); }
  };
  const handleDeleteAssignment = async () => {
    setDeleting(true);
    try { const res = await fetch(`${BACKEND_BASE_URL}/homework/${id}`, { method: "DELETE", credentials: "include" }); if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message ?? "Failed to delete homework"); toast.success("Homework deleted."); navigate("/homework"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Failed to delete homework"); setDeleting(false); }
  };

  if (loading) return <PageContainer className="space-y-6" aria-label="Loading homework" aria-busy="true"><Breadcrumb /><Skeleton className="h-8 w-1/3" /><Skeleton className="h-40 w-full" /></PageContainer>;
  if (!assignment) return <PageContainer className="space-y-6"><Breadcrumb />{loadError ? <ErrorState title="Unable to load homework" description={loadError} onRetry={loadAssignment} /> : <p className="text-sm text-muted-foreground">Homework not found.</p>}{isParent && <Button variant="outline" asChild><Link to="/parent/homework">Choose a child and year</Link></Button>}</PageContainer>;

  const deadlinePassed = !!assignment.dueAt && new Date() > new Date(assignment.dueAt);
  return <PageContainer className="assignment-show space-y-4">
    <Breadcrumb />
    {isParent && parentContextQuery && <Button variant="outline" size="sm" asChild><Link to={`/parent/homework/view${parentContextQuery}`}>Back to selected child's homework</Link></Button>}
    <EntityHeader identity={<div className="flex h-11 w-11 items-center justify-center rounded-lg border bg-muted text-muted-foreground"><FileIcon className="h-5 w-5" /></div>} title={assignment.title} subtitle={`${assignment.class.name} · by ${assignment.creator.name}`} metadata={<><span>{assignment.maxScore} points</span>{assignment.dueAt && <span>Due {new Date(assignment.dueAt).toLocaleString()}</span>}</>} actions={isTeacherOrAdmin ? <><Button variant="outline" size="sm" asChild><Link to={`/homework/${assignment.id}/report`}><BarChart3 className="mr-1.5 h-4 w-4" />View report</Link></Button>{canManage && <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this homework?</AlertDialogTitle><AlertDialogDescription>“{assignment.title}” and all submissions will be permanently removed. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAssignment} disabled={deleting} className="bg-destructive text-white hover:bg-destructive/90">{deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete homework</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}</> : null} />
    <section className="rounded-lg border bg-background p-4 sm:p-5"><SectionHeader title="Homework brief" description="Instructions, deadline and resources for this task." /><div className="mt-3 space-y-3"><DeadlineCountdown dueAt={assignment.dueAt} variant="panel" />{assignment.description && <p className="whitespace-pre-wrap text-sm leading-6">{assignment.description}</p>}{assignment.attachmentUrl ? <div className="rounded-md border bg-muted/20 p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-2 text-sm"><FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{assignment.attachmentName ?? "Homework file"}</span></div><Button variant="outline" size="sm" asChild><a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" download><Download className="mr-1.5 h-4 w-4" />Download homework file</a></Button></div></div> : <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No downloadable file was attached. Your teacher provided instructions only.</p>}</div></section>
    {isParent && (
      <section className="rounded-lg border bg-background p-5 sm:p-6">
        <SectionHeader title="Child's submission" description="View the selected child's work and teacher feedback." action={assignment.mySubmission ? submissionStatus(assignment.mySubmission.status) : undefined} />
        <div className="mt-5 space-y-4">
          {assignment.mySubmission?.status === "graded" && <div className="border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"><div className="flex items-center gap-1.5 font-medium"><CheckCircle2 className="h-4 w-4" />Score: {assignment.mySubmission.score} / {assignment.maxScore}</div>{assignment.mySubmission.feedback && <p className="mt-1">{assignment.mySubmission.feedback}</p>}</div>}
          {assignment.mySubmission ? <div className="space-y-2 border bg-muted/30 p-3 text-sm"><p className="text-muted-foreground">Submitted {new Date(assignment.mySubmission.submittedAt).toLocaleString()}</p>{assignment.mySubmission.content && <p className="whitespace-pre-wrap">{assignment.mySubmission.content}</p>}{assignment.mySubmission.fileUrl && <a href={assignment.mySubmission.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"><FileIcon className="h-3.5 w-3.5" />{assignment.mySubmission.fileName ?? "Attachment"}</a>}</div> : <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{deadlinePassed ? "No submission was recorded before the deadline." : "Your child has not submitted this homework yet."}</p>}
        </div>
      </section>
    )}
    {!isTeacherOrAdmin && !isParent && <section className="rounded-lg border bg-background p-5 sm:p-6"><SectionHeader title="Your submission" description="Submit once before the deadline. Submitted work is final." action={assignment.mySubmission ? submissionStatus(assignment.mySubmission.status) : undefined} /><div className="mt-5 space-y-4">{assignment.mySubmission?.status === "graded" && <div className="border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"><div className="flex items-center gap-1.5 font-medium"><CheckCircle2 className="h-4 w-4" />Score: {assignment.mySubmission.score} / {assignment.maxScore}</div>{assignment.mySubmission.feedback && <p className="mt-1">{assignment.mySubmission.feedback}</p>}</div>}{assignment.mySubmission ? <div className="space-y-2 border bg-muted/30 p-3 text-sm"><p className="text-muted-foreground">Submitted {new Date(assignment.mySubmission.submittedAt).toLocaleString()} — submissions are final and cannot be changed.</p>{assignment.mySubmission.content && <p className="whitespace-pre-wrap">{assignment.mySubmission.content}</p>}{assignment.mySubmission.fileUrl && <a href={assignment.mySubmission.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"><FileIcon className="h-3.5 w-3.5" />{assignment.mySubmission.fileName ?? "Attachment"}</a>}</div> : deadlinePassed ? <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">The deadline has passed. You can no longer submit.</p> : <><Textarea placeholder="Write your answer here..." value={content} onChange={(event) => setContent(event.target.value)} rows={6} /><FileUploadWidget value={file} onChange={setFile} /><Button onClick={handleSubmit} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit homework</Button></>}</div></section>}
    {isTeacherOrAdmin && (historical
      ? <section className="rounded-lg border bg-background p-4 sm:p-5"><SectionHeader title="Submissions and marks" description="This previous-year homework record is read only." action={<Button variant="outline" size="sm" asChild><Link to={`/homework/${assignment.id}/report`}><BarChart3 className="mr-1.5 h-4 w-4" />View saved marks</Link></Button>} /></section>
      : <section className="space-y-3"><SectionHeader title="Submissions and grading" description="Review student work and record marks." /><GradingPane assignmentId={assignment.id} maxScore={assignment.maxScore} /></section>)}
  </PageContainer>;
}
