import { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";
import { CheckCircle2, GraduationCap, IdCard, Loader2, LockKeyhole, Mail, Moon, School, ShieldCheck, UserRound } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Field } from "@/components/ui/field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User as UserType } from "@/types";
import { ROLE_LABEL } from "@/lib/roles.ts";
import { useTheme } from "@/components/refine-ui/theme/theme-provider.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Progress } from "@/components/ui/progress.tsx";
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

const emptyProfile: StudentProfile = {
  registrationNumber: "",
  dateOfBirth: "",
  phone: "",
  address: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  bio: "",
};

const ProfilePage = () => {
  const { data: identity } = useGetIdentity<UserType>();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const isStudent = identity?.role === UserRole.STUDENT;
  const [profile, setProfile] = useState<StudentProfile>(emptyProfile);
  const [saving, setSaving] = useState(false);
  const { data: meData, isLoading: profileLoading } = useApiQuery<{ data: { profile: StudentProfile | null } }>("/profile/me");
  const profileCompletion = isStudent
    ? Math.round(Object.values(profile).filter((value) => String(value ?? "").trim().length > 0).length / Object.values(profile).length * 100)
    : 100;

  useEffect(() => {
    const saved = meData?.data?.profile;
    if (!saved) return;
    setProfile({
      registrationNumber: saved.registrationNumber ?? "",
      dateOfBirth: saved.dateOfBirth ?? "",
      phone: saved.phone ?? "",
      address: saved.address ?? "",
      parentName: saved.parentName ?? "",
      parentPhone: saved.parentPhone ?? "",
      parentEmail: saved.parentEmail ?? "",
      bio: saved.bio ?? "",
    });
  }, [meData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/profile/me`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
      toast.success("Profile saved.");
      queryClient.invalidateQueries({ queryKey: ["/profile/me"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer className="profile-page max-w-6xl">
      <PageHeader breadcrumb title="Profile & Settings" description="Manage your portal identity, security and personal preferences." />

      <section className="profile-overview overflow-hidden border-y border-border bg-card sm:rounded-lg sm:border" aria-labelledby="account-overview-heading">
        <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary"><ShieldCheck className="h-3.5 w-3.5" /> Account overview</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 id="account-overview-heading" className="text-2xl font-semibold tracking-tight">{identity?.name ?? "Your profile"}</h1>
              {identity?.role && <Badge variant="outline">{ROLE_LABEL[identity.role]}</Badge>}
            </div>
            {identity?.email && <p className="mt-1 text-sm text-muted-foreground">{identity.email}</p>}
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Keep your personal information current. School-managed account details remain protected to preserve accurate academic records.
            </p>
            <div className="mt-5 max-w-md space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="font-medium">Profile completeness</span><span className="tabular-nums text-muted-foreground">{profileCompletion}%</span></div>
              <Progress value={profileCompletion} className="h-2" />
              {isStudent && profileCompletion < 100 && <p className="text-xs text-muted-foreground">Complete your details below to help the school keep your records accurate.</p>}
            </div>
          </div>
          <div className="border-t border-primary/15 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <AvatarUploader />
          </div>
        </div>
        <dl className="grid divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6"><Mail className="h-4 w-4 text-primary" /><span><dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Email</dt><dd className="truncate text-sm font-medium">{identity?.email ?? "Not available"}</dd></span></div>
          <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6"><UserRound className="h-4 w-4 text-primary" /><span><dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Account type</dt><dd className="text-sm font-medium">{identity?.role ? ROLE_LABEL[identity.role] : "Portal user"}</dd></span></div>
          <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6"><IdCard className="h-4 w-4 text-primary" /><span><dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Account ID</dt><dd className="truncate font-mono text-xs text-muted-foreground">{identity?.id ?? "—"}</dd></span></div>
        </dl>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-6">
          <Card className="overflow-hidden border-primary/15">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-sm">Settings</CardTitle>
              <CardDescription>Manage your account in focused sections.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-1 p-2">
              <a href={isStudent ? "#profile-details" : "#account-details"} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <UserRound className="h-4 w-4 text-muted-foreground" /> {isStudent ? "Personal details" : "Account details"}
              </a>
              <a href="#security" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <LockKeyhole className="h-4 w-4 text-muted-foreground" /> Password & security
              </a>
              <a href="#appearance" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Moon className="h-4 w-4 text-muted-foreground" /> Appearance
              </a>
            </CardContent>
          </Card>

          {isStudent && identity?.id && (
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardContent className="space-y-3 p-4">
                <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Academic profile</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Review your attendance, results, classes and documents.</p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full justify-center">
                  <Link to={`/students/${identity.id}`}>Open academic profile</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>

        <main className="min-w-0 space-y-4">
          {isStudent ? (
            <Card id="profile-details" className="scroll-mt-6">
              <CardHeader>
                <CardTitle>Personal details</CardTitle>
                <CardDescription>Contact and guardian information used by the school.</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="mt-4 space-y-4">
                {profileLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Registration number">
                        <Input value={profile.registrationNumber ?? ""} onChange={(event) => setProfile((current) => ({ ...current, registrationNumber: event.target.value }))} placeholder="STU-2024-001" />
                      </Field>
                      <Field label="Date of birth">
                        <Input type="date" value={profile.dateOfBirth ?? ""} onChange={(event) => setProfile((current) => ({ ...current, dateOfBirth: event.target.value }))} />
                      </Field>
                      <Field label="Phone">
                        <Input value={profile.phone ?? ""} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} placeholder="+255…" />
                      </Field>
                      <Field label="Address">
                        <Input value={profile.address ?? ""} onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))} />
                      </Field>
                    </div>

                    <div className="border-t pt-6">
                      <div className="mb-4 flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <h2 className="text-sm font-semibold">Parent or guardian</h2>
                          <p className="text-xs text-muted-foreground">This contact helps the school keep family records up to date.</p>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Parent or guardian name">
                          <Input value={profile.parentName ?? ""} onChange={(event) => setProfile((current) => ({ ...current, parentName: event.target.value }))} />
                        </Field>
                        <Field label="Parent or guardian phone">
                          <Input value={profile.parentPhone ?? ""} onChange={(event) => setProfile((current) => ({ ...current, parentPhone: event.target.value }))} />
                        </Field>
                        <Field label="Parent or guardian email" className="sm:col-span-2">
                          <Input type="email" value={profile.parentEmail ?? ""} onChange={(event) => setProfile((current) => ({ ...current, parentEmail: event.target.value }))} />
                        </Field>
                      </div>
                    </div>

                    <Field label="About you">
                      <Textarea value={profile.bio ?? ""} onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))} rows={3} placeholder="A short introduction…" />
                    </Field>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> Changes are saved to your student record.</p>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card id="account-details" className="scroll-mt-6">
              <CardHeader>
                <CardTitle>Account details</CardTitle>
                <CardDescription>Your identity and role in the school portal.</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="mt-4 space-y-4">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Full name</dt>
                    <dd className="mt-1 text-sm font-medium">{identity?.name ?? "Not available"}</dd>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email address</dt>
                    <dd className="mt-1 break-words text-sm font-medium">{identity?.email ?? "Not available"}</dd>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Portal role</dt>
                    <dd className="mt-1 text-sm font-medium">{identity?.role ? ROLE_LABEL[identity.role] : "Portal user"}</dd>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account ID</dt>
                    <dd className="mt-1 truncate font-mono text-xs text-muted-foreground">{identity?.id ?? "Not available"}</dd>
                  </div>
                </dl>
                <p className="flex items-start gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Account identity is managed by the school. Contact the school office if your name or email needs to be corrected.</p>
              </CardContent>
            </Card>
          )}

          <section id="security" className="scroll-mt-6"><ChangePasswordCard /></section>

          <Card id="appearance" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Moon className="h-4 w-4 text-primary" /> Appearance</CardTitle>
              <CardDescription>Choose how the portal appears on this device.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="mt-4 p-0">
              <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><Moon className="h-4 w-4" /></span>
                  <div>
                    <p id="dark-mode-label" className="text-sm font-medium">Dark mode</p>
                    <p className="mt-1 text-xs text-muted-foreground">Use a darker colour scheme in low-light settings.</p>
                  </div>
                </div>
                <Switch aria-labelledby="dark-mode-label" checked={theme === "dark"} onCheckedChange={(enabled) => setTheme(enabled ? "dark" : "light")} />
              </div>
            </CardContent>
          </Card>

        </main>
      </div>

    </PageContainer>
  );
};

export default ProfilePage;
