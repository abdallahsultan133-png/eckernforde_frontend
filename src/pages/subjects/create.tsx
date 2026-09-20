import { useState } from "react";
import { useNavigate } from "react-router";
import { useInvalidate, useList } from "@refinedev/core";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { SectionHeader } from "@/components/layout/section-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Field } from "@/components/ui/field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { Department } from "@/types";

const SubjectsCreate = () => {
    const navigate = useNavigate();
    const invalidate = useInvalidate();
    const { query: deptQuery } = useList<Department>({ resource: "departments", pagination: { pageSize: 100 } });
    const departments = deptQuery?.data?.data ?? [];

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Name is required.");
        if (!departmentId) return toast.error("Department is required.");

        setSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/subjects`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, departmentId: Number(departmentId) }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success("Subject created.");
            invalidate({ resource: "subjects", invalidates: ["list"] });
            navigate("/subjects");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to create subject");
        } finally { setSubmitting(false); }
    };

    return (
        <PageContainer className="max-w-3xl">
            <PageHeader breadcrumb title="New subject" description="Add a learning area to the school curriculum." />
            <form onSubmit={handleSubmit} className="overflow-hidden rounded-lg border bg-background">
                <div className="p-5 sm:p-6">
                    <SectionHeader title="Subject details" description="Define the subject and the department responsible for it." />
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <Field label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" /></Field>
                        <Field label="Department" required htmlFor="subject-department">
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger id="subject-department" className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </Field>
                        <Field label="Description" className="sm:col-span-2"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Optional curriculum notes or learning-area description" /></Field>
                    </div>
                </div>
                <Separator />
                <div className="flex flex-col-reverse gap-2 bg-muted/20 p-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => navigate("/subjects")} disabled={submitting}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create subject
                    </Button>
                </div>
            </form>
        </PageContainer>
    );
};
export default SubjectsCreate;
