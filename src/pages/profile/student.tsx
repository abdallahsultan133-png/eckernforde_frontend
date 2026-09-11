import { useState } from "react";
import { Link, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GraduationCap, BookOpen, ClipboardCheck, FileText, Link2, Loader2, ScrollText, Trash2, X } from "lucide-react";
import { useGetIdentity } from "@refinedev/core";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import FileUploadWidget, { type FileUploadValue } from "@/components/file-upload-widget.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User } from "@/types";

type StudentDocument = {
    id: number;
    name: string;
    category: "document" | "certificate" | "medical" | "other";
    url: string;
    fileSize: number | null;
    createdAt: string;
    uploader: { id: string; name: string };
};

type StudentData = {
    id: string; name: string; email: string; image: string | null;
    profile: {
        registrationNumber: string | null; dateOfBirth: string | null;
        phone: string | null; address: string | null; parentName: string | null;
        parentPhone: string | null; parentEmail: string | null; bio: string | null;
    } | null;
    linkedParent: { id: string; name: string; email: string } | null;
    enrolledClasses: { id: number; name: string }[];
    grades: { classId: number; finalGrade: number | null; letterGrade: string | null }[];
    attendanceSummary: { total: number; present: number; rate: number | null };
};

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const StudentProfilePage = () => {
    const { id } = useParams();
    const { data: identity } = useGetIdentity<User>();
    const isAdmin = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
    const canManageDocs = isAdmin || identity?.role === UserRole.TEACHER || identity?.id === id;

    const queryClient = useQueryClient();
    const [parentEmailInput, setParentEmailInput] = useState("");
    const [linking, setLinking] = useState(false);

    const studentPath = id ? `/profile/student/${id}` : null;
    const { data: studentData, isLoading: loading, isError, refetch } = useApiQuery<{ data: StudentData }>(studentPath);
    const data = studentData?.data ?? null;

    const documentsPath = id ? `/files/student/${id}` : null;
    const { data: documentsData } = useApiQuery<{ data: StudentDocument[] }>(documentsPath);
    const documents = documentsData?.data ?? [];
    const [uploading, setUploading] = useState(false);

    const handleUploadDocument = async (file: FileUploadValue | null) => {
        if (!file || !id) return;
        setUploading(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/files`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: id, name: file.fileName, url: file.url, cldPubId: file.publicId }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success("Document uploaded.");
            queryClient.invalidateQueries({ queryKey: [documentsPath] });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (fileId: number) => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/files/${fileId}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success("Document deleted.");
            queryClient.invalidateQueries({ queryKey: [documentsPath] });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete document");
        }
    };

    const handleLinkParent = async (email: string | null) => {
        if (!id) return;
        setLinking(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/profile/student/${id}/link-parent`, {
                method: "PATCH", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success(email ? "Parent linked." : "Parent unlinked.");
            setParentEmailInput("");
            queryClient.invalidateQueries({ queryKey: [studentPath] });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update parent link");
        } finally {
            setLinking(false);
        }
    };

    if (loading) return <div className="space-y-4"><Breadcrumb />{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
    if (isError || !data) return (
        <div className="space-y-4">
            <Breadcrumb />
            <ErrorState
                title="Can't show this student"
                description="They may not exist, or you don't have permission to view their profile."
                onRetry={refetch}
            />
        </div>
    );

    return (
        <div className="student-profile space-y-6">
            <Breadcrumb />

            {/* Header */}
            <Card>
                <CardContent className="flex flex-wrap items-center gap-5 p-5">
                    <Avatar className="h-16 w-16">
                        {data.image && <AvatarImage src={data.image} />}
                        <AvatarFallback className="text-lg">{getInitials(data.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{data.name}</h1>
                        <p className="text-sm text-muted-foreground">{data.email}</p>
                        {data.profile?.registrationNumber && (
                            <Badge variant="outline" className="mt-1">#{data.profile.registrationNumber}</Badge>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">{data.enrolledClasses.length}</p>
                            <p className="text-xs text-muted-foreground">Classes</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{data.grades.length}</p>
                            <p className="text-xs text-muted-foreground">Recorded results</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{data.attendanceSummary.rate !== null ? `${data.attendanceSummary.rate}%` : "—"}</p>
                            <p className="text-xs text-muted-foreground">Attendance</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link to={`/grades/report-card/${id}`}>
                            <ScrollText className="mr-1.5 h-4 w-4" />
                            Report Card
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal info */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Personal Info</CardTitle></CardHeader>
                    <Separator />
                    <CardContent className="mt-4 space-y-2 text-sm">
                        {[
                            ["Date of Birth", data.profile?.dateOfBirth],
                            ["Phone", data.profile?.phone],
                            ["Address", data.profile?.address],
                            ["Bio", data.profile?.bio],
                        ].map(([label, value]) => value ? (
                            <div key={label as string} className="flex gap-2">
                                <span className="font-medium w-28 shrink-0">{label}:</span>
                                <span className="text-muted-foreground">{value}</span>
                            </div>
                        ) : null)}
                        {!data.profile && <p className="text-muted-foreground">No profile details added yet.</p>}
                    </CardContent>
                </Card>

                {/* Parent info */}
                <Card>
                    <CardHeader><CardTitle>Parent / Guardian</CardTitle></CardHeader>
                    <Separator />
                    <CardContent className="mt-4 space-y-4 text-sm">
                        <div className="space-y-2">
                            {[
                                ["Name", data.profile?.parentName],
                                ["Phone", data.profile?.parentPhone],
                                ["Email", data.profile?.parentEmail],
                            ].map(([label, value]) => value ? (
                                <div key={label as string} className="flex gap-2">
                                    <span className="font-medium w-16 shrink-0">{label}:</span>
                                    <span className="text-muted-foreground">{value}</span>
                                </div>
                            ) : null)}
                            {!data.profile?.parentName && <p className="text-muted-foreground">No parent contact info added.</p>}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 font-medium">
                                <Link2 className="h-3.5 w-3.5" />
                                Linked parent account
                            </div>
                            {data.linkedParent ? (
                                <div className="flex items-center justify-between rounded-md border p-2">
                                    <div>
                                        <p className="font-medium">{data.linkedParent.name}</p>
                                        <p className="text-xs text-muted-foreground">{data.linkedParent.email}</p>
                                    </div>
                                    {isAdmin && (
                                        <Button variant="ghost" size="sm" disabled={linking} onClick={() => handleLinkParent(null)}>
                                            {linking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">
                                    No parent account linked{data.profile?.parentEmail ? " — this student is only matched by parent email (legacy)." : "."}
                                </p>
                            )}
                            {isAdmin && !data.linkedParent && (
                                <div className="flex gap-2 pt-1">
                                    <Input
                                        placeholder="parent@email.com"
                                        value={parentEmailInput}
                                        onChange={(e) => setParentEmailInput(e.target.value)}
                                        className="h-8"
                                    />
                                    <Button
                                        size="sm"
                                        disabled={linking || !parentEmailInput.trim()}
                                        onClick={() => handleLinkParent(parentEmailInput.trim())}
                                    >
                                        {linking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Link"}
                                    </Button>
                                </div>
                            )}
                            {isAdmin && (
                                <p className="text-xs text-muted-foreground">
                                    The account must already have the "Parent" role — set it from the Users page first.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Enrolled classes */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Enrolled Classes</CardTitle></CardHeader>
                    <Separator />
                    <CardContent className="mt-4">
                        {data.enrolledClasses.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Not enrolled in any class.</p>
                        ) : (
                            <div className="space-y-1">
                                {data.enrolledClasses.map((c) => {
                                    const grade = data.grades.find((g) => g.classId === c.id);
                                    return (
                                        <div key={c.id} className="flex items-center justify-between text-sm py-1">
                                            <span>{c.name}</span>
                                            {grade?.letterGrade ? <Badge variant="outline">{grade.letterGrade}</Badge> : <span className="text-xs text-muted-foreground">No grade</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Attendance */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Attendance</CardTitle></CardHeader>
                    <Separator />
                    <CardContent className="mt-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Progress value={data.attendanceSummary.rate ?? 0} className="h-3" />
                            <span className="text-sm font-medium w-12 text-right">
                                {data.attendanceSummary.rate !== null ? `${data.attendanceSummary.rate}%` : "—"}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {data.attendanceSummary.present} present out of {data.attendanceSummary.total} recorded sessions.
                        </p>
                    </CardContent>
                </Card>

                {/* Documents */}
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</CardTitle></CardHeader>
                    <Separator />
                    <CardContent className="mt-4 space-y-4">
                        {canManageDocs && (
                            <FileUploadWidget
                                value={null}
                                onChange={handleUploadDocument}
                                disabled={uploading}
                                maxFileSizeMb={10}
                            />
                        )}
                        {documents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center gap-3 rounded-md border p-2.5">
                                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="truncate text-sm font-medium hover:underline">
                                                {doc.name}
                                            </a>
                                            <p className="text-xs text-muted-foreground">
                                                <Badge variant="outline" className="mr-1.5 text-[10px] capitalize">{doc.category}</Badge>
                                                Uploaded by {doc.uploader.name} · {new Date(doc.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {canManageDocs && (
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StudentProfilePage;
