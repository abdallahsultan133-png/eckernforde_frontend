import {PageHeader} from "@/components/layout/page-header.tsx";
import {PageContainer} from "@/components/layout/page-container.tsx";
import {FilterBar} from "@/components/ui/filter-bar.tsx";
import {SearchInput} from "@/components/ui/search-input.tsx";
import {useMemo, useState} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {CreateButton} from "@/components/refine-ui/buttons/create.tsx";
import {DataTable} from "@/components/refine-ui/data-table/data-table.tsx";
import {useTable} from "@refinedev/react-table";
import {Subject, UserRole, type User} from "@/types";
import {ColumnDef} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge.tsx";
import {useGetIdentity} from "@refinedev/core";
import {EditButton} from "@/components/refine-ui/buttons/edit.tsx";
import {DeleteButton} from "@/components/refine-ui/buttons/delete.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useDebouncedValue} from "@/hooks/use-debounced-value.ts";
import {AdminCatalogSelector, useAdminCatalogSelection} from "@/components/academic/admin-catalog-selector.tsx";
import {HeadmasterStageSelector, type HeadmasterStage} from "@/components/academic/headmaster-stage-selector.tsx";
import {useSuperAdminSchoolScope} from "@/components/academic/super-admin-school-scope.tsx";
import {SchoolCardSelector} from "@/components/academic/school-level-selector.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {ErrorState} from "@/components/ui/error-state.tsx";
import {useHistoricalPortal} from "@/components/layout/historical-portal-banner";
import {useApiQuery} from "@/hooks/use-api-query.ts";

const SubjectsList = () => {
    const { data: identity } = useGetIdentity<User>();
    const { data: portal } = useHistoricalPortal();
    const historical = Boolean(portal?.data.archiveContext);
    const isAdmin = identity?.role === UserRole.PRIMARY_HEADMASTER || identity?.role === UserRole.SECONDARY_HEADMASTER || identity?.role === UserRole.SUPER_ADMIN;
    const headmasterSchoolLevel = identity?.role === UserRole.PRIMARY_HEADMASTER
        ? "primary"
        : identity?.role === UserRole.SECONDARY_HEADMASTER
            ? "secondary"
            : null;
    const canDelete = isAdmin && !historical;
    const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;
    const catalogSelection = useAdminCatalogSelection(isAdmin, headmasterSchoolLevel);
    const superAdminScope = useSuperAdminSchoolScope(isSuperAdmin);
    const [selectedStage, setSelectedStage] = useState<HeadmasterStage | "">("");
    const needsStage = Boolean(headmasterSchoolLevel);
    const headmasterCatalogueReady = isSuperAdmin
        ? Boolean(superAdminScope.schoolLevel && superAdminScope.yearId && superAdminScope.stage)
        : catalogSelection.ready && (!needsStage || Boolean(selectedStage));

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const {data: departmentsData} = useApiQuery<{data: Array<{id: number; name: string}>}>('/departments');
    const departments = departmentsData?.data ?? [];

    const departmentFilters = selectedDepartment === 'all' ? [] : [
        { field: 'department', operator: 'eq' as const, value: selectedDepartment}
    ];
    const searchFilters = debouncedSearchQuery ? [
        { field: 'name', operator: 'contains' as const, value: debouncedSearchQuery }
    ] : [];
    const catalogFilters = isSuperAdmin && headmasterCatalogueReady ? [
        { field: 'schoolLevel', operator: 'eq' as const, value: superAdminScope.schoolLevel },
        { field: 'academicYearId', operator: 'eq' as const, value: superAdminScope.yearId },
        { field: 'stage', operator: 'eq' as const, value: superAdminScope.stage },
    ] : isAdmin && catalogSelection.ready ? [
        { field: 'schoolLevel', operator: 'eq' as const, value: catalogSelection.schoolLevel },
        { field: 'academicYearId', operator: 'eq' as const, value: catalogSelection.academicYearId },
        ...(needsStage && selectedStage ? [{ field: 'stage', operator: 'eq' as const, value: selectedStage }] : []),
    ] : [];

    const subjectColumns = useMemo<ColumnDef<Subject>[]>(() => [
        {
            id: 'name',
            accessorKey: 'name',
            size: 200,
            header: () => <p className="column-title">Name</p>,
            cell: ({ getValue }) => <span className="text-foreground">{getValue<string>()}</span>,
            filterFn: 'includesString'
        },
        {
            id: 'department',
            accessorKey: 'department.name',
            size: 150,
            header: () => <p className="column-title">Department</p>,
            cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge>,
        },
        {
            id: 'description',
            accessorKey: 'description',
            size: 300,
            header: () => <p className="column-title">Description</p>,
            cell: ({ getValue }) => <span className="truncate line-clamp-2">{getValue<string>()}</span>,
        },
        {
            id: 'actions',
            size: 160,
            header: () => <p className="column-title">Actions</p>,
            cell: ({ row }) => {
                // A teacher may only edit the subject they themselves created —
                // not just any subject a teacher happens to have made.
                const canEditRow = !historical && (isAdmin || (identity?.role === UserRole.TEACHER && identity?.id === row.original.createdBy));
                return (
                    <div className="flex gap-2">
                        {canEditRow && <EditButton resource="subjects" recordItemId={row.original.id} variant="outline" size="sm">Edit</EditButton>}
                        {canDelete && <DeleteButton resource="subjects" recordItemId={row.original.id} size="sm">Delete</DeleteButton>}
                    </div>
                );
            }
        }
    ], [isAdmin, canDelete, historical, identity?.role, identity?.id]);

    const subjectTable = useTable<Subject>({
        columns: subjectColumns,
        refineCoreProps: {
            resource: 'subjects',
            pagination: { pageSize: 10, mode: 'server' },
            filters: {
                permanent: [...catalogFilters, ...departmentFilters, ...searchFilters]
            },
            queryOptions: { enabled: !isAdmin || headmasterCatalogueReady },
            sorters: {
                initial: [
                    { field: 'id', order: 'desc' },
                ]
            },
        }
    });

    const totalSubjects = subjectTable.refineCore.tableQuery.data?.total ?? 0;
    const subjectsQuery = subjectTable.refineCore.tableQuery;

    return (
        <PageContainer className="subject-directory">
            <PageHeader
                breadcrumb
                title="Subjects"
                description={headmasterSchoolLevel ? `Browse the ${headmasterSchoolLevel} subject catalogue by academic year.` : isSuperAdmin ? "Choose a school, class or form, then an academic year to open its subject catalogue." : "Browse the subject catalogue, review subject details, and manage the subjects used in classes."}
                actions={<div className="flex items-center gap-2">
                    {isAdmin && !isSuperAdmin && catalogSelection.ready && <Button variant="outline" size="sm" onClick={() => { setSelectedStage(""); catalogSelection.resetSelection(); }}>Change catalogue</Button>}
                    {!historical && (!isAdmin || headmasterCatalogueReady) && <CreateButton resource="subjects" />}
                </div>}
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
                    description="Choose the class or form whose subjects you want to view."
                />}
                {superAdminScope.schoolLevel && superAdminScope.stage && <div className="max-w-xl space-y-2">
                    <label htmlFor="super-admin-subjects-year" className="text-sm font-semibold">3. Academic year</label>
                    {superAdminScope.yearsLoading ? <Skeleton className="h-11 w-full" /> : superAdminScope.yearsError ? (
                        <ErrorState description="Unable to load academic years." onRetry={superAdminScope.retryYears} />
                    ) : superAdminScope.years.length === 0 ? (
                        <p className="border px-3 py-2 text-sm text-muted-foreground">No academic years are available.</p>
                    ) : (
                        <Select value={superAdminScope.yearId} onValueChange={superAdminScope.setYearId}>
                            <SelectTrigger id="super-admin-subjects-year" className="h-11 w-full"><SelectValue placeholder="Choose an academic year" /></SelectTrigger>
                            <SelectContent>{superAdminScope.years.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " · Current" : ""}</SelectItem>)}</SelectContent>
                        </Select>
                    )}
                </div>}
            </div>}

            {isAdmin && !isSuperAdmin && !headmasterCatalogueReady ? (
                <>
                    {headmasterSchoolLevel && identity?.role && (
                        <HeadmasterStageSelector
                            role={identity.role}
                            value={selectedStage}
                            onChange={setSelectedStage}
                            title="Choose a class or form"
                            description="Select the class or form whose subjects you want to view."
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
                </>
            ) : (!isAdmin || headmasterCatalogueReady) && <section className="space-y-4">
                <FilterBar
                    search={
                        <SearchInput
                            placeholder="Search subjects"
                            aria-label="Search subjects by name"
                            value={searchQuery}
                            onChange={setSearchQuery}
                            loading={subjectTable.refineCore.tableQuery.isFetching}
                        />
                    }
                    active={Boolean(searchQuery || selectedDepartment !== "all")}
                    onClear={() => { setSearchQuery(""); setSelectedDepartment("all"); }}
                    resultLabel={subjectsQuery.isLoading ? "Loading subjects…" : `${totalSubjects.toLocaleString()} ${totalSubjects === 1 ? "subject" : "subjects"} in this view`}
                >
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="h-10 w-full sm:w-[200px]" aria-label="Filter subjects by department">
                                <SelectValue placeholder="Filter by department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(department => (
                                    <SelectItem key={department.id} value={department.name}>
                                        {department.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                </FilterBar>
                <DataTable
                    table={subjectTable}
                    ariaLabel="Subjects"
                    emptyTitle="No subjects found"
                    emptyDescription={searchQuery || selectedDepartment !== "all" ? "Try clearing or changing the current filters." : historical ? "No subjects were saved for this previous-year selection." : "Create a subject to begin."}
                />
            </section>}
        </PageContainer>
    )
}

export default SubjectsList
