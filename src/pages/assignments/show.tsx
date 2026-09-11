import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { toast } from "sonner";
import { CheckCircle2, File as FileIcon, Loader2, Trash2 } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { StatusBadge } from "@/components/ui/status-badge.tsx";
import FileUploadWidget, { type FileUploadValue } from "@/components/file-upload-widget.tsx";
import { DeadlineCountdown } from "@/components/deadline-countdown.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { User } from "@/types";
import { GradingPane } from "./grading-pane.tsx";

type Submission = {
  id: number;
  assignmentId: number;
  studentId: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  status: "submitted" | "late" | "graded";
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  aiScore: number | null;
  aiSummary: string | null;
  student?: { id: string; name: string; email: string; image: string | null };
};

type AssignmentDetail = {
  id: number;
  title: string;
  description: string | null;
  dueAt: string | null;
  maxScore: number;
  attachmentUrl: string | null;
  attachmentName: string | null;
  class: { id: number; name: string };
  creator: { id: string; name: string };
  mySubmission: Submission | null;
};

const statusBadge = (status: Submission["status"]) => {
  const map = {
    submitted: { label: "Submitted", tone: "info" },
    late: { label: "Submitted late", tone: "warning" },
    graded: { label: "Graded", tone: "success" },
  } as const;
  const { label, tone } = map[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
};

const AssignmentShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<User>();
  const isTeacherOrAdmin = identity?.role === "teacher" || identity?.role === "admin" || identity?.role === "super_admin";

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [content, setContent] = useState("");
  const [file, setFile] = useState<FileUploadValue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAssignment = useCallback(() => {
    setLoading(true);
    return fetch(`${BACKEND_BASE_URL}/assignments/${id}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to load assignment");
        return res.json();
      })
      .then((json: { data: AssignmentDetail }) => {
        setAssignment(json.data);
        if (json.data.mySubmission) {
          setContent(json.data.mySubmission.content ?? "");
          if (json.data.mySubmission.fileUrl) {
            setFile({ url: json.data.mySubmission.fileUrl, publicId: "", fileName: json.data.mySubmission.fileName ?? "Attachment" });
          }
        }
      })
      .catch((e) => toast.error(e.message ?? "Failed to load assignment"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadAssignment(); }, [loadAssignment]);

  const handleSubmit = async () => {
    if (!content.trim() && !file) return toast.error("Add some text or attach a file before submitting.");

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/assignments/${id}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || undefined,
          fileUrl: file?.url,
          fileCldPubId: file?.publicId,
          fileName: file?.fileName,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to submit");

      toast.success("Submitted!");
      loadAssignment();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/assignments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to delete assignment");
      toast.success("Assignment deleted.");
      navigate("/assignments");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete assignment");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <p className="text-sm text-muted-foreground">Assignment not found.</p>
      </div>
    );
  }

  const deadlinePassed = !!assignment.dueAt && new Date() > new Date(assignment.dueAt);

  return (
    <div className="assignment-show space-y-6">
      <Breadcrumb />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{assignment.class.name} · by {assignment.creator.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{assignment.maxScore} pts</Badge>
              {isTeacherOrAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &ldquo;{assignment.title}&rdquo; and all of its submissions
                        will be permanently removed. This can&rsquo;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAssignment}
                        disabled={deleting}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete assignment
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="mt-4 space-y-4">
          {assignment.description && <p className="whitespace-pre-wrap text-sm">{assignment.description}</p>}

          <DeadlineCountdown dueAt={assignment.dueAt} variant="panel" />

          {assignment.attachmentUrl && (
            <a
              href={assignment.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <FileIcon className="h-4 w-4" />
              {assignment.attachmentName ?? "Download attachment"}
            </a>
          )}
        </CardContent>
      </Card>

      {!isTeacherOrAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your submission</CardTitle>
              {assignment.mySubmission && statusBadge(assignment.mySubmission.status)}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="mt-4 space-y-4">
            {assignment.mySubmission?.status === "graded" && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Score: {assignment.mySubmission.score} / {assignment.maxScore}
                </div>
                {assignment.mySubmission.feedback && (
                  <p className="mt-1">{assignment.mySubmission.feedback}</p>
                )}
              </div>
            )}

            {assignment.mySubmission ? (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
                <p className="text-muted-foreground">
                  Submitted {new Date(assignment.mySubmission.submittedAt).toLocaleString()} — submissions are final and can't be changed.
                </p>
                {assignment.mySubmission.content && (
                  <p className="whitespace-pre-wrap">{assignment.mySubmission.content}</p>
                )}
                {assignment.mySubmission.fileUrl && (
                  <a
                    href={assignment.mySubmission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <FileIcon className="h-3.5 w-3.5" /> {assignment.mySubmission.fileName ?? "Attachment"}
                  </a>
                )}
              </div>
            ) : deadlinePassed ? (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                The deadline for this assignment has passed. You can no longer submit.
              </p>
            ) : (
              <>
                <Textarea
                  placeholder="Write your answer here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />

                <FileUploadWidget value={file} onChange={setFile} />

                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {isTeacherOrAdmin && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Submissions &amp; grading</h2>
          <GradingPane assignmentId={assignment.id} maxScore={assignment.maxScore} />
        </section>
      )}
    </div>
  );
};

export default AssignmentShow;
