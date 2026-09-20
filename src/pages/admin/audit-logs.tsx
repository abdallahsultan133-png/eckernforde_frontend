import { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useNavigate } from "react-router";
import { Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User } from "@/types";

type AuditLog = {
    id: number;
    action: string;
    resource: string;
    resourceId: string | null;
    details: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string } | null;
};

const actionTone = (action: string): StatusTone => {
    if (action.includes("create") || action.includes("enroll")) return "success";
    if (action.includes("delete")) return "critical";
    if (action.includes("update") || action.includes("grade")) return "info";
    return "neutral";
};

const AuditLogsPage = () => {
    const { data: identity } = useGetIdentity<User>();
    const navigate = useNavigate();
    const [limit, setLimit] = useState("50");

    useEffect(() => {
        if (identity && identity.role !== UserRole.ADMIN && identity.role !== UserRole.SUPER_ADMIN) {
            navigate("/unauthorized");
        }
    }, [identity, navigate]);

    const { data, isLoading: loading, isError, refetch } = useApiQuery<{ data: AuditLog[] }>(`/audit-logs?limit=${limit}`);
    const logs = data?.data ?? [];

    return (
        <PageContainer className="audit-logs">
            <PageHeader
                breadcrumb
                title={
                    <span className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        Audit Logs
                    </span>
                }
                description="A read-only record of administrative changes, the affected resource, actor, and time."
                actions={
                    <Select value={limit} onValueChange={setLimit}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="25">Last 25</SelectItem>
                            <SelectItem value="50">Last 50</SelectItem>
                            <SelectItem value="100">Last 100</SelectItem>
                            <SelectItem value="200">Last 200</SelectItem>
                        </SelectContent>
                    </Select>
                }
            />

            {loading ? (
                <div className="space-y-3 border-y border-border p-4" aria-busy="true">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            ) : isError ? (
                <ErrorState description="Couldn't load the audit log." onRetry={refetch} />
            ) : logs.length === 0 ? (
                <EmptyState icon={Shield} title="No audit logs yet" description="Administrative actions across the school will be recorded here." />
            ) : (
                <div className="overflow-x-auto border-y border-border bg-card sm:rounded-lg sm:border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Resource</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <StatusBadge tone={actionTone(log.action)}>{log.action}</StatusBadge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <span className="font-medium">{log.resource}</span>
                                        {log.resourceId && <span className="text-muted-foreground"> #{log.resourceId}</span>}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {log.user ? (
                                            <div>
                                                <p className="font-medium">{log.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{log.user.email}</p>
                                            </div>
                                        ) : <span className="text-muted-foreground">System</span>}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.details ?? "—"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </PageContainer>
    );
};

export default AuditLogsPage;
