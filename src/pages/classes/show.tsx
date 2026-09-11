import { useState, type ReactNode } from "react";
import { useShow, useGetIdentity } from "@refinedev/core";
import { Link, useParams, useSearchParams } from "react-router";
import { AdvancedImage } from "@cloudinary/react";
import {
    Check,
    Copy,
    GraduationCap,
    PencilLine,
    UsersRound,
} from "lucide-react";

import type { ClassDetails, User } from "@/types";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { StatusBadge } from "@/components/ui/status-badge.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { bannerPhoto } from "@/lib/cloudinary.ts";
import { isStaff } from "@/lib/roles.ts";
import { cn } from "@/lib/utils.ts";

import { StudentsTab } from "./workspace/students-tab.tsx";
import { AssignmentsTab } from "./workspace/assignments-tab.tsx";
import { AttendanceTab } from "./workspace/attendance-tab.tsx";
import { GradesTab } from "./workspace/grades-tab.tsx";
import { AnnouncementsTab } from "./workspace/announcements-tab.tsx";

const getInitials = (name = "") =>
    name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const STATUS_TONE = {
    active: "success",
    inactive: "neutral",
    archived: "warning",
} as const;

const TABS = ["overview", "students", "assignments", "attendance", "grades", "announcements"] as const;
type TabKey = (typeof TABS)[number];

const Show = () => {
    const { id } = useParams();
    const classId = Number(id);
    const { query } = useShow<ClassDetails>({ resource: "classes" });
    const cls = query.data?.data;
    const { isLoading, isError } = query;

    const { data: identity } = useGetIdentity<User>();
    const staff = isStaff(identity?.role);

    const [searchParams, setSearchParams] = useSearchParams();
    const rawTab = searchParams.get("tab");
    const tab: TabKey = (TABS as readonly string[]).includes(rawTab ?? "")
        ? (rawTab as TabKey)
        : "overview";
    const setTab = (value: string) =>
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("tab", value);
                return next;
            },
            { replace: true },
        );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="aspect-[5/1] w-full rounded-xl" />
                <Skeleton className="h-10 w-full max-w-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (isError || !cls) {
        return (
            <div className="space-y-6">
                <PageHeader title="Class" breadcrumb />
                <ErrorState
                    title="Couldn't load this class"
                    description="The class may have been removed, or you don't have access to it."
                    onRetry={() => query.refetch()}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                breadcrumb
                title={
                    <span className="flex flex-wrap items-center gap-2.5">
                        {cls.name}
                        <StatusBadge tone={STATUS_TONE[cls.status] ?? "neutral"}>
                            {cls.status}
                        </StatusBadge>
                    </span>
                }
                description={
                    [cls.subject?.name, cls.department?.name].filter(Boolean).join("  ·  ") || undefined
                }
                actions={
                    staff && (
                        <>
                            <Button asChild variant="outline" size="sm">
                                <Link to={`/classes/${cls.id}/enroll`}>
                                    <UsersRound className="mr-1.5 h-4 w-4" />
                                    Manage students
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link to={`/classes/edit/${cls.id}`}>
                                    <PencilLine className="mr-1.5 h-4 w-4" />
                                    Edit class
                                </Link>
                            </Button>
                        </>
                    )
                }
            />

            {cls.bannerUrl && (
                <div className="overflow-hidden rounded-xl border">
                    <AdvancedImage
                        cldImg={bannerPhoto(cls.bannerCldPubId ?? cls.bannerUrl, cls.name)}
                        className="aspect-[5/1] w-full object-cover"
                    />
                </div>
            )}

            <Tabs value={tab} onValueChange={setTab} className="space-y-5">
                <div className="overflow-x-auto">
                    <TabsList className="w-max">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="students">Students</TabsTrigger>
                        <TabsTrigger value="assignments">Assignments</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        <TabsTrigger value="grades">Grades</TabsTrigger>
                        <TabsTrigger value="announcements">Announcements</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview">
                    <Overview cls={cls} />
                </TabsContent>
                <TabsContent value="students">
                    <StudentsTab classId={classId} canManage={staff} />
                </TabsContent>
                <TabsContent value="assignments">
                    <AssignmentsTab classId={classId} canManage={staff} />
                </TabsContent>
                <TabsContent value="attendance">
                    <AttendanceTab classId={classId} canManage={staff} />
                </TabsContent>
                <TabsContent value="grades">
                    <GradesTab classId={classId} canManage={staff} />
                </TabsContent>
                <TabsContent value="announcements">
                    <AnnouncementsTab classId={classId} canManage={staff} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

// ── Overview ─────────────────────────────────────────────────────────────────
function Overview({ cls }: { cls: ClassDetails }) {
    return (
        <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
                <section className="rounded-xl border p-5">
                    <h2 className="text-sm font-semibold">About this class</h2>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
                        {cls.description || "No description has been added yet."}
                    </p>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                    <DetailBlock label="Instructor">
                        {cls.teacher ? (
                            <div className="flex items-center gap-2.5">
                                <Avatar className="h-9 w-9">
                                    {cls.teacher.image && <AvatarImage src={cls.teacher.image} alt={cls.teacher.name} />}
                                    <AvatarFallback>{getInitials(cls.teacher.name)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{cls.teacher.name}</p>
                                    {cls.teacher.email && (
                                        <p className="truncate text-xs text-muted-foreground">{cls.teacher.email}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Not assigned</p>
                        )}
                    </DetailBlock>

                    <DetailBlock label="Subject">
                        {cls.subject ? (
                            <>
                                <p className="text-sm font-medium">
                                    <span className="font-mono text-xs text-muted-foreground">{cls.subject.code}</span>{" "}
                                    {cls.subject.name}
                                </p>
                                {cls.subject.description && (
                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                        {cls.subject.description}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                        )}
                    </DetailBlock>

                    <DetailBlock label="Department">
                        <p className="text-sm font-medium">{cls.department?.name ?? "—"}</p>
                        {cls.department?.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {cls.department.description}
                            </p>
                        )}
                    </DetailBlock>

                    <DetailBlock label="Capacity">
                        <p className="text-sm font-medium">{cls.capacity} seats</p>
                    </DetailBlock>
                </div>

                {cls.schedules?.length > 0 && (
                    <DetailBlock label="Schedule">
                        <div className="flex flex-wrap gap-2">
                            {cls.schedules.map((s, i) => (
                                <span key={i} className="rounded-md border px-2.5 py-1 text-xs">
                                    <span className="font-medium">{s.day}</span>{" "}
                                    <span className="text-muted-foreground">
                                        {s.startTime}–{s.endTime}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </DetailBlock>
                )}
            </div>

            {cls.inviteCode && <JoinCard code={cls.inviteCode} />}
        </div>
    );
}

function DetailBlock({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="rounded-xl border p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </p>
            {children}
        </div>
    );
}

function JoinCard({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable — the code is visible to type manually */
        }
    };

    return (
        <section className="h-fit rounded-xl border bg-muted/30 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <GraduationCap className="h-4 w-4" />
                Join this class
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
                Students enter this code under Classes → Join.
            </p>
            <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-background px-3 py-2 text-center font-mono text-base font-semibold tracking-widest">
                    {code}
                </code>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copy}
                    aria-label="Copy invite code"
                >
                    <Check className={cn("h-4 w-4", !copied && "hidden")} />
                    <Copy className={cn("h-4 w-4", copied && "hidden")} />
                </Button>
            </div>
        </section>
    );
}

export default Show;
