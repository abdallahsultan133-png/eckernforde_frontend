import { useEffect, useMemo, useState } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { BookOpenCheck, Download, Loader2, Printer, Save } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useDownload } from "@/hooks/use-download.ts";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge.tsx";
import { SummaryBar, type SummaryItem } from "@/components/ui/summary-bar.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { GradebookDocument } from "@/components/pdf/gradebook-document.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { cn } from "@/lib/utils.ts";
import { UserRole, type User, type ClassDetails } from "@/types";

type GradebookRow = {
  studentId: string;
  name: string;
  email: string;
  assignmentAvg: number | null;
  examAvg: number | null;
  finalGrade: number | null;
  letterGrade: string | null;
  remarks: string | null;
  isOverridden: boolean;
};

const letterFor = (grade: number | null | undefined): string | null => {
  if (grade === null || grade === undefined || Number.isNaN(grade)) return null;
  if (grade >= 90) return "A";
  if (grade >= 80) return "B";
  if (grade >= 70) return "C";
  if (grade >= 60) return "D";
  return "F";
};
const letterTone = (letter: string | null): StatusTone =>
  letter === "A" || letter === "B" ? "success" : letter === "C" ? "warning" : letter === "D" || letter === "F" ? "critical" : "neutral";

const gradeColor = (grade: number | null) => {
  if (grade === null) return "text-muted-foreground";
  if (grade >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (grade >= 75) return "text-blue-600 dark:text-blue-400";
  if (grade >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const Gradebook = () => {
  const { data: identity } = useGetIdentity<User>();
  const isTeacherOrAdmin = identity?.role === UserRole.TEACHER || identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
  const isStudent = identity?.role === UserRole.STUDENT;

  const queryClient = useQueryClient();
  const { narrateDownload } = useDownload();
  // Prefill the class when arriving from a class workspace (/grades?classId=5).
  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState(searchParams.get("classId") ?? "");
  const [overrides, setOverrides] = useState<Record<string, { finalGrade: string; remarks: string }>>({});
  const [saving, setSaving] = useState(false);

  const { query: classesQuery } = useList<ClassDetails>({ resource: "classes", pagination: { pageSize: 100 } });
  const allClasses = useMemo(() => classesQuery?.data?.data ?? [], [classesQuery?.data?.data]);

  // A student can only ever view their own gradebook row, and only for a class
  // they're enrolled in — so the picker only offers those.
  const { data: enrolledIdsData } = useApiQuery<{ data: number[] }>(isStudent ? "/classes/enrolled-ids" : null);
  const enrolledIds = enrolledIdsData?.data ?? [];
  const classes = isStudent ? allClasses.filter((c) => enrolledIds.includes(c.id)) : allClasses;

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(String(classes[0].id));
  }, [classes, classId]);

  const gradebookPath = classId ? `/grades/gradebook/${classId}` : null;
  const { data: gradebookData, isLoading: loading, isError, refetch } = useApiQuery<{ data: GradebookRow[] }>(gradebookPath);
  const rows = useMemo(() => gradebookData?.data ?? [], [gradebookData]);
  const selectedClassName = classes.find((c) => String(c.id) === classId)?.name ?? "";
  const pdfFileName = `gradebook-${selectedClassName.replace(/\s+/g, "-").toLowerCase() || classId}.pdf`;

  // Reset the editable override inputs whenever a fresh gradebook loads.
  useEffect(() => {
    setOverrides(
      Object.fromEntries(
        rows.map((r) => [r.studentId, { finalGrade: r.finalGrade?.toString() ?? "", remarks: r.remarks ?? "" }]),
      ),
    );
  }, [rows]);

  const effectiveFinal = (row: GradebookRow): number | null => {
    const raw = overrides[row.studentId]?.finalGrade;
    if (raw !== undefined && raw !== "") return Number(raw);
    return row.finalGrade;
  };

  // Class-level summary from the effective (override-aware) finals.
  const graded = rows.map(effectiveFinal).filter((g): g is number => g !== null && !Number.isNaN(g));
  const classAvg = graded.length > 0 ? Math.round(graded.reduce((s, g) => s + g, 0) / graded.length) : null;
  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const g of graded) {
    const l = letterFor(g);
    if (l) dist[l as keyof typeof dist] += 1;
  }
  const atRisk = dist.D + dist.F;

  const summaryItems: SummaryItem[] = isStudent
    ? [
        { label: "Your final grade", value: classAvg !== null ? `${classAvg}%` : "—", tone: classAvg === null ? "default" : classAvg >= 60 ? "success" : "critical" },
        { label: "Letter", value: letterFor(classAvg) ?? "—" },
      ]
    : [
        { label: "Class average", value: classAvg !== null ? `${classAvg}%` : "—", tone: classAvg === null ? "default" : classAvg >= 70 ? "success" : "warning" },
        { label: "Graded", value: graded.length, hint: `${rows.length} students` },
        { label: "A / B / C / D / F", value: `${dist.A}·${dist.B}·${dist.C}·${dist.D}·${dist.F}` },
        { label: "At risk (D or F)", value: atRisk, tone: atRisk > 0 ? "critical" : "success" },
      ];

  const handleSave = async () => {
    const records = rows
      .map((r) => ({
        studentId: r.studentId,
        finalGrade: Number(overrides[r.studentId]?.finalGrade ?? r.finalGrade ?? 0),
        remarks: overrides[r.studentId]?.remarks || undefined,
      }))
      .filter((r) => !Number.isNaN(r.finalGrade));

    if (records.length === 0) return toast.error("Nothing to save.");
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/grades/gradebook/${classId}/save`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed to save grades");
      toast.success("Grades saved.");
      await queryClient.invalidateQueries({ queryKey: [gradebookPath] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save grades");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gradebook space-y-6">
      <PageHeader
        className="print:hidden"
        breadcrumb
        title="Gradebook"
        description="Assignment and exam averages, final grades and remarks per student."
        actions={
          <>
            {isTeacherOrAdmin && (
              <Button asChild variant="ghost" size="sm">
                <Link to={classId ? `/grades/exams?classId=${classId}` : "/grades/exams"}>
                  <BookOpenCheck className="mr-1.5 h-4 w-4" /> Exams
                </Link>
              </Button>
            )}
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
            {!loading && rows.length > 0 && (
              <PDFDownloadLink
                document={<GradebookDocument className={selectedClassName} rows={rows} />}
                fileName={pdfFileName}
              >
                {({ loading: pdfLoading }) => (
                  <Button size="sm" disabled={pdfLoading} onClick={() => !pdfLoading && narrateDownload(pdfFileName)}>
                    {pdfLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                    Download PDF
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </>
        }
      />

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Gradebook</h1>
        <p className="text-sm text-muted-foreground">
          {selectedClassName} · Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {!loading && !isError && rows.length > 0 && <SummaryBar items={summaryItems} className="print:hidden" />}

      {loading ? (
        <Card className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</Card>
      ) : isError ? (
        <ErrorState description="Couldn't load the gradebook." onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title={isStudent ? "No grades yet" : "Nothing to grade"}
          description={
            isStudent
              ? classes.length === 0
                ? "You're not enrolled in any classes yet."
                : "No grades have been recorded for you in this class yet."
              : "No students are enrolled in this class yet."
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Assignment Avg</TableHead>
                <TableHead className="text-center">Exam Avg</TableHead>
                <TableHead className="w-24">Final</TableHead>
                <TableHead className="text-center">Letter</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const ov = overrides[row.studentId] ?? { finalGrade: "", remarks: "" };
                const displayGrade = effectiveFinal(row);
                const letter = letterFor(displayGrade);
                const risky = isTeacherOrAdmin && (letter === "D" || letter === "F");

                return (
                  <TableRow key={row.studentId} className={cn(risky && "bg-red-500/5 print:bg-transparent")}>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                    </TableCell>
                    <TableCell className={`text-center font-medium ${gradeColor(row.assignmentAvg)}`}>
                      {row.assignmentAvg !== null ? `${row.assignmentAvg}%` : "—"}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${gradeColor(row.examAvg)}`}>
                      {row.examAvg !== null ? `${row.examAvg}%` : "—"}
                    </TableCell>
                    <TableCell>
                      {isTeacherOrAdmin ? (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="w-20"
                          value={ov.finalGrade}
                          placeholder={row.finalGrade?.toString() ?? "—"}
                          onChange={(e) => setOverrides((prev) => ({ ...prev, [row.studentId]: { ...prev[row.studentId], finalGrade: e.target.value } }))}
                        />
                      ) : (
                        <span className={`font-medium ${gradeColor(row.finalGrade)}`}>{row.finalGrade ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {letter ? <StatusBadge tone={letterTone(letter)}>{letter}</StatusBadge> : "—"}
                    </TableCell>
                    <TableCell>
                      {isTeacherOrAdmin ? (
                        <Input
                          className="w-40"
                          placeholder="Optional remarks"
                          value={ov.remarks}
                          onChange={(e) => setOverrides((prev) => ({ ...prev, [row.studentId]: { ...prev[row.studentId], remarks: e.target.value } }))}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{row.remarks ?? "—"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {isTeacherOrAdmin && rows.length > 0 && (
        <div className="flex justify-end print:hidden">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-1.5 h-4 w-4" />
            Save Grades
          </Button>
        </div>
      )}
    </div>
  );
};

export default Gradebook;
