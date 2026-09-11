import { useState } from "react";
import { Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_BASE_URL } from "@/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";

type Enquiry = { id: number; fullName: string; email: string; phone: string | null; childStage: string; message: string | null; consent: boolean; status: "new" | "in_progress" | "closed"; createdAt: string };
const stageLabel: Record<string, string> = { nursery: "Nursery", kindergarten: "Kindergarten", primary: "Primary", secondary: "Secondary", not_sure: "Not sure" };

export default function AdmissionsEnquiries() {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Enquiry[] }>("/admissions/enquiries");
  const [savingId, setSavingId] = useState<number | null>(null);
  const updateStatus = async (id: number, status: Enquiry["status"]) => { setSavingId(id); try { const response = await fetch(`${BACKEND_BASE_URL}/admissions/enquiries/${id}/status`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not update enquiry."); toast.success("Enquiry status updated."); await refetch(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update enquiry."); } finally { setSavingId(null); } };
  const enquiries = data?.data ?? [];
  return <div className="space-y-6"><PageHeader breadcrumb title="Admissions Enquiries" description="Private family contact details submitted from the public admissions page. Limit access to authorised admissions staff." />{isLoading ? <Card className="p-5"><Skeleton className="h-64 w-full" /></Card> : isError ? <ErrorState title="Can’t load enquiries" description="Check your connection and permissions, then retry." onRetry={refetch} /> : enquiries.length === 0 ? <EmptyState icon={Inbox} title="No admissions enquiries" description="New public enquiries will appear here." /> : <Card className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Received</TableHead><TableHead>Family contact</TableHead><TableHead>Stage</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{enquiries.map((enquiry) => <TableRow key={enquiry.id}><TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(enquiry.createdAt).toLocaleDateString()}</TableCell><TableCell><p className="font-medium">{enquiry.fullName}</p><a className="text-sm text-primary underline-offset-2 hover:underline" href={`mailto:${enquiry.email}`}>{enquiry.email}</a>{enquiry.phone && <p className="text-xs text-muted-foreground">{enquiry.phone}</p>}</TableCell><TableCell>{stageLabel[enquiry.childStage] ?? enquiry.childStage}</TableCell><TableCell className="min-w-56 max-w-sm whitespace-pre-wrap text-sm text-muted-foreground">{enquiry.message || "—"}</TableCell><TableCell><div className="flex items-center gap-2"><Select value={enquiry.status} onValueChange={(status: Enquiry["status"]) => updateStatus(enquiry.id, status)} disabled={savingId === enquiry.id}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select>{savingId === enquiry.id && <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" />}</div></TableCell></TableRow>)}</TableBody></Table></Card>}</div>;
}
