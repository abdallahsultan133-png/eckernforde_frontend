import { useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_BASE_URL } from "@/constants";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";

type Event = { id: number; title: string; startAt: string; classId: number | null; isPublic: boolean; source: "manual" | "exam" | "assignment" };

export default function PublicEvents() {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10);
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Event[] }>(`/calendar?from=${from}&to=${to}`);
  const [savingId, setSavingId] = useState<number | null>(null);
  const events = (data?.data ?? []).filter((event) => event.source === "manual" && event.classId === null);
  const publish = async (event: Event, isPublic: boolean) => {
    setSavingId(event.id);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/calendar/${event.id}/publication`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic }) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not update event publication.");
      toast.success(isPublic ? "Event published to the public website." : "Event removed from the public website.");
      await refetch();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update event publication."); }
    finally { setSavingId(null); }
  };
  return <PageContainer>
    <PageHeader breadcrumb title="Public events" description="Approve future school-wide events for the public website. Class, exam and assignment events remain private." />
    {isError ? <ErrorState title="Unable to load events" description="Try again shortly." onRetry={refetch} />
      : isLoading ? <div className="space-y-2 rounded-lg border p-4" aria-busy="true">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
      : events.length === 0 ? <EmptyState icon={CalendarDays} title="No future school-wide events" description="Create a school-wide calendar event first; it can then be reviewed here." />
      : <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Date</TableHead><TableHead className="text-center">Public website</TableHead></TableRow></TableHeader><TableBody>{events.map((event) => <TableRow key={event.id}><TableCell className="font-medium">{event.title}</TableCell><TableCell className="text-muted-foreground">{new Date(event.startAt).toLocaleDateString()}</TableCell><TableCell><div className="flex justify-center gap-2"><Switch aria-label={`Publish ${event.title} on public website`} checked={event.isPublic} disabled={savingId === event.id} onCheckedChange={(value) => publish(event, value)} />{savingId === event.id && <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" />}</div></TableCell></TableRow>)}</TableBody></Table></div>}
  </PageContainer>;
}
