import { useState } from "react";
import { useNavigate } from "react-router";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { Department } from "@/types";

const SubjectsCreate = () => {
    const navigate = useNavigate();
    const { query: deptQuery } = useList<Department>({ resource: "departments", pagination: { pageSize: 100 } });
    const departments = deptQuery?.data?.data ?? [];

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Name is required.");
        if (!code.trim()) return toast.error("Code is required.");
        if (!departmentId) return toast.error("Department is required.");

        setSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/subjects`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), code: code.trim().toUpperCase(), description: description.trim() || undefined, departmentId: Number(departmentId) }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success("Subject created.");
            navigate("/subjects");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to create subject");
        } finally { setSubmitting(false); }
    };

    return (
        <div className="space-y-6 max-w-xl">
            <PageHeader breadcrumb title="New Subject" description="Add a subject to the curriculum." />
            <Card>
                <CardHeader><CardTitle>Subject details</CardTitle></CardHeader>
                <Separator />
                <CardContent className="mt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" /></Field>
                        <Field label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MATH101" /></Field>
                        <Field label="Department" required htmlFor="subject-department">
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger id="subject-department" className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </Field>
                        <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></Field>
                        <Separator />
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Subject
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
export default SubjectsCreate;
