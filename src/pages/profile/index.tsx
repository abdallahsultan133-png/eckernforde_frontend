import { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Field } from "@/components/ui/field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User as UserType } from "@/types";
import { ROLE_LABEL } from "@/lib/roles.ts";
import { useTheme } from "@/components/refine-ui/theme/theme-provider.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { ChangePasswordCard } from "@/components/profile/change-password-card.tsx";
import { AvatarUploader } from "@/components/profile/avatar-uploader.tsx";

type StudentProfile = {
    registrationNumber: string | null;
    dateOfBirth: string | null;
    phone: string | null;
    address: string | null;
    parentName: string | null;
    parentPhone: string | null;
    parentEmail: string | null;
    bio: string | null;
};

const ProfilePage = () => {
    const { data: identity } = useGetIdentity<UserType>();
    const { theme, setTheme } = useTheme();
    const queryClient = useQueryClient();
    const isStudent = identity?.role === UserRole.STUDENT;

    const [profile, setProfile] = useState<StudentProfile>({
        registrationNumber: "", dateOfBirth: "", phone: "",
        address: "", parentName: "", parentPhone: "", parentEmail: "", bio: "",
    });
    const [saving, setSaving] = useState(false);

    const { data: meData, isLoading: loading } = useApiQuery<{ data: { profile: StudentProfile | null } }>("/profile/me");

    useEffect(() => {
        const p = meData?.data?.profile;
        if (!p) return;
        setProfile({
            registrationNumber: p.registrationNumber ?? "",
            dateOfBirth: p.dateOfBirth ?? "", phone: p.phone ?? "",
            address: p.address ?? "", parentName: p.parentName ?? "",
            parentPhone: p.parentPhone ?? "", parentEmail: p.parentEmail ?? "",
            bio: p.bio ?? "",
        });
    }, [meData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/profile/me`, {
                method: "PUT", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success("Profile saved.");
            queryClient.invalidateQueries({ queryKey: ["/profile/me"] });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save profile");
        } finally { setSaving(false); }
    };

    return (
        <div className="profile-page space-y-6 max-w-2xl">
            <PageHeader breadcrumb title="Profile & Settings" description="Your account, security, appearance, and profile details." />

            {/* Account overview */}
            <Card>
                <CardHeader><CardTitle>Account</CardTitle></CardHeader>
                <Separator />
                <CardContent className="mt-4 space-y-5">
                    <div>
                        <p className="text-lg font-semibold">{identity?.name}</p>
                        <p className="text-sm text-muted-foreground">{identity?.email}</p>
                        {identity?.role && <Badge variant="outline" className="mt-1">{ROLE_LABEL[identity.role]}</Badge>}
                    </div>
                    <Separator />
                    <AvatarUploader />
                </CardContent>
            </Card>

            {/* Academic profile shortcut: classes, grades, attendance, report card download, and document uploads */}
            {isStudent && identity?.id && (
                <Card>
                    <CardContent className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Academic Profile</p>
                                <p className="text-xs text-muted-foreground">Classes, grades, attendance, report card, and documents.</p>
                            </div>
                        </div>
                        <Button variant="outline" asChild>
                            <Link to={`/students/${identity.id}`}>View</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Security */}
            <ChangePasswordCard />

            {/* Appearance */}
            <Card>
                <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
                <Separator />
                <CardContent className="mt-4 flex items-center justify-between">
                    <div>
                        <p id="dark-mode-label" className="text-sm font-medium">Dark mode</p>
                        <p className="text-xs text-muted-foreground">Switch between light and dark theme.</p>
                    </div>
                    <Switch
                        aria-labelledby="dark-mode-label"
                        checked={theme === "dark"}
                        onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                    />
                </CardContent>
            </Card>

            {/* Student profile fields */}
            {isStudent && !loading && (
                <Card>
                    <CardHeader><CardTitle>Student Profile</CardTitle></CardHeader>
                    <Separator />
                    <CardContent className="mt-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Registration Number">
                                <Input value={profile.registrationNumber ?? ""} onChange={(e) => setProfile((p) => ({ ...p, registrationNumber: e.target.value }))} placeholder="STU-2024-001" />
                            </Field>
                            <Field label="Date of Birth">
                                <Input type="date" value={profile.dateOfBirth ?? ""} onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                            </Field>
                            <Field label="Phone">
                                <Input value={profile.phone ?? ""} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+255..." />
                            </Field>
                            <Field label="Address" className="sm:col-span-2">
                                <Input value={profile.address ?? ""} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
                            </Field>
                        </div>

                        <Separator />
                        <p className="text-sm font-medium">Parent / Guardian</p>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Parent Name">
                                <Input value={profile.parentName ?? ""} onChange={(e) => setProfile((p) => ({ ...p, parentName: e.target.value }))} />
                            </Field>
                            <Field label="Parent Phone">
                                <Input value={profile.parentPhone ?? ""} onChange={(e) => setProfile((p) => ({ ...p, parentPhone: e.target.value }))} />
                            </Field>
                            <Field label="Parent Email" className="sm:col-span-2">
                                <Input type="email" value={profile.parentEmail ?? ""} onChange={(e) => setProfile((p) => ({ ...p, parentEmail: e.target.value }))} />
                            </Field>
                        </div>

                        <Field label="Bio">
                            <Textarea value={profile.bio ?? ""} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={3} placeholder="A short bio..." />
                        </Field>

                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Profile
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ProfilePage;
