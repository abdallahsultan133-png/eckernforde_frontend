import { useState } from "react";
import { Globe2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_BASE_URL } from "@/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
type Announcement = { id: number; title: string; content: string; classId: number | null; isPublic: boolean; createdAt: string };
export default function Publications() {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Announcement[] }>("/announcements");
  const [savingId, setSavingId] = useState<number | null>(null);
  const items = (data?.data ?? []).filter((item) => item.classId === null);
  const publish = async (item: Announcement, isPublic: boolean) => { setSavingId(item.id); try { const response = await fetch(`${BACKEND_BASE_URL}/announcements/${item.id}/publication`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic }) }); if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not update publication."); toast.success(isPublic ? "Published to the public website." : "Removed from the public website."); await refetch(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update publication."); } finally { setSavingId(null); } };
  return <div className="space-y-6"><PageHeader breadcrumb title="Publications" description="Approve school-wide news for the public website. Class and portal announcements cannot be published here." />{isError ? <ErrorState title="Can’t load announcements" description="Try again shortly." onRetry={refetch} /> : isLoading ? <Card className="h-56 animate-pulse" /> : items.length === 0 ? <EmptyState icon={Globe2} title="No school-wide announcements" description="Create a school-wide announcement first; it can then be reviewed for public publication." /> : <Card className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Announcement</TableHead><TableHead>Created</TableHead><TableHead className="text-center">Public website</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell><p className="font-medium">{item.title}</p><p className="mt-1 max-w-xl truncate text-sm text-muted-foreground">{item.content}</p></TableCell><TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</TableCell><TableCell><div className="flex justify-center gap-2"><Switch aria-label={`Publish ${item.title} on public website`} checked={item.isPublic} disabled={savingId === item.id} onCheckedChange={(value) => publish(item, value)} />{savingId === item.id && <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" />}</div></TableCell></TableRow>)}</TableBody></Table></Card>}</div>;
}
