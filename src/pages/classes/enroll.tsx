import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { toast } from "sonner";
import { UserMinus, UserPlus, ArrowLeft, Upload, Loader2, Search } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { parseSingleColumnCsv } from "@/lib/csv.ts";

type Student = { id: string; name: string; email: string; image: string | null };

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const EnrollStudents = () => {
    const { id: classId } = useParams();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [bulkImporting, setBulkImporting] = useState(false);
    const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Full student directory picker — browse/search everyone by name or
    // email and multi-select who to enroll, instead of only being able to
    // add one exact email at a time.
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [enrollingSelected, setEnrollingSelected] = useState(false);

    const load = () => {
        setLoading(true);
        fetch(`${BACKEND_BASE_URL}/classes/${classId}/students`, { credentials: "include" })
            .then(async (r) => r.ok ? r.json() : { data: [] })
            .then((j) => setStudents(j.data ?? []))
            .catch(() => toast.error("Failed to load students"))
            .finally(() => setLoading(false));
    };

    const loadDirectory = () => {
        setDirectoryLoading(true);
        fetch(`${BACKEND_BASE_URL}/users/students`, { credentials: "include" })
            .then(async (r) => r.ok ? r.json() : { data: [] })
            .then((j) => setAllStudents(j.data ?? []))
            .catch(() => toast.error("Failed to load student directory"))
            .finally(() => setDirectoryLoading(false));
    };

    useEffect(() => { load(); loadDirectory(); }, [classId]);

    const enrolledIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);

    const availableStudents = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allStudents
            .filter((s) => !enrolledIds.has(s.id))
            .filter((s) => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }, [allStudents, enrolledIds, search]);

    const toggleSelected = (studentId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(studentId)) next.delete(studentId);
            else next.add(studentId);
            return next;
        });
    };

    const handleEnrollSelected = async () => {
        if (selectedIds.size === 0) return;
        setEnrollingSelected(true);

        let succeeded = 0;
        const failed: string[] = [];

        for (const studentId of selectedIds) {
            try {
                const res = await fetch(`${BACKEND_BASE_URL}/classes/${classId}/enroll`, {
                    method: "POST", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ studentId }),
                });
                if (res.ok) succeeded++;
                else failed.push(studentId);
            } catch {
                failed.push(studentId);
            }
        }

        setEnrollingSelected(false);
        setSelectedIds(new Set());
        load();

        if (failed.length === 0) {
            toast.success(`Enrolled ${succeeded} student${succeeded === 1 ? "" : "s"}.`);
        } else {
            toast.warning(`Enrolled ${succeeded} of ${selectedIds.size}. ${failed.length} failed.`);
        }
    };

    const handleBulkImport = async (file: File) => {
        const text = await file.text();
        const emails = Array.from(new Set(parseSingleColumnCsv(text, ["email", "emails", "student email"]).map((e) => e.toLowerCase())));

        if (emails.length === 0) {
            toast.error("No email addresses found in that file.");
            return;
        }

        setBulkImporting(true);
        setBulkProgress({ done: 0, total: emails.length });

        let succeeded = 0;
        const failed: string[] = [];

        for (const email of emails) {
            try {
                const res = await fetch(`${BACKEND_BASE_URL}/classes/${classId}/enroll`, {
                    method: "POST", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
                if (res.ok) succeeded++;
                else failed.push(email);
            } catch {
                failed.push(email);
            }
            setBulkProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
        }

        setBulkImporting(false);
        setBulkProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        load();

        if (failed.length === 0) {
            toast.success(`Enrolled ${succeeded} student${succeeded === 1 ? "" : "s"}.`);
        } else {
            toast.warning(
                `Enrolled ${succeeded} of ${emails.length}. Failed: ${failed.slice(0, 5).join(", ")}${failed.length > 5 ? ` and ${failed.length - 5} more` : ""}`,
                { duration: 8000 }
            );
        }
    };

    const handleRemove = async (studentId: string) => {
        const res = await fetch(`${BACKEND_BASE_URL}/classes/${classId}/enroll/${studentId}`, { method: "DELETE", credentials: "include" });
        if (res.ok) { setStudents((prev) => prev.filter((s) => s.id !== studentId)); toast.success("Student removed."); }
        else toast.error("Failed to remove student.");
    };

    return (
        <div className="enroll-students space-y-6">
            <Breadcrumb />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Manage Students</h1>
                    <p className="text-sm text-muted-foreground">Enroll or remove students from this class.</p>
                </div>
                <Button asChild variant="outline">
                    <Link to={`/classes/show/${classId}`}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to Class</Link>
                </Button>
            </div>

            <Card className="p-4">
                <p className="text-sm font-medium mb-1">Enroll students</p>
                <p className="text-xs text-muted-foreground mb-3">
                    Browse or search the student directory by name or email, then select everyone who should be enrolled.
                </p>

                <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email…"
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
                    {directoryLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3 w-24" /></div>
                            </div>
                        ))
                    ) : availableStudents.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">
                            {search ? "No matching students found." : "Every student is already enrolled in this class."}
                        </p>
                    ) : (
                        availableStudents.map((s) => (
                            <label key={s.id} htmlFor={`student-${s.id}`} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50">
                                <Checkbox
                                    id={`student-${s.id}`}
                                    checked={selectedIds.has(s.id)}
                                    onCheckedChange={() => toggleSelected(s.id)}
                                />
                                <Avatar className="h-8 w-8">
                                    {s.image && <AvatarImage src={s.image} />}
                                    <AvatarFallback>{getInitials(s.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{s.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                                </div>
                            </label>
                        ))
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {selectedIds.size} student{selectedIds.size === 1 ? "" : "s"} selected
                    </span>
                    <Button onClick={handleEnrollSelected} disabled={enrollingSelected || selectedIds.size === 0}>
                        <UserPlus className="mr-1.5 h-4 w-4" />
                        {enrollingSelected ? "Enrolling..." : `Enroll Selected${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
                    </Button>
                </div>

                <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium mb-1">Bulk import via CSV</p>
                    <p className="text-xs text-muted-foreground mb-3">
                        A file with one email per line (or a single "email" column, with or without a header row).
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt,text/csv,text/plain"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleBulkImport(file);
                            }}
                            disabled={bulkImporting}
                            className="hidden"
                            id="bulk-enroll-csv"
                        />
                        <Button variant="outline" disabled={bulkImporting} onClick={() => fileInputRef.current?.click()}>
                            {bulkImporting ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-1.5 h-4 w-4" />
                            )}
                            {bulkImporting ? "Importing..." : "Choose CSV file"}
                        </Button>
                        {bulkProgress && (
                            <span className="text-xs text-muted-foreground">
                                {bulkProgress.done} / {bulkProgress.total} processed
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="divide-y">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                    <p className="text-sm font-medium">Enrolled Students ({students.length})</p>
                </div>

                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-4">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-28" /></div>
                        </div>
                    ))
                ) : students.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">No students enrolled yet. Use the form above to add the first one.</p>
                ) : (
                    students.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-4">
                            <Avatar className="h-9 w-9">
                                {s.image && <AvatarImage src={s.image} />}
                                <AvatarFallback>{getInitials(s.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Link to={`/students/${s.id}`} className="text-sm font-medium hover:underline">{s.name}</Link>
                                <p className="text-xs text-muted-foreground">{s.email}</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Remove ${s.name} from class`} className="text-muted-foreground hover:text-destructive">
                                        <UserMinus className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Remove {s.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>They will be unenrolled from this class. This cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemove(s.id)}>Remove</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
};

export default EnrollStudents;
