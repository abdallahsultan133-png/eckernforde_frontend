import { Check } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { portalSchoolName } from "@/lib/school-brand.ts";

export type SchoolLevel = "primary" | "secondary";

export function SchoolCardSelector({ value, onChange }: {
  value: SchoolLevel | "";
  onChange: (value: SchoolLevel) => void;
}) {
  return <Card>
    <CardHeader className="pb-4">
      <CardTitle className="text-base">1. Choose a school</CardTitle>
      <CardDescription>Choose a school first. Its classes, forms, and academic years will follow.</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
      {(["primary", "secondary"] as const).map((school) => <button
        key={school}
        type="button"
        aria-pressed={value === school}
        onClick={() => onChange(school)}
        className={`flex min-h-28 items-start gap-3 border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value === school ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center" aria-hidden="true">
          <img src={school === "primary" ? "/eckernforde-english-medium-primary-badge.png" : "/eckernforde-cambridge-badge.png"} alt="" className="h-full w-full object-contain" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{portalSchoolName(school)}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{school === "primary" ? "Kindergarten, Nursery and Class I–VI" : "Form I–IV"}</span>
        </span>
        {value === school && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
      </button>)}
    </CardContent>
  </Card>;
}

export function SchoolLevelSelector({ value, onChange, label = "School" }: {
  value: SchoolLevel | "";
  onChange: (value: SchoolLevel) => void;
  label?: string;
}) {
  return (
    <label className="block max-w-xl space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as SchoolLevel)}>
        <SelectTrigger aria-label={`Choose ${label.toLowerCase()}`} className="h-11 w-full">
          <SelectValue placeholder="Choose a school" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="primary">{portalSchoolName("primary")}</SelectItem>
          <SelectItem value="secondary">{portalSchoolName("secondary")}</SelectItem>
        </SelectContent>
      </Select>
    </label>
  );
}
