import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type RecoveryRequest = {
  id: number;
  email: string;
  status: string;
  requestedAt: string;
  user: { id: string; name: string; email: string; role: string } | null;
};
type RecoveryResponse = { data: RecoveryRequest[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

type TemporaryPassword = { name: string; email: string; password: string };

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  parent: "Parent",
  primary_headmaster: "Primary Headmaster",
  secondary_headmaster: "Secondary Headmaster",
  super_admin: "Super Admin",
};

export default function PasswordRecoveryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState("100");
  const { data, isLoading, isError, refetch } = useApiQuery<RecoveryResponse>(`/password-reset-requests?limit=${limit}&page=${page}`);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<TemporaryPassword | null>(null);
  const [copied, setCopied] = useState(false);
  const requests = data?.data ?? [];

  const generatePassword = async (request: RecoveryRequest) => {
    setWorkingId(request.id);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/password-reset-requests/${request.id}/temporary-password`, {
        method: "POST",
        credentials: "include",
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error ?? "Failed to generate temporary password");
      setTemporaryPassword({ name: json.data.name, email: json.data.email, password: json.data.temporaryPassword });
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate temporary password");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        breadcrumb
        showBackLink={false}
        title="Password Recovery"
        description="Review account recovery requests and provide a one-time temporary password when needed."
        actions={<Select value={limit} onValueChange={(value) => { setLimit(value); setPage(1); }}>
          <SelectTrigger className="w-36" aria-label="Number of recovery requests to show"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="50">Last 50</SelectItem>
            <SelectItem value="100">Last 100</SelectItem>
            <SelectItem value="150">Last 150</SelectItem>
            <SelectItem value="200">Last 200</SelectItem>
          </SelectContent>
        </Select>}
      />

      {isLoading ? (
        <div className="space-y-3 border-y border-border p-4" aria-busy="true">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
        </div>
      ) : isError ? (
        <ErrorState title="Unable to load password recovery requests" description="Try again shortly." onRetry={refetch} />
      ) : requests.length === 0 ? (
        <EmptyState icon={KeyRound} title="No recovery requests" description="New password recovery requests will appear here." />
      ) : (
        <>
          <div className="overflow-x-auto border-y border-border bg-card sm:rounded-lg sm:border">
            <Table aria-label="Password recovery requests">
              <TableHeader><TableRow>
                <TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>User role</TableHead><TableHead>Requested</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>{requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.user?.name ?? "Account unavailable"}</TableCell>
                  <TableCell className="text-muted-foreground">{request.user?.email ?? request.email}</TableCell>
                  <TableCell>{request.user ? ROLE_LABELS[request.user.role] ?? request.user.role.replaceAll("_", " ") : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(request.requestedAt).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{request.status.replaceAll("_", " ")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" disabled={!request.user || request.status !== "pending" || workingId === request.id} onClick={() => void generatePassword(request)}>
                      <KeyRound className="mr-1.5 h-4 w-4" />{request.status === "pending" ? "Generate temporary password" : "Handled"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
          {data?.pagination && <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Showing {data.pagination.total === 0 ? 0 : (page - 1) * data.pagination.limit + 1}–{Math.min(page * data.pagination.limit, data.pagination.total)} of {data.pagination.total.toLocaleString()} recovery requests</p>
            {data.pagination.totalPages > 1 && <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages || isLoading} onClick={() => setPage((value) => value + 1)}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>}
          </div>}
        </>
      )}

      <Dialog open={!!temporaryPassword} onOpenChange={(open) => { if (!open) { setTemporaryPassword(null); setCopied(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary password for {temporaryPassword?.name}</DialogTitle>
            <DialogDescription>Give this one-time password to {temporaryPassword?.name}. It will not be shown again.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <code className="flex-1 select-all break-all font-mono text-sm">{temporaryPassword?.password}</code>
            <Button variant="outline" size="sm" aria-label="Copy temporary password" onClick={async () => {
              if (!temporaryPassword) return;
              try { await navigator.clipboard.writeText(temporaryPassword.password); setCopied(true); }
              catch { toast.error("Could not copy. Select and copy the password manually."); }
            }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
          </div>
          <DialogFooter><Button onClick={() => { setTemporaryPassword(null); setCopied(false); }}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
