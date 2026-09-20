import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type Template = {
  name: string;
  schoolName: string;
  schoolAddress: string | null;
  headmasterName: string | null;
  headmasterSignature: string | null;
  logoUrl: string | null;
  accentColor: string;
  showAttendance: boolean;
  showRemarks: boolean;
  showDivision: boolean;
};

const emptyTemplate: Template = {
  name: "Official school report card",
  schoolName: "Eckernforde Cambridge Secondary School",
  schoolAddress: "",
  headmasterName: "",
  headmasterSignature: "",
  logoUrl: "/eckernforde-cambridge-badge.png",
  accentColor: "#0f4c5c",
  showAttendance: true,
  showRemarks: true,
  showDivision: true,
};

const sampleRows = ["Mathematics", "English", "Biology"];

export default function ReportCardTemplatePage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Template }>("/report-card-template");
  const [form, setForm] = useState<Template>(emptyTemplate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.data) setForm({ ...emptyTemplate, ...data.data, logoUrl: data.data.logoUrl || emptyTemplate.logoUrl });
  }, [data]);

  const update = <K extends keyof Template>(key: K, value: Template[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/report-card-template`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Could not save report-card template.");
      queryClient.setQueryData(["/report-card-template"], body);
      toast.success("Report-card template saved. Student reports will use it immediately.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save report-card template.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageContainer className="space-y-4" aria-busy="true"><Skeleton className="h-12 w-80" /><Skeleton className="h-[560px] w-full" /></PageContainer>;
  if (isError) return <PageContainer><ErrorState title="Unable to load report-card template" description="Try again to edit the school report layout." onRetry={refetch} /></PageContainer>;

  return <PageContainer className="space-y-6">
    <PageHeader breadcrumb title="Report Card Template" description="Configure the official report layout used by student and parent report cards." actions={<Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save template</Button>} />
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader><CardTitle>Template details</CardTitle><CardDescription>Changes are reflected in the preview and published to reports after saving.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-1.5 text-sm font-medium">Template name<Input value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
          <label className="block space-y-1.5 text-sm font-medium">School name<Input value={form.schoolName} onChange={(event) => update("schoolName", event.target.value)} /></label>
          <label className="block space-y-1.5 text-sm font-medium">School address<Textarea value={form.schoolAddress ?? ""} onChange={(event) => update("schoolAddress", event.target.value)} rows={2} /></label>
          <label className="block space-y-1.5 text-sm font-medium">Headmaster name<Input value={form.headmasterName ?? ""} onChange={(event) => update("headmasterName", event.target.value)} /></label>
          <label className="block space-y-1.5 text-sm font-medium">Signature label or image URL<Input value={form.headmasterSignature ?? ""} onChange={(event) => update("headmasterSignature", event.target.value)} placeholder="Headmaster signature" /></label>
          <label className="block space-y-1.5 text-sm font-medium">Logo URL<Input value={form.logoUrl ?? ""} onChange={(event) => update("logoUrl", event.target.value)} placeholder="https://…" /></label>
          <label className="flex items-center justify-between gap-3 border-t pt-4 text-sm font-medium">Accent color <input aria-label="Accent color" type="color" value={form.accentColor} onChange={(event) => update("accentColor", event.target.value)} className="h-9 w-14 cursor-pointer rounded border bg-transparent p-1" /></label>
          <div className="space-y-3 border-t pt-4 text-sm"><p className="font-semibold">Report sections</p>
            <label className="flex items-center justify-between gap-3">Attendance <Switch checked={form.showAttendance} onCheckedChange={(value) => update("showAttendance", value)} /></label>
            <label className="flex items-center justify-between gap-3">Teacher remarks <Switch checked={form.showRemarks} onCheckedChange={(value) => update("showRemarks", value)} /></label>
            <label className="flex items-center justify-between gap-3">Secondary division <Switch checked={form.showDivision} onCheckedChange={(value) => update("showDivision", value)} /></label>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden bg-muted/20"><CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Live report preview</CardTitle><CardDescription>Sample marks illustrate the layout. Student reports use published marks entered by teachers.</CardDescription></CardHeader><CardContent className="overflow-auto p-4 sm:p-8">
        <div className="mx-auto max-w-3xl bg-white p-5 text-slate-900 shadow-sm sm:p-9" style={{ borderTop: `5px solid ${form.accentColor}` }}>
          <div className="flex items-start justify-between gap-4 border-b pb-5">
            <div className="flex items-center gap-3">{form.logoUrl ? <img src={form.logoUrl} alt="School logo" className="h-14 w-14 object-contain" /> : <div className="grid h-14 w-14 place-items-center border text-xs font-bold" style={{ color: form.accentColor }}>LOGO</div>}<div><h2 className="text-xl font-bold" style={{ color: form.accentColor }}>{form.schoolName || "School name"}</h2><p className="text-xs text-slate-500">{form.schoolAddress || "School address"}</p></div></div>
            <div className="text-right"><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: form.accentColor }}>Student report card</p><p className="mt-1 text-xs text-slate-500">Academic year 2026/2027</p></div>
          </div>
          <div className="grid gap-2 border-b py-4 text-sm sm:grid-cols-3"><p><span className="text-slate-500">Student</span><br /><strong>Sample Student</strong></p><p><span className="text-slate-500">Class / Form</span><br /><strong>Form I</strong></p><p><span className="text-slate-500">Registration no.</span><br /><strong>REG-0001</strong></p></div>
          {[{ title: "Midterm", subtitle: "Midterm assessment", division: form.showDivision }, { title: "Terminal", subtitle: "Terminal / annual assessment", division: form.showDivision }].map((section) => <section key={section.title} className="mt-6"><div className="mb-2 flex items-center justify-between"><div><h3 className="font-semibold" style={{ color: form.accentColor }}>{section.title}</h3><p className="text-xs text-slate-500">{section.subtitle}</p></div>{section.division && <span className="text-sm font-semibold">Division II</span>}</div><table className="w-full border-collapse text-sm"><thead><tr style={{ backgroundColor: `${form.accentColor}18`, color: form.accentColor }}><th className="border p-2 text-left">Subject</th><th className="border p-2 text-center">Marks</th><th className="border p-2 text-center">Grade</th></tr></thead><tbody>{sampleRows.map((subject, index) => <tr key={subject}><td className="border p-2">{subject}</td><td className="border p-2 text-center">{section.title === "Midterm" ? [72, 65, 78][index] : [81, 70, 84][index]}</td><td className="border p-2 text-center font-semibold">{section.title === "Midterm" ? ["B", "C", "A"][index] : ["A", "B", "A"][index]}</td></tr>)}</tbody></table></section>)}
          {form.showAttendance && <div className="mt-6 border p-3 text-sm"><strong style={{ color: form.accentColor }}>Attendance</strong><span className="ml-4 text-slate-600">Present 82 · Absent 3 · Late 1</span></div>}
          {form.showRemarks && <div className="mt-6 border p-3 text-sm"><strong style={{ color: form.accentColor }}>Teacher remarks</strong><p className="mt-2 text-slate-600">Shows the published teacher remarks for this student.</p></div>}
          <div className="mt-12 grid gap-8 border-t pt-4 text-center text-xs sm:grid-cols-2"><div><div className="mx-auto mb-2 h-8 border-b border-slate-400">Class teacher</div><span>Class teacher signature</span></div><div><div className="mx-auto mb-2 h-8 border-b border-slate-400">{form.headmasterSignature || "Headmaster signature"}</div><span>{form.headmasterName || "Headmaster"}</span></div></div>
        </div>
      </CardContent></Card>
    </div>
  </PageContainer>;
}
