import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useList } from "@refinedev/core";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Field } from "@/components/ui/field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import FileUploadWidget, { type FileUploadValue } from "@/components/file-upload-widget.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { ClassDetails } from "@/types";

const AssignmentsCreate = () => {
  const navigate = useNavigate();

  const { query: classesQuery } = useList<ClassDetails>({ resource: "classes", pagination: { pageSize: 100 } });
  const classes = classesQuery?.data?.data ?? [];

  // Prefill the class when arriving from a class workspace (…/create?classId=5).
  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState(searchParams.get("classId") ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [attachment, setAttachment] = useState<FileUploadValue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classId) return toast.error("Select a class.");
    if (!title.trim()) return toast.error("Title is required.");

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/assignments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: Number(classId),
          title: title.trim(),
          description: description.trim() || undefined,
          dueAt: dueAt || undefined,
          maxScore: Number(maxScore) || 100,
          attachmentUrl: attachment?.url,
          attachmentCldPubId: attachment?.publicId,
          attachmentName: attachment?.fileName,
        }),
      });

      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to create assignment");
      const { data } = await res.json();

      toast.success("Assignment created.");
      navigate(`/assignments/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="assignments-create space-y-6">
      <PageHeader
        breadcrumb
        title="New Assignment"
        description="Give it a title, a due date, and optionally attach a file."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Assignment details</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Class" required htmlFor="assignment-class">
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger id="assignment-class" className="w-full">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Title" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Essay: The Causes of WWI" />
            </Field>

            <Field label="Description">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions for students..." rows={5} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Due date"
                hint="Students see a live countdown to this moment; submissions close automatically once it passes."
              >
                <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </Field>
              <Field label="Max score">
                <Input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
              </Field>
            </div>

            <div className="space-y-2">
              <Label>Attachment</Label>
              <FileUploadWidget value={attachment} onChange={setAttachment} />
            </div>

            <Separator />

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? "Creating..." : "Create Assignment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentsCreate;
