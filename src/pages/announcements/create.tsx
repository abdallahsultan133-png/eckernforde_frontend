import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useList } from "@refinedev/core";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Field } from "@/components/ui/field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { ClassDetails } from "@/types";

const ALL_CLASSES_VALUE = "school-wide";

const AnnouncementsCreate = () => {
  const navigate = useNavigate();

  const { query: classesQuery } = useList<ClassDetails>({ resource: "classes", pagination: { pageSize: 100 } });
  const classes = classesQuery?.data?.data ?? [];

  // Prefill the audience when arriving from a class workspace (…/create?classId=5).
  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState(searchParams.get("classId") ?? ALL_CLASSES_VALUE);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return toast.error("Title is required.");
    if (!content.trim()) return toast.error("Content is required.");

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/announcements`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classId === ALL_CLASSES_VALUE ? null : Number(classId),
          title: title.trim(),
          content: content.trim(),
          pinned,
        }),
      });

      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to post announcement");

      toast.success("Announcement posted.");
      navigate("/announcements");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="announcements-create space-y-6">
      <PageHeader
        breadcrumb
        title="New Announcement"
        description="Post to a specific class, or school-wide."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Announcement details</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Audience" htmlFor="announcement-audience">
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger id="announcement-audience" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CLASSES_VALUE}>School-wide (everyone)</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Title" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Midterm schedule released" />
            </Field>

            <Field label="Content" required>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your announcement..." rows={6} />
            </Field>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p id="pin-to-top-label" className="text-sm font-medium">Pin to top</p>
                <p className="text-xs text-muted-foreground">Pinned announcements always appear first.</p>
              </div>
              <Switch checked={pinned} onCheckedChange={setPinned} aria-labelledby="pin-to-top-label" />
            </div>

            <Separator />

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? "Posting..." : "Post Announcement"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementsCreate;
