import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useList } from "@refinedev/core";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { SectionHeader } from "@/components/layout/section-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Field } from "@/components/ui/field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
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
      const res = await fetch(`${BACKEND_BASE_URL}/homework`, {
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

      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to create homework");
      const { data } = await res.json();

      toast.success("Homework created.");
      navigate(`/homework/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create homework");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer className="assignments-create">
      <PageHeader
        breadcrumb
        title="Create homework"
        description="Set the learning task, choose its class, and define the submission deadline and score."
      />

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        <section aria-labelledby="assignment-basic-title" className="border-t border-border pt-4">
          <SectionHeader title={<span id="assignment-basic-title">Basic information</span>} description="Use a specific title and give students enough detail to complete the work." />
          <div className="mt-5 space-y-5">
            <Field label="Title" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Essay: The causes of World War I" />
            </Field>

            <Field label="Instructions">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain the task, required format, and any assessment criteria." rows={6} />
            </Field>
          </div>
        </section>

        <section aria-labelledby="assignment-context-title" className="border-t border-border pt-4">
          <SectionHeader title={<span id="assignment-context-title">Academic context</span>} description="The selected class determines the subject and students who receive this homework." />
          <div className="mt-5 max-w-xl">
            <Field label="Class" required htmlFor="assignment-class">
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger id="assignment-class" className="w-full">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.subject?.name ?? c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <section aria-labelledby="assignment-schedule-title" className="border-t border-border pt-4">
          <SectionHeader title={<span id="assignment-schedule-title">Schedule and scoring</span>} description="A due date is optional. The maximum score is used when grading submissions." />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
        </section>

        <section aria-labelledby="assignment-resources-title" className="border-t border-border pt-4">
          <SectionHeader title={<span id="assignment-resources-title">Resources</span>} description="Attach one supporting file when students need a worksheet, brief, or reference." />
            <div className="space-y-2">
              <Label>Attachment</Label>
              <FileUploadWidget value={attachment} onChange={setAttachment} />
            </div>
        </section>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? "Creating…" : "Create homework"}
            </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default AssignmentsCreate;
