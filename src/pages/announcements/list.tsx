import { useState } from "react";
import { Link } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { toast } from "sonner";
import { Megaphone, Pin, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { StatusBadge } from "@/components/ui/status-badge.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { timeAgo } from "@/lib/time.ts";
import { cn } from "@/lib/utils.ts";
import type { User } from "@/types";

type AnnouncementItem = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  class: { id: number; name: string } | null;
  author: { id: string; name: string; image: string | null };
};

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const AnnouncementsList = () => {
  const { data: identity } = useGetIdentity<User>();
  const isTeacherOrAdmin = identity?.role === "teacher" || identity?.role === "admin" || identity?.role === "super_admin";

  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AnnouncementItem[] }>("/announcements");
  const items = data?.data ?? [];
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/announcements/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to delete");
      toast.success("Announcement deleted.");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete announcement");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="announcements-list space-y-6">
      <PageHeader
        breadcrumb
        title="Announcements"
        description="School-wide and class updates, pinned first."
        actions={
          isTeacherOrAdmin && (
            <Button asChild>
              <Link to="/announcements/create">
                <Plus className="mr-1.5 h-4 w-4" />
                New Announcement
              </Link>
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : isError ? (
        <ErrorState description="Couldn't load announcements." onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description={
            isTeacherOrAdmin
              ? "Post an update to reach a class or the whole school."
              : "Updates from your teachers and school will show up here."
          }
          action={isTeacherOrAdmin ? { label: "New announcement", to: "/announcements/create" } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Card
              key={a.id}
              className={cn(
                "p-5",
                a.pinned && "border-amber-500/40 bg-amber-500/5",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    {a.author.image && <AvatarImage src={a.author.image} />}
                    <AvatarFallback>{getInitials(a.author.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold leading-snug">{a.title}</h3>
                      {a.pinned && (
                        <StatusBadge tone="warning" icon={<Pin className="h-3 w-3" />}>
                          Pinned
                        </StatusBadge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.author.name} · {a.class ? a.class.name : "School-wide"} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>

                {isTeacherOrAdmin && (a.author.id === identity?.id || identity?.role === "admin" || identity?.role === "super_admin") && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Delete announcement: ${a.title}`} disabled={deletingId === a.id}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
                        <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(a.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsList;
