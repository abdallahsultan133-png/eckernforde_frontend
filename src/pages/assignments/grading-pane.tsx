import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, FileText, Loader2, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { BACKEND_BASE_URL } from "@/constants";
import { cn } from "@/lib/utils.ts";

type Submission = {
  id: number;
  studentId: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  status: "submitted" | "late" | "graded";
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  aiScore: number | null;
  aiSummary: string | null;
  student?: { id: string; name: string; email: string; image: string | null };
};

const getInitials = (name = "") =>
  name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const aiTone = (score: number): StatusTone =>
  score >= 70 ? "critical" : score >= 30 ? "warning" : "success";

const FILTERS = [
  { key: "ungraded", label: "Needs grading" },
  { key: "graded", label: "Graded" },
  { key: "all", label: "All" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

interface GradingPaneProps {
  assignmentId: string | number;
  maxScore: number;
}

/**
 * Focused grading surface — a submission list on the left, the selected
 * submission and its grade form on the right. "Save & next" persists and jumps
 * to the next ungraded submission so a teacher can work straight down the pile
 * without leaving the page. Inspired by Canvas SpeedGrader / Brightspace.
 */
export function GradingPane({ assignmentId, maxScore }: GradingPaneProps) {
  const queryKey = `/assignments/${assignmentId}/submissions`;
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Submission[] }>(queryKey);
  const queryClient = useQueryClient();

  const submissions = useMemo(() => data?.data ?? [], [data]);
  const ungradedCount = submissions.filter((s) => s.status !== "graded").length;

  const [filter, setFilter] = useState<FilterKey>("ungraded");
  const filtered = useMemo(() => {
    if (filter === "all") return submissions;
    if (filter === "graded") return submissions.filter((s) => s.status === "graded");
    return submissions.filter((s) => s.status !== "graded");
  }, [submissions, filter]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Keep a valid selection as data / filter change.
  useEffect(() => {
    if (submissions.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((cur) => {
      if (cur !== null && submissions.some((s) => s.id === cur)) return cur;
      return (filtered[0] ?? submissions[0]).id;
    });
  }, [submissions, filtered]);

  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  // Load the draft from whichever submission is selected.
  useEffect(() => {
    setScore(selected?.score != null ? String(selected.score) : "");
    setFeedback(selected?.feedback ?? "");
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const scoreInputRef = useRef<HTMLInputElement>(null);

  const gotoNextUngraded = (afterId: number) => {
    const pool = submissions.filter((s) => s.status !== "graded" && s.id !== afterId);
    if (pool.length > 0) {
      setSelectedId(pool[0].id);
      requestAnimationFrame(() => scoreInputRef.current?.focus());
    }
  };

  const save = async (advance: boolean) => {
    if (!selected) return;
    const trimmed = score.trim();
    const numeric = Number(trimmed);
    if (!trimmed || Number.isNaN(numeric) || numeric < 0 || numeric > maxScore) {
      toast.error(`Enter a score between 0 and ${maxScore}.`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/assignments/submissions/${selected.id}/grade`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: numeric, feedback: feedback.trim() || undefined }),
      });
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({})))?.error ?? "Failed to save grade");
      }
      const { data: updated } = (await res.json()) as { data: Partial<Submission> };

      queryClient.setQueryData<{ data: Submission[] }>([queryKey], (prev) =>
        prev
          ? {
              data: prev.data.map((s) =>
                s.id === selected.id ? { ...s, ...updated, student: s.student } : s,
              ),
            }
          : prev,
      );
      toast.success("Grade saved.");
      if (advance) gotoNextUngraded(selected.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState description="Couldn't load submissions for this assignment." onRetry={refetch} />;
  }
  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No submissions yet"
        description="Once students submit their work, you can grade it here."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,300px)_1fr]">
      {/* ── Submission list ─────────────────────────────────────────────── */}
      <div className="rounded-xl border">
        <div className="flex flex-wrap gap-1 border-b p-2">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? submissions.length
                : f.key === "graded"
                  ? submissions.length - ungradedCount
                  : ungradedCount;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label} {count}
              </button>
            );
          })}
        </div>
        <ul className="max-h-[420px] divide-y overflow-y-auto lg:max-h-[560px]">
          {filtered.length === 0 ? (
            <li className="p-4 text-center text-xs text-muted-foreground">Nothing in this view.</li>
          ) : (
            filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  aria-current={s.id === selectedId ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                    s.id === selectedId ? "bg-muted" : "hover:bg-muted/50",
                  )}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    {s.student?.image && <AvatarImage src={s.student.image} alt={s.student.name} />}
                    <AvatarFallback className="text-[10px]">{getInitials(s.student?.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{s.student?.name ?? "Student"}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {s.status === "graded" ? `Scored ${s.score}/${maxScore}` : "Awaiting grade"}
                    </span>
                  </span>
                  {s.aiScore != null && s.aiScore >= 30 && (
                    <Sparkles
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        s.aiScore >= 70 ? "text-red-500" : "text-amber-500",
                      )}
                      aria-label={`${s.aiScore}% likely AI-written`}
                    />
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      s.status === "graded" ? "bg-emerald-500" : "bg-amber-500",
                    )}
                  />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* ── Detail + grade form ────────────────────────────────────────── */}
      {selected && (
        <div className="rounded-xl border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                {selected.student?.image && <AvatarImage src={selected.student.image} alt={selected.student.name} />}
                <AvatarFallback className="text-xs">{getInitials(selected.student?.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold leading-tight">{selected.student?.name}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(selected.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <StatusBadge tone={selected.status === "graded" ? "success" : "info"}>
              {selected.status === "graded" ? "Graded" : "Submitted"}
            </StatusBadge>
          </div>

          <div className="space-y-4 p-5">
            {selected.aiScore != null && (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  <StatusBadge tone={aiTone(selected.aiScore)}>
                    {selected.aiScore}% likely AI-written
                  </StatusBadge>
                </div>
                {selected.aiSummary && (
                  <p className="mt-1.5 text-muted-foreground">{selected.aiSummary}</p>
                )}
              </div>
            )}

            {selected.content ? (
              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm">
                {selected.content}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No written response.</p>
            )}

            {selected.fileUrl && (
              <a
                href={selected.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <FileText className="h-4 w-4" />
                {selected.fileName ?? "Download attachment"}
              </a>
            )}

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-end gap-3">
                <label className="text-sm font-medium">
                  <span className="mb-1 block">Score</span>
                  <span className="flex items-center gap-1.5">
                    <Input
                      ref={scoreInputRef}
                      type="number"
                      min={0}
                      max={maxScore}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault();
                          void save(true);
                        }
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">/ {maxScore}</span>
                  </span>
                </label>
              </div>

              <label className="block text-sm font-medium">
                <span className="mb-1 block">Feedback <span className="font-normal text-muted-foreground">(optional)</span></span>
                <Textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What went well, what to improve…"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => save(false)} disabled={saving} variant="outline">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
                <Button onClick={() => save(true)} disabled={saving || ungradedCount === 0}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Save &amp; next
                </Button>
                <span className="self-center text-xs text-muted-foreground">
                  {ungradedCount === 0
                    ? "All submissions graded."
                    : `${ungradedCount} left to grade · ⌘↵ to save & next`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

GradingPane.displayName = "GradingPane";
