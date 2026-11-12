import { Check } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { portalSchoolName } from "@/lib/school-brand";
import { UserRole } from "@/types";

export type HeadmasterStage =
  | "nursery"
  | "kindergarten_i"
  | "kindergarten_ii"
  | "kindergarten_iii"
  | "standard_i"
  | "standard_ii"
  | "standard_iii"
  | "standard_iv"
  | "standard_v"
  | "standard_vi"
  | "form_i"
  | "form_ii"
  | "form_iii"
  | "form_iv";

const PRIMARY_STAGES: { value: HeadmasterStage; label: string }[] = [
  { value: "kindergarten_i", label: "KG I" },
  { value: "kindergarten_ii", label: "KG II" },
  { value: "kindergarten_iii", label: "KG III" },
  { value: "nursery", label: "Nursery" },
  { value: "standard_i", label: "Class I" },
  { value: "standard_ii", label: "Class II" },
  { value: "standard_iii", label: "Class III" },
  { value: "standard_iv", label: "Class IV" },
  { value: "standard_v", label: "Class V" },
  { value: "standard_vi", label: "Class VI" },
];

const SECONDARY_STAGES: { value: HeadmasterStage; label: string }[] = [
  { value: "form_i", label: "Form I" },
  { value: "form_ii", label: "Form II" },
  { value: "form_iii", label: "Form III" },
  { value: "form_iv", label: "Form IV" },
];

export function stagesForHeadmaster(role?: UserRole) {
  return role === UserRole.PRIMARY_HEADMASTER ? PRIMARY_STAGES : SECONDARY_STAGES;
}

export function stageLabel(stage: string) {
  return [...PRIMARY_STAGES, ...SECONDARY_STAGES].find((item) => item.value === stage)?.label ?? stage;
}

export function HeadmasterStageSelector({
  role,
  value,
  onChange,
  title = "Choose a class or form",
  description = "Select a class or form to open the records for that group.",
}: {
  role: UserRole;
  value: HeadmasterStage | "";
  onChange: (stage: HeadmasterStage) => void;
  title?: string;
  description?: string;
}) {
  const stages = stagesForHeadmaster(role);
  const schoolBand = role === UserRole.PRIMARY_HEADMASTER ? "primary" : "secondary";
  const schoolName = portalSchoolName(schoolBand);
  const schoolBadge = schoolBand === "primary"
    ? "/eckernforde-english-medium-primary-badge.png"
    : "/eckernforde-cambridge-badge.png";
  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="border-b bg-primary/[0.03] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <img src={schoolBadge} alt={`${schoolName} badge`} className="h-10 w-10 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="mb-1 text-sm font-semibold text-muted-foreground">{schoolName}</p>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        {stages.map((stage) => {
          const selected = value === stage.value;
          return (
            <button
              key={stage.value}
              type="button"
              onClick={() => onChange(stage.value)}
              aria-pressed={selected}
              className={`flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/[0.07] text-primary ring-1 ring-primary/30" : "hover:border-primary/40 hover:bg-muted/40"}`}
            >
              {stage.label}
              {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
