import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useGetIdentity, useList, useOne } from "@refinedev/core";
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
import { UserRole, type Department, type Subject, type User } from "@/types";

const SubjectsEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const { data: identity } = useGetIdentity<User>();
    const { query: deptQuery } = useList<Department>({ resource: "departments", pagination: { pageSize: 100 } });
    const departments = deptQuery?.data?.data ?? [];

    const { query: subjectQuery } = useOne<Subject>({ resource: "subjects", id });
    const subject = subjectQuery?.data?.data;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!subject) return;
        setName(subject.name ?? "");
        setDescription(subject.description ?? "");
        setDepartmentId(subject.department?.id ? String(subject.department.id) : "");
    }, [subject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Name is required.");
        if (!departmentId) return toast.error("Department is required.");

        setSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/subjects/${id}`, {
                method: "PUT", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, departmentId: Number(departmentId) }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success("Subject updated.");
            navigate("/subjects");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update subject");
        } finally { setSubmitting(false); }
    };

    if (subjectQuery.isLoading) {
        return (
            <PageContainer className="flex items-center justify-center py-24" aria-label="Loading subject" aria-busy="true">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </PageContainer>
        );
    }

    // Defense in depth: the Edit button is already hidden for non-owners in
    // the list, but a teacher could still navigate here directly by URL.
    // Only the creating teacher (or an admin) may actually use this form.
    const isAdmin = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
    const canEdit = isAdmin || (identity?.role === UserRole.TEACHER && identity?.id === subject?.createdBy);
    if (subject && !canEdit) {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <PageContainer className="max-w-3xl">
            <PageHeader breadcrumb title="Edit subject" description="Update this learning area's curriculum details." />
            <form onSubmit={handleSubmit} className="overflow-hidden rounded-lg border bg-background">
                <div className="p-5 sm:p-6">
                    <SectionHeader title="Subject details" description="Changes apply wherever this subject is used." />
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <Field label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" /></Field>
                        <Field label="Department" required htmlFor="subject-department">
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger id="subject-department" className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </Field>
                        <Field label="Description" className="sm:col-span-2"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></Field>
                    </div>
                </div>
                <Separator />
                <div className="flex flex-col-reverse gap-2 bg-muted/20 p-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => navigate("/subjects")} disabled={submitting}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
                    </Button>
                </div>
            </form>
        </PageContainer>
    );
};
export default SubjectsEdit;
