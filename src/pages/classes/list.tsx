import {PageHeader} from "@/components/layout/page-header.tsx";
import {PageContainer} from "@/components/layout/page-container.tsx";
import {SectionHeader} from "@/components/layout/section-header.tsx";
import {FilterBar} from "@/components/ui/filter-bar.tsx";
import {
    Check, DoorOpen, Loader2, GraduationCap, Users,
    MoreHorizontal, Eye, Pencil, Trash2, School,
} from "lucide-react";
import {Input} from "@/components/ui/input.tsx";
import {SearchInput} from "@/components/ui/search-input.tsx";
import {useCallback, useMemo, useState} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {CreateButton} from "@/components/refine-ui/buttons/create.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import {EmptyState} from "@/components/ui/empty-state.tsx";
import {ErrorState} from "@/components/ui/error-state.tsx";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog.tsx";
import {DataTable} from "@/components/refine-ui/data-table/data-table.tsx";
import {useTable} from "@refinedev/react-table";
import {ClassDetails, Subject, User, UserRole} from "@/types";
import {ColumnDef, type CellContext} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge.tsx";
import {useGetIdentity, useInvalidate, useList} from "@refinedev/core";
import {useQueryClient} from "@tanstack/react-query";
import {Link, useNavigate} from "react-router";
import {toast} from "sonner";
import {ShowButton} from "@/components/refine-ui/buttons/show.tsx";
import {DeleteButton} from "@/components/refine-ui/buttons/delete.tsx";
import {BACKEND_BASE_URL} from "@/constants";
import {useApiQuery} from "@/hooks/use-api-query.ts";
import {useHistoricalPortal} from "@/components/layout/historical-portal-banner";
import {useDebouncedValue} from "@/hooks/use-debounced-value.ts";
import {cn} from "@/lib/utils.ts";
import {AdminCatalogSelector, useAdminCatalogSelection} from "@/components/academic/admin-catalog-selector.tsx";
import {HeadmasterStageSelector, type HeadmasterStage} from "@/components/academic/headmaster-stage-selector.tsx";
import {useSuperAdminSchoolScope} from "@/components/academic/super-admin-school-scope.tsx";
import {SchoolCardSelector} from "@/components/academic/school-level-selector.tsx";

const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

// The three lifecycle states the API actually supports (see PUT /api/classes/:id).
const STATUS_STYLES: Record<string, { label: string; dot: string; text: string }> = {
    active: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
    inactive: { label: "Inactive", dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
    archived: { label: "Archived", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
};

function StatusPill({ status }: { status?: string }) {
    const s = STATUS_STYLES[status ?? ""] ?? {
        label: status ? status[0].toUpperCase() + status.slice(1) : "—",
        dot: "bg-muted-foreground/40",
        text: "text-muted-foreground",
    };
    return (
        <span className="inline-flex items-center gap-1.5 text-sm">
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden="true" />
            <span className={s.text}>{s.label}</span>
        </span>
    );
}

// Subtle, consistent class thumbnail. Falls back to an icon tile whenever there
// is no banner URL or the image fails to load — never a broken <img>.
function ClassBanner({ url, name }: { url?: string; name: string }) {
    const [broken, setBroken] = useState(false);
    if (url && !broken) {
        return (
            <img
                src={url}
                alt=""
                onError={() => setBroken(true)}
                className="h-9 w-9 shrink-0 rounded-md border border-border object-cover"
            />
        );
    }
    return (
        <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted"
            aria-hidden="true"
            title={name}
        >
            <School className="h-4 w-4 text-muted-foreground" />
        </div>
    );
}

// Compact action menu — replaces the row of full-width View / Edit / Delete
// buttons. Every item points at a route that already exists in App.tsx.
function ClassRowActions({
    classId, canEdit, canManage, canDelete,
}: { classId: number; canEdit: boolean; canManage: boolean; canDelete: boolean }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Class actions">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                        <Link to={`/classes/show/${classId}`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View details
                        </Link>
                    </DropdownMenuItem>
                    {canEdit && (
                        <DropdownMenuItem asChild>
                            <Link to={`/classes/edit/${classId}`} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" /> Edit class
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {canManage && (
                        <DropdownMenuItem asChild>
                            <Link to={`/classes/${classId}/enroll`} className="cursor-pointer">
                                <Users className="mr-2 h-4 w-4" /> Manage students
                            </Link>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {canDelete && (
                <DeleteButton
                    resource="classes"
                    recordItemId={classId}
                    size="icon"
                    variant="ghost"
                    aria-label="Delete class"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                </DeleteButton>
            )}
        </div>
    );
}

const JoinClassDialog = () => {
    const navigate = useNavigate();
    const invalidate = useInvalidate();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [joining, setJoining] = useState(false);

    const handleJoin = async () => {
        if (!inviteCode.trim()) return toast.error("Enter an invite code.");
        setJoining(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/classes/join`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: inviteCode.trim() }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? "Failed to join class");
            toast.success(`Joined ${json.data.name}${json.data.subjectName ? ` — ${json.data.subjectName}` : ""}.`);
            setOpen(false);
            setInviteCode('');
            invalidate({ resource: "classes", invalidates: ["list"] });
            queryClient.invalidateQueries({ queryKey: ["/classes/enrolled-ids"] });
            navigate(`/classes/show/${json.data.id}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to join class");
        } finally {
            setJoining(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <DoorOpen className="mr-1.5 h-4 w-4" /> Join a Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Join a class</DialogTitle>
                    <DialogDescription>Enter the invite code your teacher gave you.</DialogDescription>
                </DialogHeader>
                <Input
                    placeholder="e.g. 7F3K9Q"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleJoin(); } }}
                    autoFocus
                />
                <DialogFooter>
                    <Button onClick={handleJoin} disabled={joining} className="w-full">
                        {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {joining ? "Joining..." : "Join Class"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ClassesList = () => {
    const { data: identity } = useGetIdentity<User>();
    const { data: portal } = useHistoricalPortal();
    const historical = Boolean(portal?.data.archiveContext);
    const isAdmin = identity?.role === UserRole.PRIMARY_HEADMASTER || identity?.role === UserRole.SECONDARY_HEADMASTER || identity?.role === UserRole.SUPER_ADMIN;
    const headmasterSchoolLevel = identity?.role === UserRole.PRIMARY_HEADMASTER
        ? "primary"
        : identity?.role === UserRole.SECONDARY_HEADMASTER
            ? "secondary"
            : null;
    const isStudent = identity?.role === UserRole.STUDENT;
    const isTeacher = identity?.role === UserRole.TEACHER;
    const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;
    const queryClient = useQueryClient();
    const catalogSelection = useAdminCatalogSelection(isAdmin, headmasterSchoolLevel);
    const superAdminScope = useSuperAdminSchoolScope(isSuperAdmin);
    const [selectedStage, setSelectedStage] = useState<HeadmasterStage | "">("");
    const headmasterCatalogueReady = catalogSelection.ready && (!headmasterSchoolLevel || Boolean(selectedStage));
    const adminCatalogueReady = isSuperAdmin
        ? Boolean(superAdminScope.schoolLevel && superAdminScope.yearId && superAdminScope.stage)
        : headmasterCatalogueReady;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedTeacher, setSelectedTeacher] = useState('all');
    const [joiningId, setJoiningId] = useState<number | null>(null);

    const { data: enrolledIdsData } = useApiQuery<{ data: number[] }>(isStudent ? "/classes/enrolled-ids" : null);
    const enrolledIds = useMemo(() => new Set(enrolledIdsData?.data ?? []), [enrolledIdsData]);

    const handleJoinRow = useCallback(async (classId: number, inviteCode: string | undefined, className: string) => {
        if (!inviteCode) return toast.error("This class has no invite code set.");
        setJoiningId(classId);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/classes/join`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? "Failed to join class");
            const joinedName = json.data?.name ?? className;
            toast.success(`Joined ${joinedName}${json.data?.subjectName ? ` — ${json.data.subjectName}` : ""}.`);
            queryClient.invalidateQueries({ queryKey: ["/classes/enrolled-ids"] });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to join class");
        } finally {
            setJoiningId(null);
        }
    }, [queryClient]);

    const catalogFilters = isSuperAdmin && adminCatalogueReady ? [
        { field: 'schoolLevel', operator: 'eq' as const, value: superAdminScope.schoolLevel },
        { field: 'academicYearId', operator: 'eq' as const, value: superAdminScope.yearId },
        { field: 'stage', operator: 'eq' as const, value: superAdminScope.stage },
    ] : isAdmin && catalogSelection.ready ? [
        { field: 'schoolLevel', operator: 'eq' as const, value: catalogSelection.schoolLevel },
        { field: 'academicYearId', operator: 'eq' as const, value: catalogSelection.academicYearId },
        ...(headmasterSchoolLevel && selectedStage ? [{ field: 'stage', operator: 'eq' as const, value: selectedStage }] : []),
    ] : [];

    const { query: subjectsQuery } = useList<Subject>({
        resource: 'subjects',
        pagination: { pageSize: 100 },
        filters: catalogFilters,
        queryOptions: { enabled: !isAdmin || adminCatalogueReady },
    });

    const { query: teachersQuery } = useList<User>({
        resource: 'teachers',
        pagination: { pageSize: 100 },
        queryOptions: { enabled: isAdmin },
    });

    // Unfiltered class fetch that powers the summary. Separate from the
    // table query so the overview reflects *all* your classes, not the current
    // filtered/paged working set. `total` is exact; the per-status / per-subject
    // tallies are computed from up to 100 rows (same convention this page
    // already uses for the subject/teacher pickers).
    const { query: summaryQuery } = useList<ClassDetails>({
        resource: 'classes',
        pagination: { pageSize: 100 },
        filters: catalogFilters,
        queryOptions: { enabled: !isAdmin || adminCatalogueReady },
    });

    const subjects = subjectsQuery?.data?.data || [];
    const teachers = teachersQuery?.data?.data || [];

    const summaryRows = summaryQuery.data?.data ?? [];
    const summaryLoading = summaryQuery.isLoading;
    const totalClasses = summaryQuery.data?.total ?? 0;
    const activeClasses = summaryRows.filter((c) => c.status === "active").length;
    const subjectsCovered = new Set(summaryRows.map((c) => c.subject?.name).filter(Boolean)).size;

    const subjectFilters = selectedSubject === 'all' ? [] : [
        { field: 'subject', operator: 'eq' as const, value: selectedSubject}
    ];
    const teacherFilters = isStudent || isTeacher || headmasterSchoolLevel || selectedTeacher === 'all' ? [] : [
        { field: 'teacher', operator: 'eq' as const, value: selectedTeacher}
    ];
    const searchFilters = debouncedSearchQuery ? [
        { field: isStudent ? 'subject' : 'name', operator: 'contains' as const, value: debouncedSearchQuery }
    ] : [];

    const hasActiveFilters = !!searchQuery || selectedSubject !== 'all' || (!isStudent && !isTeacher && selectedTeacher !== 'all');
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedSubject('all');
        setSelectedTeacher('all');
    };

    const classColumns = useMemo<ColumnDef<ClassDetails>[]>(() => [
        {
            id: 'name',
            accessorKey: 'name',
            size: 300,
            header: () => <p className="column-title ml-1">Class</p>,
            cell: ({ row }: CellContext<ClassDetails, unknown>) => {
                const c = row.original;
                const secondary = c.courseCode || c.courseName || c.subject?.name;
                return (
                    <div className="ml-1 flex items-center gap-3">
                        <ClassBanner url={c.bannerUrl} name={c.name} />
                        <div className="min-w-0">
                            <Link
                                to={`/classes/show/${c.id}`}
                                className="block truncate font-medium text-foreground hover:underline"
                            >
                                {c.name}
                            </Link>
                            {secondary && (
                                <p className="truncate text-xs text-muted-foreground">{secondary}</p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'subject',
            accessorKey: 'subject.name',
            size: 160,
            header: () => <p className="column-title">Subject</p>,
            cell: ({ getValue }) => {
                const v = getValue<string>();
                return v
                    ? <span className="text-sm text-foreground">{v}</span>
                    : <span className="text-muted-foreground">—</span>;
            },
        },
        ...(!isStudent ? [{
            id: 'teacher',
            accessorKey: 'teacher.name',
            size: 190,
            header: () => <p className="column-title">Teacher</p>,
            cell: ({ row }: CellContext<ClassDetails, unknown>) => {
                const t = row.original.teacher;
                if (!t?.name) return <span className="text-muted-foreground">—</span>;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            {t.image && <AvatarImage src={t.image} alt={t.name} />}
                            <AvatarFallback className="text-[10px]">{getInitials(t.name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm text-foreground">{t.name}</span>
                    </div>
                );
            },
        }] : []),
        {
            id: 'capacity',
            accessorKey: 'capacity',
            size: 110,
            header: () => <p className="column-title">Capacity</p>,
            cell: ({ getValue }) => {
                const n = getValue<number>();
                return n ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {n}
                    </span>
                ) : <span className="text-muted-foreground">—</span>;
            },
        },
        {
            id: 'status',
            accessorKey: 'status',
            size: 120,
            header: () => <p className="column-title">Status</p>,
            cell: ({ getValue }) => <StatusPill status={getValue<string>()} />,
        },
        {
            id: 'actions',
            size: isStudent ? 210 : 96,
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const c = row.original;
                const canEdit = !historical && (isAdmin || identity?.id === c.teacher?.id);

                if (isStudent) {
                    const isEnrolled = enrolledIds.has(c.id);
                    const isJoiningThisRow = joiningId === c.id;
                    return (
                        <div className="flex items-center gap-2">
                            <ShowButton resource="classes" recordItemId={c.id} variant="outline" size="sm">View</ShowButton>
                            {isEnrolled ? (
                                <Badge variant="outline" className="gap-1 text-emerald-700 dark:text-emerald-400">
                                    <Check className="h-3 w-3" /> Enrolled
                                </Badge>
                            ) : (
                                <Button
                                    size="sm"
                                    disabled={joiningId !== null}
                                    onClick={() => handleJoinRow(c.id, c.inviteCode, c.name)}
                                >
                                    {isJoiningThisRow ? (
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <DoorOpen className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    {isJoiningThisRow ? "Joining..." : "Join"}
                                </Button>
                            )}
                        </div>
                    );
                }

                return (
                    <ClassRowActions
                        classId={c.id}
                        canEdit={canEdit}
                        canManage={canEdit}
                        canDelete={isAdmin && !historical}
                    />
                );
            }
        }
    ], [isAdmin, isStudent, historical, identity?.id, enrolledIds, joiningId, handleJoinRow]);

    const classTable = useTable<ClassDetails>({
        columns: classColumns,
        refineCoreProps: {
            resource: 'classes',
            pagination: { pageSize: 10, mode: 'server' },
            filters: {
                permanent: [...catalogFilters, ...subjectFilters, ...teacherFilters, ...searchFilters]
            },
            queryOptions: { enabled: !isAdmin || adminCatalogueReady },
            sorters: {
                initial: [
                    { field: 'id', order: 'desc' },
                ]
            },
        }
    });

    const tableQuery = classTable.refineCore.tableQuery;
    const filteredTotal = tableQuery.data?.total ?? 0;
    const showEmpty = !tableQuery.isLoading && filteredTotal === 0;

    if (isAdmin && identity?.role !== UserRole.SUPER_ADMIN && !headmasterSchoolLevel && selectedTeacher === 'all') {
        return (
            <PageContainer>
                <PageHeader breadcrumb title="Classes" description="Choose a teacher first, then choose the academic year to open that teacher's classes." />
                <div className="max-w-xl space-y-3">
                    <label htmlFor="classes-teacher" className="text-sm font-semibold">1. Teacher</label>
                    {teachersQuery.isLoading ? <Skeleton className="h-11 w-full" /> : teachersQuery.isError ? (
                        <ErrorState description="Unable to load teachers." onRetry={teachersQuery.refetch} />
                    ) : (
                        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                            <SelectTrigger id="classes-teacher" className="h-11 w-full"><SelectValue placeholder="Choose a teacher" /></SelectTrigger>
                            <SelectContent>
                                {teachers.map((teacher) => <SelectItem key={teacher.id} value={teacher.name}>{teacher.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    {!teachersQuery.isLoading && !teachersQuery.isError && teachers.length === 0 && <p className="text-sm text-muted-foreground">No teachers are available for this school.</p>}
                </div>
            </PageContainer>
        );
    }

    if (isSuperAdmin && !adminCatalogueReady) {
        return (
            <PageContainer>
                <PageHeader breadcrumb title="Classes" description="Choose a school, class or form, then an academic year to open its class directory." />
                <div className="flex flex-col gap-4">
                    <SchoolCardSelector
                        value={superAdminScope.schoolLevel}
                        onChange={(level) => { superAdminScope.setSchoolLevel(level); superAdminScope.setYearId(""); superAdminScope.setStage(""); }}
                    />
                    {superAdminScope.schoolLevel && <HeadmasterStageSelector
                        role={superAdminScope.schoolLevel === "primary" ? UserRole.PRIMARY_HEADMASTER : UserRole.SECONDARY_HEADMASTER}
                        value={superAdminScope.stage}
                        onChange={(stage) => { superAdminScope.setStage(stage); superAdminScope.setYearId(""); }}
                        title={superAdminScope.schoolLevel === "primary" ? "2. Choose a class" : "2. Choose a form"}
                        description="Choose the class or form whose class directory you want to open."
                    />}
                    {superAdminScope.schoolLevel && superAdminScope.stage && <div className="max-w-xl space-y-2">
                        <label htmlFor="super-admin-classes-year" className="text-sm font-semibold">3. Academic year</label>
                        {superAdminScope.yearsLoading ? <Skeleton className="h-11 w-full" /> : superAdminScope.yearsError ? (
                            <ErrorState description="Unable to load academic years." onRetry={superAdminScope.retryYears} />
                        ) : (
                            <Select value={superAdminScope.yearId} onValueChange={superAdminScope.setYearId}>
                                <SelectTrigger id="super-admin-classes-year" className="h-11 w-full"><SelectValue placeholder="Choose an academic year" /></SelectTrigger>
                                <SelectContent>{superAdminScope.years.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " · Current" : ""}</SelectItem>)}</SelectContent>
                            </Select>
                        )}
                    </div>}
                </div>
            </PageContainer>
        );
    }

    if (isAdmin && !isSuperAdmin && !headmasterCatalogueReady) {
        return (
            <PageContainer>
                <PageHeader breadcrumb title="Classes" description={headmasterSchoolLevel ? `Choose a class or form and academic year to open the ${headmasterSchoolLevel} class directory.` : "Choose a school level and academic year to open the class directory."} />
                {headmasterSchoolLevel && identity?.role && (
                    <HeadmasterStageSelector
                        role={identity.role}
                        value={selectedStage}
                        onChange={setSelectedStage}
                        title="Choose a class or form"
                        description="Select the class or form whose classes you want to view."
                    />
                )}
                <AdminCatalogSelector
                    schoolLevel={catalogSelection.schoolLevel}
                    academicYearId={catalogSelection.academicYearId}
                    academicYears={catalogSelection.academicYears}
                    yearsLoading={catalogSelection.yearsLoading}
                    yearsError={catalogSelection.yearsError}
                    onSchoolLevelChange={catalogSelection.selectSchoolLevel}
                    onAcademicYearChange={catalogSelection.selectAcademicYear}
                    onRetryYears={catalogSelection.retryYears}
                    showSchoolLevel={!headmasterSchoolLevel}
                />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                breadcrumb
                title={isStudent ? "Class & Subjects" : "Classes"}
                description={isStudent ? "Open your learning spaces or join a class using a teacher-provided code." : "Manage class rosters, teaching responsibilities, subjects, and academic workspaces."}
                actions={isAdmin && !isSuperAdmin && catalogSelection.ready
                        ? <Button variant="outline" size="sm" onClick={() => { setSelectedStage(""); catalogSelection.resetSelection(); }}>Change catalogue</Button>
                        : undefined}
            />

            {isSuperAdmin && <div className="flex flex-col gap-4">
                <SchoolCardSelector
                    value={superAdminScope.schoolLevel}
                    onChange={(level) => { superAdminScope.setSchoolLevel(level); superAdminScope.setYearId(""); superAdminScope.setStage(""); }}
                />
                {superAdminScope.schoolLevel && <HeadmasterStageSelector
                    role={superAdminScope.schoolLevel === "primary" ? UserRole.PRIMARY_HEADMASTER : UserRole.SECONDARY_HEADMASTER}
                    value={superAdminScope.stage}
                    onChange={(stage) => { superAdminScope.setStage(stage); superAdminScope.setYearId(""); }}
                    title={superAdminScope.schoolLevel === "primary" ? "2. Choose a class" : "2. Choose a form"}
                    description="Choose the class or form whose class directory you want to open."
                />}
                {superAdminScope.schoolLevel && superAdminScope.stage && <div className="max-w-xl space-y-2">
                    <label htmlFor="super-admin-classes-year" className="text-sm font-semibold">3. Academic year</label>
                    {superAdminScope.yearsLoading ? <Skeleton className="h-11 w-full" /> : superAdminScope.yearsError ? (
                        <ErrorState description="Unable to load academic years." onRetry={superAdminScope.retryYears} />
                    ) : (
                    <Select value={superAdminScope.yearId} onValueChange={superAdminScope.setYearId}>
                            <SelectTrigger id="super-admin-classes-year" className="h-11 w-full"><SelectValue placeholder="Choose an academic year" /></SelectTrigger>
                            <SelectContent>{superAdminScope.years.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " · Current" : ""}</SelectItem>)}</SelectContent>
                        </Select>
                    )}
                </div>}
            </div>}

            <p className="text-sm text-muted-foreground">
                {!isStudent && !isTeacher && <><span>Total classes: <span className="font-semibold text-foreground">{summaryLoading ? "..." : totalClasses}</span></span>{" || "}</>}
                <span>Active classes: <span className="font-semibold text-foreground">{summaryLoading ? "..." : activeClasses}</span></span>
                {" || "}
                <span>Subjects covered: <span className="font-semibold text-foreground">{summaryLoading ? "..." : subjectsCovered}</span></span>
            </p>

            <section aria-labelledby="class-directory-title" className="space-y-4">
                <SectionHeader
                    title={<span id="class-directory-title">{isStudent ? "Subject catalogue" : "Class directory"}</span>}
                    description={isStudent ? "Search subjects and open the class learning space attached to each one." : "Find a class, then open its operational workspace."}
                />
                <FilterBar
                    search={<SearchInput
                        placeholder={isStudent ? "Search subjects" : "Search classes"}
                        aria-label={isStudent ? "Search subjects" : "Search classes"}
                        value={searchQuery}
                        onChange={setSearchQuery}
                        loading={tableQuery.isFetching}
                    />}
                    active={hasActiveFilters}
                    onClear={clearFilters}
                    trailing={isStudent ? <JoinClassDialog /> : historical ? undefined : <CreateButton resource="classes" />}
                >

                    {!isStudent && <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger className="h-10 w-full sm:w-[180px]" aria-label="Filter by subject">
                            <SelectValue placeholder="All subjects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All subjects</SelectItem>
                            {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>}

                    {!isStudent && !isTeacher && !headmasterSchoolLevel && <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                        <SelectTrigger className="h-10 w-full sm:w-[180px]" aria-label="Filter by teacher">
                            <SelectValue placeholder="All teachers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All teachers</SelectItem>
                            {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.name}>{teacher.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>}

                </FilterBar>

                <p className="text-xs text-muted-foreground" aria-live="polite">
                    {tableQuery.isLoading
                        ? "Loading classes…"
                        : hasActiveFilters
                            ? `${filteredTotal} ${filteredTotal === 1 ? (isStudent ? "subject matches" : "class matches") : (isStudent ? "subjects match" : "classes match")} your filters`
                            : `${filteredTotal} ${filteredTotal === 1 ? "class" : "classes"}`}
                </p>
            </section>

            {/* Table / empty states */}
            {tableQuery.isError ? (
                <ErrorState
                    description="Unable to load classes. Check your connection and try again."
                    onRetry={tableQuery.refetch}
                />
            ) : showEmpty ? (
                hasActiveFilters ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-6 py-12 text-center">
                        <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <School className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">No classes match your filters</p>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Try a different search term, subject, or teacher.
                        </p>
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <EmptyState
                        icon={GraduationCap}
                        title="No classes yet"
                        description={
                            isStudent
                                ? "There are no classes in the catalog yet. Check back soon, or join one with an invite code."
                                : historical ? "No classes were saved for this previous-year selection." : "Create your first class to start managing subjects, teachers, and enrollment."
                        }
                        action={isStudent || historical ? undefined : { label: "Create Class", to: "/classes/create" }}
                    />
                )
            ) : (
                <div className="w-full overflow-x-auto">
                    <div className="min-w-[860px] lg:min-w-0">
                        <DataTable table={classTable} />
                    </div>
                </div>
            )}
        </PageContainer>
    )
}

export default ClassesList
