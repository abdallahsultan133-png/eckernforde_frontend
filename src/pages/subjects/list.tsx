import {ListView} from "@/components/refine-ui/views/list-view.tsx";
import {PageHeader} from "@/components/layout/page-header.tsx";
import {SearchInput} from "@/components/ui/search-input.tsx";
import {useMemo, useState} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {DEPARTMENT_OPTIONS} from "@/constants";
import {CreateButton} from "@/components/refine-ui/buttons/create.tsx";
import {DataTable} from "@/components/refine-ui/data-table/data-table.tsx";
import {useTable} from "@refinedev/react-table";
import {Subject, UserRole, type User} from "@/types";
import {ColumnDef} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge.tsx";
import {useGetIdentity} from "@refinedev/core";
import {EditButton} from "@/components/refine-ui/buttons/edit.tsx";
import {DeleteButton} from "@/components/refine-ui/buttons/delete.tsx";
import {useDebouncedValue} from "@/hooks/use-debounced-value.ts";

const SubjectsList = () => {
    const { data: identity } = useGetIdentity<User>();
    const isAdmin = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
    const canDelete = isAdmin;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const departmentFilters = selectedDepartment === 'all' ? [] : [
        { field: 'department', operator: 'eq' as const, value: selectedDepartment}
    ];
    const searchFilters = debouncedSearchQuery ? [
        { field: 'name', operator: 'contains' as const, value: debouncedSearchQuery }
    ] : [];

    const subjectColumns = useMemo<ColumnDef<Subject>[]>(() => [
        {
            id: 'code',
            accessorKey: 'code',
            size: 100,
            header: () => <p className="column-title ml-2">Code</p>,
            cell: ({ getValue }) => <Badge>{getValue<string>()}</Badge>
        },
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
                const canEditRow = isAdmin || (identity?.role === UserRole.TEACHER && identity?.id === row.original.createdBy);
                return (
                    <div className="flex gap-2">
                        {canEditRow && <EditButton resource="subjects" recordItemId={row.original.id} variant="outline" size="sm">Edit</EditButton>}
                        {canDelete && <DeleteButton resource="subjects" recordItemId={row.original.id} size="sm">Delete</DeleteButton>}
                    </div>
                );
            }
        }
    ], [isAdmin, canDelete, identity?.role, identity?.id]);

    const subjectTable = useTable<Subject>({
        columns: subjectColumns,
        refineCoreProps: {
            resource: 'subjects',
            pagination: { pageSize: 10, mode: 'server' },
            filters: {
                permanent: [...departmentFilters, ...searchFilters]
            },
            sorters: {
                initial: [
                    { field: 'id', order: 'desc' },
                ]
            },
        }
    });

    return (
        <ListView>
            <PageHeader
                breadcrumb
                title="Subjects"
                description="Browse subjects, filter by department, and manage the catalogue."
                actions={
                    <>
                        <SearchInput
                            placeholder="Search by name..."
                            aria-label="Search subjects by name"
                            containerClassName="w-full sm:max-w-56"
                            value={searchQuery}
                            onChange={setSearchQuery}
                            loading={subjectTable.refineCore.tableQuery.isFetching}
                        />
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {DEPARTMENT_OPTIONS.map(department => (
                                    <SelectItem key={department.value} value={department.value}>
                                        {department.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <CreateButton />
                    </>
                }
            />

            <DataTable table={subjectTable} />
        </ListView>
    )
}

export default SubjectsList
