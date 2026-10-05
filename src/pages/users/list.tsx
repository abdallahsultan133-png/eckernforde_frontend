import { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useLocation } from "react-router";
import { toast } from "sonner";
import { Check, Copy, Download, KeyRound, Loader2, Mail, MoreHorizontal, ShieldAlert, Trash2, Users as UsersIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { SectionHeader } from "@/components/layout/section-header.tsx";
import { FilterBar } from "@/components/ui/filter-bar.tsx";
import { SearchInput } from "@/components/ui/search-input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { useDebouncedValue } from "@/hooks/use-debounced-value.ts";
import { toCsv } from "@/lib/csv.ts";
import { useDownload } from "@/hooks/use-download.ts";
import { UserRole, type User } from "@/types";
import { HeadmasterStageSelector, type HeadmasterStage, stageLabel } from "@/components/academic/headmaster-stage-selector.tsx";
import { SchoolLevelSelector, type SchoolLevel } from "@/components/academic/school-level-selector.tsx";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  children?: Array<{ id: string; name: string; classes: string[] }>;
};

type PasswordResetRequest = {
  id: number;
  email: string;
  status: string;
  requestedAt: string;
  handledAt: string | null;
  user: Pick<ManagedUser, "id" | "name" | "email" | "role"> | null;
};

type AcademicYear = { id: number; name: string; active: boolean };

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.STUDENT]: "Student",
  [UserRole.TEACHER]: "Teacher",
  [UserRole.PRIMARY_HEADMASTER]: "Primary Headmaster",
  [UserRole.SECONDARY_HEADMASTER]: "Secondary Headmaster",
  [UserRole.PARENT]: "Parent",
  [UserRole.SUPER_ADMIN]: "Super Admin",
};

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const UsersList = () => {
  const { pathname } = useLocation();
  const directoryRole = pathname === "/students" ? UserRole.STUDENT : pathname === "/teachers" ? UserRole.TEACHER : pathname === "/guardians" ? UserRole.PARENT : null;
  const isAccessView = directoryRole === null;
  const directoryCopy = directoryRole === UserRole.STUDENT
    ? { title: "Students", description: "Find student accounts and open their connected academic records.", singular: "student" }
    : directoryRole === UserRole.TEACHER
      ? { title: "Teachers", description: "Find teaching accounts and review their portal access.", singular: "teacher" }
      : directoryRole === UserRole.PARENT
        ? { title: "Parents & guardians", description: "Find family portal accounts. Child relationships are managed from the student record.", singular: "guardian" }
        : { title: "People & access", description: "Find school accounts, review their access, and manage roles permitted by your administrator level.", singular: "person" };
  const { data: identity, isLoading: identityLoading } = useGetIdentity<User>();
  const isAdminLike = identity?.role === UserRole.PRIMARY_HEADMASTER || identity?.role === UserRole.SECONDARY_HEADMASTER || identity?.role === UserRole.SUPER_ADMIN;
  const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;
  const isHeadmaster = identity?.role === UserRole.PRIMARY_HEADMASTER || identity?.role === UserRole.SECONDARY_HEADMASTER;
  const isHeadmasterStudentDirectory = isHeadmaster && directoryRole === UserRole.STUDENT;
  const [selectedStage, setSelectedStage] = useState<HeadmasterStage | "">("");
  const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<SchoolLevel | "">("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const isScopedSuperAdminDirectory = isSuperAdmin && directoryRole !== null;
  const needsStageScope = directoryRole === UserRole.STUDENT || directoryRole === UserRole.TEACHER;
  const { data: academicYearsData, isLoading: academicYearsLoading, isError: academicYearsError, refetch: refetchAcademicYears } = useApiQuery<{ data: AcademicYear[] }>(
    isSuperAdmin && needsStageScope ? "/grades/academic-years" : null,
  );
  const academicYears = academicYearsData?.data ?? [];

  const queryClient = useQueryClient();
  const { download } = useDownload();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [roleFilter, setRoleFilter] = useState<string>(directoryRole ?? "all");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Admin-initiated password reset: a pending confirm (target + mode), the
  // "working" flag, and the one-time result shown after a "temporary" reset.
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [resetMode, setResetMode] = useState<"email" | "temporary" | null>(null);
  const [resetting, setResetting] = useState(false);
  const [tempResult, setTempResult] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [systemSaving, setSystemSaving] = useState(false);
  const { data: systemData } = useApiQuery<{ data: { enabled: boolean; teachersEnabled: boolean; studentsParentsEnabled: boolean } }>(isSuperAdmin ? "/system/status" : null);
  const systemEnabled = systemData?.data?.enabled ?? true;
  const teachersEnabled = systemData?.data?.teachersEnabled ?? true;
  const studentsParentsEnabled = systemData?.data?.studentsParentsEnabled ?? true;
  const { data: resetQueueData, isLoading: resetQueueLoading, isError: resetQueueError, refetch: refetchResetQueue } = useApiQuery<{ data: PasswordResetRequest[] }>(
    isSuperAdmin ? "/password-reset-requests?limit=100" : null,
  );
  const resetRequests = resetQueueData?.data ?? [];
  const [queueResettingId, setQueueResettingId] = useState<number | null>(null);

  useEffect(() => {
    setRoleFilter(directoryRole ?? "all");
  }, [directoryRole]);

  const toggleSystem = async (setting: "enabled" | "teachersEnabled" | "studentsParentsEnabled", value: boolean) => {
    setSystemSaving(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/system/status`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [setting]: value }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not update system status");
      queryClient.setQueryData(["/system/status"], (previous: { data?: Record<string, boolean> } | undefined) => ({
        data: { ...(previous?.data ?? {}), [setting]: value },
      }));
      const labels = { enabled: "System access", teachersEnabled: "Teacher login", studentsParentsEnabled: "Student and parent login" };
      toast.success(`${labels[setting]} ${value ? "enabled" : "disabled"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update system status");
    } finally { setSystemSaving(false); }
  };

  // Permanent user deletion: the row pending confirmation + the in-flight flag.
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const usersPath = isAdminLike
    ? (() => {
        const params = new URLSearchParams({ limit: "100" });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (isScopedSuperAdminDirectory) {
          if (!selectedSchoolLevel || (needsStageScope && (!selectedAcademicYearId || !selectedStage))) return null;
          params.set("schoolLevel", selectedSchoolLevel);
          if (needsStageScope) params.set("academicYearId", selectedAcademicYearId);
          if (directoryRole === UserRole.STUDENT) {
            params.delete("limit");
            params.set("stage", selectedStage);
            return `/users/students?${params.toString()}`;
          }
          if (directoryRole === UserRole.TEACHER) params.set("stage", selectedStage);
        }
        if (isHeadmasterStudentDirectory) {
          if (!selectedStage) return null;
          params.delete("limit");
          params.set("stage", selectedStage);
          return `/users/students?${params.toString()}`;
        }
        if (isHeadmaster && directoryRole === UserRole.TEACHER) {
          params.set("role", UserRole.TEACHER);
          return `/users?${params.toString()}`;
        }
        return `/users?${params.toString()}`;
      })()
    : null;

  const { data, isLoading: loading, isFetching, isError, refetch } = useApiQuery<{ data: ManagedUser[] }>(usersPath);
  const users = data?.data ?? [];

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setSavingId(userId);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/users/${userId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed to update role");

      queryClient.setQueryData<{ data: ManagedUser[] }>([usersPath], (prev) =>
        prev ? { data: prev.data.map((u) => (u.id === userId ? { ...u, role } : u)) } : prev
      );
      toast.success("Role updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !resetMode) return;
    setResetting(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/users/${resetTarget.id}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: resetMode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? json?.message ?? "Failed to reset password");

      if (resetMode === "email") {
        toast.success("Password reset link sent.");
      } else {
        setTempResult({
          name: resetTarget.name,
          email: resetTarget.email,
          password: json.data.temporaryPassword,
        });
      }
      setResetTarget(null);
      setResetMode(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleQueueTemporaryPassword = async (request: PasswordResetRequest) => {
    setQueueResettingId(request.id);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/password-reset-requests/${request.id}/temporary-password`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to generate temporary password");

      setTempResult({
        name: json.data.name,
        email: json.data.email,
        password: json.data.temporaryPassword,
      });
      await refetchResetQueue();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate temporary password");
    } finally {
      setQueueResettingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/users/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? json?.message ?? "Failed to delete user");

      queryClient.setQueryData<{ data: ManagedUser[] }>([usersPath], (prev) =>
        prev ? { data: prev.data.filter((u) => u.id !== deleteTarget.id) } : prev
      );
      toast.success(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  if (!identityLoading && !isAdminLike) {
    return <Navigate to="/" replace />;
  }

  const handleExportCsv = () => {
    const fileName = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    void download(
      fileName,
      () =>
        toCsv(users, [
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
        ]),
      { mime: "text/csv" },
    );
  };

  if (isScopedSuperAdminDirectory && (!selectedSchoolLevel || (needsStageScope && (!selectedAcademicYearId || !selectedStage)))) {
    return (
      <PageContainer className="users-list">
        <PageHeader breadcrumb title={directoryCopy.title} description={directoryCopy.description} />
        <div className="space-y-4">
          <SchoolLevelSelector
            label="School name"
            value={selectedSchoolLevel}
            onChange={(level) => { setSelectedSchoolLevel(level); setSelectedAcademicYearId(""); setSelectedStage(""); }}
          />
          {selectedSchoolLevel && needsStageScope && <div className="max-w-xl space-y-2">
            <label htmlFor="super-admin-directory-year" className="text-sm font-semibold">Academic year</label>
            {academicYearsLoading ? <Skeleton className="h-11 w-full" /> : academicYearsError ? (
              <ErrorState description="Unable to load academic years." onRetry={refetchAcademicYears} />
            ) : (
              <Select value={selectedAcademicYearId} onValueChange={(yearId) => { setSelectedAcademicYearId(yearId); setSelectedStage(""); }}>
                <SelectTrigger id="super-admin-directory-year" className="h-11 w-full"><SelectValue placeholder="Choose an academic year" /></SelectTrigger>
                <SelectContent>{academicYears.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " · Current" : ""}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>}
          {selectedSchoolLevel && selectedAcademicYearId && needsStageScope && <HeadmasterStageSelector
            role={selectedSchoolLevel === "primary" ? UserRole.PRIMARY_HEADMASTER : UserRole.SECONDARY_HEADMASTER}
            value={selectedStage}
            onChange={setSelectedStage}
            title={selectedSchoolLevel === "primary" ? "Choose a class" : "Choose a form"}
            description={`Choose the class or form whose ${directoryCopy.title.toLowerCase()} you want to view.`}
          />}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="users-list">
      <PageHeader
        breadcrumb
        title={directoryCopy.title}
        description={directoryCopy.description}
        actions={
          <div className="flex items-center gap-3">
            {isScopedSuperAdminDirectory && !needsStageScope && <Button variant="outline" size="sm" onClick={() => { setSelectedSchoolLevel(""); setSelectedStage(""); }}>Change school</Button>}
            {users.length > 0 && <Button variant="outline" size="sm" onClick={handleExportCsv}><Download className="mr-1.5 h-4 w-4" /> Export CSV</Button>}
          </div>
        }
      />

      {isScopedSuperAdminDirectory && needsStageScope && <div className="space-y-4">
        <SchoolLevelSelector
          label="School name"
          value={selectedSchoolLevel}
          onChange={(level) => { setSelectedSchoolLevel(level); setSelectedAcademicYearId(""); setSelectedStage(""); }}
        />
        {selectedSchoolLevel && <div className="max-w-xl space-y-2">
          <label htmlFor="super-admin-directory-year" className="text-sm font-semibold">Academic year</label>
          {academicYearsLoading ? <Skeleton className="h-11 w-full" /> : academicYearsError ? (
            <ErrorState description="Unable to load academic years." onRetry={refetchAcademicYears} />
          ) : (
            <Select value={selectedAcademicYearId} onValueChange={(yearId) => { setSelectedAcademicYearId(yearId); setSelectedStage(""); }}>
              <SelectTrigger id="super-admin-directory-year" className="h-11 w-full"><SelectValue placeholder="Choose an academic year" /></SelectTrigger>
              <SelectContent>{academicYears.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " · Current" : ""}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>}
        {selectedSchoolLevel && selectedAcademicYearId && <HeadmasterStageSelector
          role={selectedSchoolLevel === "primary" ? UserRole.PRIMARY_HEADMASTER : UserRole.SECONDARY_HEADMASTER}
          value={selectedStage}
          onChange={setSelectedStage}
          title={selectedSchoolLevel === "primary" ? "Choose a class" : "Choose a form"}
          description={`Choose the class or form whose ${directoryCopy.title.toLowerCase()} you want to view.`}
        />}
      </div>}

      {isHeadmasterStudentDirectory && identity?.role && (
        <HeadmasterStageSelector
          role={identity.role}
          value={selectedStage}
          onChange={setSelectedStage}
          title="Choose a class"
          description="Choose a class to see every student assigned to that class or form."
        />
      )}

      {isHeadmasterStudentDirectory && selectedStage && (
        <p className="text-sm text-muted-foreground">Showing students in {stageLabel(selectedStage)}.</p>
      )}

      {isAccessView && !isSuperAdmin && (
        <div className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-300">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          Only a super admin can grant headmaster-level roles. You can manage student/teacher/parent roles.
        </div>
      )}

      {isAccessView && isSuperAdmin && (
        <section aria-labelledby="login-access-title" className="border-y border-border bg-card py-5">
          <div className="space-y-4 px-4 sm:px-5">
            <SectionHeader
              title={<span id="login-access-title">Login access controls</span>}
              description="Control which role groups can enter the school portal. Super administrators always retain access."
            />
            <div className="divide-y divide-border border-y border-border md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
              {[
                { key: "enabled" as const, checked: systemEnabled, title: "System access", description: "Master switch for all non-super-admin users." },
                { key: "teachersEnabled" as const, checked: teachersEnabled, title: "Teacher login", description: "Allow teachers to sign in and use the portal." },
                { key: "studentsParentsEnabled" as const, checked: studentsParentsEnabled, title: "Student & parent login", description: "Allow students and parents to sign in." },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 px-3 py-4 md:px-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch aria-label={`Toggle ${item.title}`} checked={item.checked} disabled={systemSaving} onCheckedChange={(value) => toggleSystem(item.key, value)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {isSuperAdmin && (
        <section aria-labelledby="password-recovery-title" className="space-y-4 border-y border-border bg-card py-5">
          <div className="px-4 sm:px-5">
            <SectionHeader
              title={<span id="password-recovery-title">Password recovery requests</span>}
              description="Users who requested a reset appear here. Generate a temporary password only when you need to give the user a direct login option."
            />
          </div>
          {resetQueueLoading ? (
            <div className="space-y-3 px-4 sm:px-5"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : resetQueueError ? (
            <div className="px-4 sm:px-5"><ErrorState title="Unable to load password recovery requests" description="Try again shortly." onRetry={refetchResetQueue} /></div>
          ) : resetRequests.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground sm:px-5">No password recovery requests have been recorded.</p>
          ) : (
            <div className="overflow-x-auto border-y border-border">
              <Table aria-label="Password recovery requests">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resetRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.user?.name ?? "Account unavailable"}</TableCell>
                      <TableCell className="text-muted-foreground">{request.user?.email ?? request.email}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(request.requestedAt).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{request.status.replaceAll("_", " ")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!request.user || queueResettingId === request.id}
                          onClick={() => void handleQueueTemporaryPassword(request)}
                        >
                          {queueResettingId === request.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1.5 h-4 w-4" />}
                          Generate temporary password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}

      <section className={`space-y-4 ${isHeadmasterStudentDirectory && !selectedStage ? "hidden" : ""}`}>
        <FilterBar
          search={
            <SearchInput
              placeholder="Search by name or email"
              aria-label="Search users by name or email"
              value={search}
              onChange={setSearch}
              loading={isFetching}
            />
          }
          active={Boolean(search || (isAccessView && roleFilter !== "all"))}
          onClear={() => { setSearch(""); setRoleFilter(directoryRole ?? "all"); }}
          resultLabel={loading ? `Loading ${directoryCopy.title.toLowerCase()}…` : `${users.length.toLocaleString()} ${users.length === 1 ? directoryCopy.singular : directoryCopy.singular === "person" ? "people" : `${directoryCopy.singular}s`} in this view`}
        >
          {isAccessView && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[180px]" aria-label="Filter people by role">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {Object.values(UserRole).map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}
        </FilterBar>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState title="Unable to load people" description="Check your connection and access, then try again." onRetry={refetch} />
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title={`No ${directoryCopy.title.toLowerCase()} found`} description={search || (isAccessView && roleFilter !== "all") ? "Try clearing or changing the current filters." : "No matching school accounts are available to you."} />
        ) : (
          <div className="overflow-hidden border-y border-border bg-card sm:rounded-lg sm:border">
          <Table aria-label="School people and access">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                {directoryRole === UserRole.PARENT && <TableHead className="min-w-[220px]">Children</TableHead>}
                <TableHead className="w-[200px]">Role</TableHead>
                <TableHead className="w-[52px]"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const canEditThisRole = isSuperAdmin || (![UserRole.PRIMARY_HEADMASTER, UserRole.SECONDARY_HEADMASTER, UserRole.SUPER_ADMIN].includes(u.role));
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {u.image && <AvatarImage src={u.image} />}
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        {u.role === UserRole.STUDENT ? (
                          <Link to={`/students/${u.id}`} className="font-medium underline-offset-4 hover:text-primary hover:underline">{u.name}</Link>
                        ) : (
                          <span className="font-medium">{u.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    {directoryRole === UserRole.PARENT && <TableCell>
                      {u.children?.length ? <ul className="space-y-2">
                        {u.children.map((child) => <li key={child.id}>
                          <Link to={`/students/${child.id}`} className="font-medium underline-offset-4 hover:text-primary hover:underline">{child.name}</Link>
                          <span className="block text-xs text-muted-foreground">{child.classes.length ? child.classes.join(" · ") : "No current class or form"}</span>
                        </li>)}
                      </ul> : <span className="text-sm text-muted-foreground">No linked children</span>}
                    </TableCell>}
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(value) => handleRoleChange(u.id, value as UserRole)}
                        disabled={savingId === u.id || !canEditThisRole || u.id === identity?.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(UserRole).map((r) => {
                            const disallowed = ([UserRole.PRIMARY_HEADMASTER, UserRole.SECONDARY_HEADMASTER, UserRole.SUPER_ADMIN].includes(r)) && !isSuperAdmin;
                            return (
                              <SelectItem key={r} value={r} disabled={disallowed}>
                                {ROLE_LABELS[r]}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEditThisRole && u.id !== identity?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions for {u.name}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Reset password</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => { setResetTarget(u); setResetMode("email"); }}
                            >
                              <Mail className="mr-2 h-4 w-4" /> Send reset email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => { setResetTarget(u); setResetMode("temporary"); }}
                            >
                              <KeyRound className="mr-2 h-4 w-4" /> Set temporary password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </section>

      {/* Confirm a reset before it happens */}
      <AlertDialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open && !resetting) { setResetTarget(null); setResetMode(null); }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetMode === "email" ? "Send a password reset email?" : "Set a temporary password?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {resetMode === "email" ? (
                  <>
                    We&apos;ll send a link to choose a new password. It expires in 1 hour.
                  </>
                ) : (
                  <>
                    This immediately replaces{" "}
                    <span className="font-medium text-foreground">{resetTarget?.name}</span>&apos;s
                    password and signs them out everywhere. You&apos;ll get a one-time password to pass
                    on — shown only once.
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleResetPassword(); }}
              disabled={resetting}
            >
              {resetting ? "Working…" : resetMode === "email" ? "Send email" : "Set password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* One-time reveal of a generated temporary password */}
      <Dialog
        open={!!tempResult}
        onOpenChange={(open) => { if (!open) { setTempResult(null); setCopied(false); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary password for {tempResult?.name}</DialogTitle>
            <DialogDescription>
              Give this to {tempResult?.name}. It won&apos;t be shown again. They can sign in with it,
              then set their own password from their profile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <code className="flex-1 select-all break-all font-mono text-sm">{tempResult?.password}</code>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!tempResult) return;
                try {
                  await navigator.clipboard.writeText(tempResult.password);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  toast.error("Couldn't copy — select the text and copy it manually.");
                }
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => { setTempResult(null); setCopied(false); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm permanent deletion */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                This permanently removes{" "}
                <span className="font-medium text-foreground">{deleteTarget?.name}</span> and their
                sign-in, enrollments, submissions, grades, attendance and messages. It can&apos;t be
                undone. If this person teaches classes or authored homework, announcements or exams,
                the delete will be blocked until those are reassigned or removed.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDeleteUser(); }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default UsersList;
