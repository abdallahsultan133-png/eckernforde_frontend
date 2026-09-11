import { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useNavigate } from "react-router";
import { Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
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

const actionColor = (action: string) => {
    if (action.includes("create")) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    if (action.includes("delete")) return "bg-red-500/10 text-red-700 dark:text-red-300";
    if (action.includes("update") || action.includes("grade")) return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    if (action.includes("enroll")) return "bg-violet-500/10 text-violet-700 dark:text-violet-300";
    return "bg-muted text-muted-foreground";
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
        <div className="audit-logs space-y-6">
            <PageHeader
                breadcrumb
                title={
                    <span className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        Audit Logs
                    </span>
                }
                description="System activity log. Admin only."
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
                <Card className="space-y-3 p-4">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </Card>
            ) : isError ? (
                <ErrorState description="Couldn't load the audit log." onRetry={refetch} />
            ) : logs.length === 0 ? (
                <EmptyState icon={Shield} title="No audit logs yet" description="Administrative actions across the school will be recorded here." />
            ) : (
                <Card className="overflow-x-auto">
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
                                        <Badge className={actionColor(log.action)}>{log.action}</Badge>
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
                </Card>
            )}
        </div>
    );
};

export default AuditLogsPage;
