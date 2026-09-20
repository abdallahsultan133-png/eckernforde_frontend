import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useGetIdentity } from "@refinedev/core";
import { toast } from "sonner";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Link2,
  Loader2,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { EntityHeader } from "@/components/layout/entity-header";
import { PageContainer } from "@/components/layout/page-container";
import { AcademicProgress } from "@/components/dashboard/academic-progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import FileUploadWidget, { type FileUploadValue } from "@/components/file-upload-widget";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query";
import { UserRole, type User } from "@/types";

type StudentDocument = {
  id: number;
  name: string;
  category: "document" | "certificate" | "medical" | "other";
  url: string;
  createdAt: string;
  uploader: { id: string; name: string };
};

type StudentData = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  profile: {
    registrationNumber: string | null;
    dateOfBirth: string | null;
    phone: string | null;
    address: string | null;
    parentName: string | null;
    parentPhone: string | null;
    parentEmail: string | null;
    bio: string | null;
  } | null;
  linkedParent: { id: string; name: string; email: string } | null;
  enrolledClasses: { id: number; name: string }[];
  grades: { classId: number; finalGrade: number | null; letterGrade: string | null }[];
  attendanceSummary: { total: number; present: number; rate: number | null };
};

const getInitials = (name = "") =>
  name.trim().split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

const StudentProfilePage = () => {
  const { id } = useParams();
  const { data: identity } = useGetIdentity<User>();
  const isAdmin = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
  const isParent = identity?.role === UserRole.PARENT;
  const canManageDocs = isAdmin || identity?.role === UserRole.TEACHER || identity?.id === id;
  const queryClient = useQueryClient();

  const [parentEmailInput, setParentEmailInput] = useState("");
  const [linking, setLinking] = useState(false);
  const [uploading, setUploading] = useState(false);

  const studentPath = id ? `/profile/student/${id}` : null;
  const { data: studentData, isLoading: loading, isError, refetch } = useApiQuery<{ data: StudentData }>(studentPath);
  const data = studentData?.data ?? null;

  const documentsPath = id ? `/files/student/${id}` : null;
  const {
    data: documentsData,
    isLoading: documentsLoading,
    isError: documentsError,
    refetch: refetchDocuments,
  } = useApiQuery<{ data: StudentDocument[] }>(documentsPath);
  const documents = documentsData?.data ?? [];

  const handleUploadDocument = async (file: FileUploadValue | null) => {
    if (!file || !id) return;
    setUploading(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/files`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: id, name: file.fileName, url: file.url, cldPubId: file.publicId }),
      });
      if (!response.ok) throw new Error((await response.json())?.error ?? "Failed to upload document");
      toast.success("Document uploaded.");
      queryClient.invalidateQueries({ queryKey: [documentsPath] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (fileId: number) => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/files/${fileId}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error((await response.json())?.error ?? "Failed to delete document");
      toast.success("Document deleted.");
      queryClient.invalidateQueries({ queryKey: [documentsPath] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete document");
    }
  };

  const handleLinkParent = async (email: string | null) => {
    if (!id) return;
    setLinking(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/profile/student/${id}/link-parent`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error((await response.json())?.error ?? "Failed to update parent link");
      toast.success(email ? "Parent linked." : "Parent unlinked.");
      setParentEmailInput("");
      queryClient.invalidateQueries({ queryKey: [studentPath] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update parent link");
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Breadcrumb />
        <Skeleton className="h-32 w-full" />
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />)}
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <Breadcrumb />
        <ErrorState title="Can't show this student" description="The student may not exist, or you may not have permission to view this record." onRetry={refetch} />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="student-profile">
      <Breadcrumb />
      <EntityHeader
        identity={
          <Avatar className="h-16 w-16 border border-border sm:h-20 sm:w-20">
            {data.image && <AvatarImage src={data.image} alt="" />}
            <AvatarFallback className="text-lg">{getInitials(data.name)}</AvatarFallback>
          </Avatar>
        }
        title={data.name}
        subtitle={data.profile?.registrationNumber ? `Admission number ${data.profile.registrationNumber}` : "Student record"}
        metadata={
          <>
            <span><strong className="font-medium text-foreground">{data.enrolledClasses.length}</strong> enrolled {data.enrolledClasses.length === 1 ? "class" : "classes"}</span>
            <span><strong className="font-medium text-foreground">{data.grades.length}</strong> recorded {data.grades.length === 1 ? "result" : "results"}</span>
            <span>{data.attendanceSummary.rate === null ? "Attendance not recorded" : <><strong className="font-medium text-foreground">{data.attendanceSummary.rate}%</strong> attendance</>}</span>
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" asChild><Link to="/grades/term-results"><BookOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />Report card</Link></Button>
          </>
        }
      />

      <nav aria-label="Student record sections" className="-mb-1 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-5 px-1">
          {[
            ["Overview", "#student-overview"],
            ...(!isParent ? [["Academics", "#student-academics"]] : []),
            ["Attendance", "#student-attendance"],
            ["Results", "#student-results"],
            ["Guardian", "#student-guardian"],
            ["Documents", "#student-documents"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}</a>
          ))}
        </div>
      </nav>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-8">
          <ProfileSection id="student-overview" title="Personal information" icon={<GraduationCap className="h-4 w-4" />}>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                ["Email", data.email],
                ["Date of birth", data.profile?.dateOfBirth],
                ["Phone", data.profile?.phone],
                ["Address", data.profile?.address],
                ["About", data.profile?.bio],
              ].map(([label, value]) => (
                <div key={label as string} className={label === "About" ? "sm:col-span-2" : undefined}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-sm text-foreground">{value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
          </ProfileSection>

          {!isParent && (
            <ProfileSection id="student-academics" title="Current enrollment" icon={<BookOpen className="h-4 w-4" />}>
              {data.enrolledClasses.length === 0 ? (
                <EmptyState variant="inline" icon={BookOpen} title="No active enrollment" description="Enroll this student in a class to begin their academic record." />
              ) : (
                <div className="divide-y divide-border border-y border-border">
                  {data.enrolledClasses.map((course) => {
                    const grade = data.grades.find((result) => result.classId === course.id);
                    return (
                      <div key={course.id} className="flex items-center justify-between gap-4 py-3">
                        <Link to={`/classes/show/${course.id}`} className="min-w-0 truncate text-sm font-medium underline-offset-4 hover:text-primary hover:underline">{course.name}</Link>
                        {grade?.letterGrade ? <Badge variant="outline">Grade {grade.letterGrade}</Badge> : <span className="text-xs text-muted-foreground">No published grade</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </ProfileSection>
          )}

          <ProfileSection id="student-results" title="Published academic results" icon={<ScrollText className="h-4 w-4" />}>
            <AcademicProgress studentId={id} />
          </ProfileSection>

          <ProfileSection id="student-documents" title="Student documents" icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-4">
              {canManageDocs && <FileUploadWidget value={null} onChange={handleUploadDocument} disabled={uploading} maxFileSizeMb={10} />}
              {documentsLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
              ) : documentsError ? (
                <ErrorState variant="inline" title="Unable to load documents" description="Try loading this part of the record again." onRetry={refetchDocuments} />
              ) : documents.length === 0 ? (
                <EmptyState variant="inline" icon={FileText} title="No documents uploaded" description="Documents added to this student record will appear here." />
              ) : (
                <div className="divide-y divide-border border-y border-border">
                  {documents.map((document) => (
                    <div key={document.id} className="flex items-center gap-3 py-3">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <a href={document.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium underline-offset-4 hover:underline">{document.name}</a>
                        <p className="mt-0.5 text-xs text-muted-foreground">{document.category} · Uploaded by {document.uploader.name} · {new Date(document.createdAt).toLocaleDateString()}</p>
                      </div>
                      {canManageDocs && (
                        <Button variant="ghost" size="icon" aria-label={`Delete ${document.name}`} onClick={() => handleDeleteDocument(document.id)}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ProfileSection>
        </div>

        <aside className="space-y-8">
          <ProfileSection id="student-attendance" title="Attendance" icon={<ClipboardCheck className="h-4 w-4" />}>
            {data.attendanceSummary.total > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-semibold tabular-nums">{data.attendanceSummary.rate}%</span>
                  <span className="text-right text-xs text-muted-foreground">{data.attendanceSummary.present} of {data.attendanceSummary.total} sessions present</span>
                </div>
                <Progress value={data.attendanceSummary.rate ?? 0} className="h-2" />
              </div>
            ) : <p className="text-sm text-muted-foreground">No attendance sessions have been recorded.</p>}
          </ProfileSection>

          <ProfileSection id="student-guardian" title="Parent / guardian" icon={<Link2 className="h-4 w-4" />}>
            <dl className="space-y-3">
              {[["Name", data.profile?.parentName], ["Phone", data.profile?.parentPhone], ["Email", data.profile?.parentEmail]].map(([label, value]) => (
                <div key={label as string}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words text-sm">{value || "Not provided"}</dd></div>
              ))}
            </dl>
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Linked portal account</p>
              {data.linkedParent ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{data.linkedParent.name}</p><p className="truncate text-xs text-muted-foreground">{data.linkedParent.email}</p></div>
                  {isAdmin && <Button variant="ghost" size="icon" aria-label={`Unlink ${data.linkedParent.name}`} disabled={linking} onClick={() => handleLinkParent(null)}>{linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}</Button>}
                </div>
              ) : <p className="mt-2 text-sm text-muted-foreground">No parent portal account linked{data.profile?.parentEmail ? "; the contact email remains on the student record." : "."}</p>}
              {isAdmin && !data.linkedParent && (
                <div className="mt-3 flex flex-col gap-2">
                  <Input placeholder="parent@email.com" aria-label="Parent account email" value={parentEmailInput} onChange={(event) => setParentEmailInput(event.target.value)} />
                  <Button size="sm" disabled={linking || !parentEmailInput.trim()} onClick={() => handleLinkParent(parentEmailInput.trim())}>{linking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link parent account"}</Button>
                </div>
              )}
              {isAdmin && <p className="mt-2 text-xs leading-5 text-muted-foreground">The account must already have the Parent role. Manage roles from People & access.</p>}
            </div>
          </ProfileSection>
        </aside>
      </div>
    </PageContainer>
  );
};

function ProfileSection({ id, title, icon, children }: { id: string; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-border pt-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-muted-foreground" aria-hidden="true">{icon}</span>
        <h2 id={`${id}-title`} className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default StudentProfilePage;
