import { Link } from "react-router";
import { GraduationCap, ClipboardCheck, BookOpen, ChevronRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type Child = {
    id: string; name: string; email: string; image: string | null;
    profile: { registrationNumber: string | null } | null;
    enrolledClasses: { id: number; name: string }[];
    grades: { classId: number; finalGrade: number | null; letterGrade: string | null }[];
    attendanceSummary: { total: number; present: number; rate: number | null };
};

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const gradeColor = (letter: string | null) => {
    if (!letter) return "";
    if (letter === "A") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    if (letter === "B") return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    if (letter === "C") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
    return "bg-red-500/10 text-red-700 dark:text-red-300";
};

const ParentDashboard = () => {
    const { data, isLoading: loading } = useApiQuery<{ data: Child[] }>("/profile/my-children");
    const children = data?.data ?? [];

    return (
        <div className="parent-dashboard space-y-6">
            <Breadcrumb />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">My Children</h1>
                <p className="text-sm text-muted-foreground">Academic progress overview for each child linked to your account.</p>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
                </div>
            ) : children.length === 0 ? (
                <Card className="p-10 text-center">
                    <GraduationCap className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">No children linked yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ask your child to add your email as their parent email in their Profile settings.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {children.map((child) => {
                        return (
                            <Card key={child.id} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12">
                                            {child.image && <AvatarImage src={child.image} />}
                                            <AvatarFallback className="text-lg">{getInitials(child.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <CardTitle className="text-base">{child.name}</CardTitle>
                                            <p className="text-xs text-muted-foreground">{child.email}</p>
                                            {child.profile?.registrationNumber && (
                                                <Badge variant="outline" className="mt-1 text-[10px]">#{child.profile.registrationNumber}</Badge>
                                            )}
                                        </div>
                                        <Link to={`/students/${child.id}`} className="text-muted-foreground hover:text-primary">
                                            <ChevronRight className="h-5 w-5" />
                                        </Link>
                                    </div>
                                </CardHeader>

                                <Separator />

                                <CardContent className="mt-4 flex-1 space-y-4">
                                    {/* Quick stats */}
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="rounded-lg border p-2">
                                            <p className="text-lg font-bold">{child.enrolledClasses.length}</p>
                                            <p className="text-[10px] text-muted-foreground">Classes</p>
                                        </div>
                                        <div className="rounded-lg border p-2">
                                            <p className="text-lg font-bold">{child.grades.length}</p>
                                            <p className="text-[10px] text-muted-foreground">Results</p>
                                        </div>
                                        <div className="rounded-lg border p-2">
                                            <p className="text-lg font-bold">{child.attendanceSummary.rate !== null ? `${child.attendanceSummary.rate}%` : "—"}</p>
                                            <p className="text-[10px] text-muted-foreground">Attendance</p>
                                        </div>
                                    </div>

                                    {/* Attendance bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                            <ClipboardCheck className="h-3.5 w-3.5" /> Attendance
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Progress value={child.attendanceSummary.rate ?? 0} className="h-2" />
                                            <span className="text-xs w-10 text-right">{child.attendanceSummary.rate ?? "—"}%</span>
                                        </div>
                                    </div>

                                    {/* Classes + grades */}
                                    {child.enrolledClasses.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="flex items-center gap-1.5 text-xs font-medium">
                                                <BookOpen className="h-3.5 w-3.5" /> Classes
                                            </p>
                                            {child.enrolledClasses.map((c) => {
                                                const grade = child.grades.find((g) => g.classId === c.id);
                                                return (
                                                    <div key={c.id} className="flex items-center justify-between text-xs py-0.5">
                                                        <span className="text-muted-foreground truncate">{c.name}</span>
                                                        {grade?.letterGrade
                                                            ? <Badge className={`text-[10px] ${gradeColor(grade.letterGrade)}`}>{grade.letterGrade}</Badge>
                                                            : <span className="text-muted-foreground">No grade</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>

                                <div className="p-4 pt-0">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link to="/grades/term-results" className="rounded-md border py-1.5 text-center text-sm font-medium hover:bg-muted transition-colors">Term Results</Link>
                                        <Link to={`/students/${child.id}`} className="rounded-md border py-1.5 text-center text-sm font-medium hover:bg-muted transition-colors">Full Profile</Link>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ParentDashboard;
