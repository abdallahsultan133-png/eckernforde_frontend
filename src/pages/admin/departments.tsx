import { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Building2, Loader2, Pencil, Plus, Trash } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Field } from "@/components/ui/field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog.tsx";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type Department, type User } from "@/types";

type FormState = { name: string; code: string; description: string };
const emptyForm: FormState = { name: "", code: "", description: "" };

const DepartmentsPage = () => {
    const { data: identity } = useGetIdentity<User>();
    const navigate = useNavigate();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Department | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (identity && identity.role !== UserRole.ADMIN && identity.role !== UserRole.SUPER_ADMIN) {
            navigate("/unauthorized");
        }
    }, [identity, navigate]);

    const { data, isLoading: loading, isError, refetch } = useApiQuery<{ data: Department[] }>("/departments");
    const departments = data?.data ?? [];
    const load = () => { void refetch(); };

    const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
    const openEdit = (d: Department) => {
        setEditing(d);
        setForm({ name: d.name, code: d.code ?? "", description: d.description ?? "" });
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("Name is required.");
        if (!form.code.trim()) return toast.error("Code is required.");

        setSubmitting(true);
        try {
            const url = editing ? `${BACKEND_BASE_URL}/departments/${editing.id}` : `${BACKEND_BASE_URL}/departments`;
            const res = await fetch(url, {
                method: editing ? "PUT" : "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    code: form.code.trim().toUpperCase(),
                    description: form.description.trim() || undefined,
                }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success(editing ? "Department updated." : "Department created.");
            setDialogOpen(false);
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save department");
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (d: Department) => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/departments/${d.id}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success("Department deleted.");
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete department");
        }
    };

    return (
        <div className="departments space-y-6">
            <PageHeader
                breadcrumb
                title={
                    <span className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        Departments
                    </span>
                }
                description="Manage academic departments. Admin only."
                actions={
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Department</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? "Edit Department" : "New Department"}</DialogTitle>
                            <DialogDescription>
                                {editing ? "Update this department's details." : "Add a new department to the school."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field label="Name" required>
                                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Computer Science" />
                            </Field>
                            <Field label="Code" required>
                                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="CS" />
                            </Field>
                            <Field label="Description">
                                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                            </Field>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editing ? "Save Changes" : "Create Department"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                }
            />

            {loading ? (
                <Card className="space-y-3 p-4">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </Card>
            ) : isError ? (
                <ErrorState description="Couldn't load departments." onRetry={refetch} />
            ) : departments.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="No departments yet"
                    description="Add a department to organise subjects and classes under it."
                />
            ) : (
                <Card className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments.map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell className="font-mono text-xs">{d.code}</TableCell>
                                    <TableCell className="font-medium">{d.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">{d.description ?? "—"}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(d)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        <Trash className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete "{d.name}"?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This can't be undone. Departments with subjects assigned to them can't be deleted.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(d)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
};

export default DepartmentsPage;
