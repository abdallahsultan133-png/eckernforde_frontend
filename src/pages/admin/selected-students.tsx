import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { stageLabel } from "@/components/academic/headmaster-stage-selector.tsx";
import { FilterBar } from "@/components/ui/filter-bar.tsx";
import { SearchInput } from "@/components/ui/search-input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useDebouncedValue } from "@/hooks/use-debounced-value.ts";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { BACKEND_BASE_URL } from "@/constants";
import { UserRole } from "@/types";

type Student = { id: string; name: string; email: string; image: string | null; role: UserRole };
type StudentsResponse = { data: Student[]; pagination?: { page: number; limit: number; total: number; totalPages: number } };
type AcademicYear = { id: number; name: string };

const getInitials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
const roleLabels: Record<UserRole, string> = {
  [UserRole.STUDENT]: "Student",
  [UserRole.TEACHER]: "Teacher",
  [UserRole.PRIMARY_HEADMASTER]: "Primary Headmaster",
  [UserRole.SECONDARY_HEADMASTER]: "Secondary Headmaster",
  [UserRole.PARENT]: "Parent",
  [UserRole.SUPER_ADMIN]: "Super Admin",
};

export default function SelectedStudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const schoolLevel = searchParams.get("schoolLevel") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const academicYearId = searchParams.get("academicYearId") ?? "";
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get("page")) || 1));
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const validScope = (schoolLevel === "primary" || schoolLevel === "secondary") && Boolean(stage && academicYearId);
  const apiParams = new URLSearchParams({ schoolLevel, stage, academicYearId, page: String(page), limit: "500" });
  if (debouncedSearch.trim()) apiParams.set("search", debouncedSearch.trim());
  const studentsPath = validScope ? `/users/students?${apiParams.toString()}` : null;
  const { data, isLoading, isFetching, isError, refetch } = useApiQuery<StudentsResponse>(studentsPath);
  const { data: yearsData } = useApiQuery<{ data: AcademicYear[] }>(validScope ? "/grades/academic-years" : null);
  const students = data?.data ?? [];
  const pagination = data?.pagination;
  const yearName = yearsData?.data.find((year) => String(year.id) === academicYearId)?.name ?? academicYearId;

  if (!validScope) return <Navigate to="/students" replace />;

  const changePage = (nextPage: number) => {
    const safePage = Math.max(1, nextPage);
    setPage(safePage);
    const nextParams = new URLSearchParams(searchParams);
    if (safePage > 1) nextParams.set("page", String(safePage));
    else nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const changeRole = async (studentId: string, role: UserRole) => {
    setSavingId(studentId);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/users/${studentId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Failed to update student access.");

      queryClient.setQueryData<StudentsResponse>([studentsPath], (previous) =>
        previous ? { ...previous, data: previous.data.map((student) => student.id === studentId ? { ...student, role } : student) } : previous,
      );
      toast.success("Student access updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update student access.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader breadcrumb showBackLink={false} title={`${stageLabel(stage)} Students`} description={`Academic year ${yearName}`} />
      <FilterBar
        search={
          <SearchInput
            placeholder="Search by name or email"
            aria-label="Search students by name or email"
            value={search}
            onChange={updateSearch}
            loading={isFetching}
          />
        }
        active={Boolean(search)}
        onClear={() => updateSearch("")}
        resultLabel={isLoading ? "Loading students…" : `${(pagination?.total ?? students.length).toLocaleString()} ${(pagination?.total ?? students.length) === 1 ? "student" : "students"} in this view`}
      />
      {isLoading ? (
        <div className="space-y-3 border-y border-border p-4" aria-busy="true">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <ErrorState title="Unable to load students" description="Check the selected scope and try again." onRetry={refetch} />
      ) : students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students in this class or form" description="There are no enrolled student accounts for the selected academic year." />
      ) : <>
        <div className="overflow-x-auto border-y border-border bg-card sm:rounded-lg sm:border">
          <Table aria-label={`${stageLabel(stage)} students for ${yearName}`}>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Email</TableHead><TableHead>Role / access</TableHead><TableHead className="text-right">Report</TableHead></TableRow></TableHeader>
            <TableBody>{students.map((student) => {
              const reportPath = `/grades/term-results?${new URLSearchParams({ studentId: student.id, academicYearId, reportSource: "student-directory", schoolLevel, stage, ...(page > 1 ? { page: String(page) } : {}) }).toString()}`;
              return <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border border-border">
                      {student.image && <AvatarImage src={student.image} alt={`${student.name} profile photo`} />}
                      <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{student.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{student.email}</TableCell>
                <TableCell>
                  <Select value={student.role} onValueChange={(value) => void changeRole(student.id, value as UserRole)} disabled={savingId === student.id}>
                    <SelectTrigger aria-label={`Change role for ${student.name}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.values(UserRole).map((role) => <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right"><Button variant="outline" size="sm" asChild><Link to={reportPath}>Open report <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" /></Link></Button></TableCell>
              </TableRow>;
            })}</TableBody>
          </Table>
        </div>
        {pagination && pagination.totalPages > 1 && <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} students</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => changePage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages || isLoading} onClick={() => changePage(page + 1)}>Next</Button>
          </div>
        </div>}
        {pagination && pagination.totalPages <= 1 && <p className="text-sm text-muted-foreground">{pagination.total.toLocaleString()} {pagination.total === 1 ? "student" : "students"}</p>}
      </>}
    </PageContainer>
  );
}
