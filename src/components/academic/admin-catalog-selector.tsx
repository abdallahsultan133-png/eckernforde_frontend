import { useState } from "react";
import { CalendarDays, Check } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { HeadmasterStageSelector, type HeadmasterStage } from "@/components/academic/headmaster-stage-selector.tsx";
import { UserRole } from "@/types";

export type CatalogSchoolLevel = "primary" | "secondary";
export type CatalogAcademicYear = { id: number; name: string; startsOn?: string; endsOn?: string; active: boolean };

export function useAdminCatalogSelection(isAdmin: boolean, fixedSchoolLevel: CatalogSchoolLevel | null = null) {
  const [schoolLevel, setSchoolLevel] = useState<CatalogSchoolLevel | null>(null);
  const [academicYearId, setAcademicYearId] = useState("");
  const yearsQuery = useApiQuery<{ data: CatalogAcademicYear[] }>(isAdmin ? "/grades/academic-years" : null);
  const academicYears = yearsQuery.data?.data ?? [];

  const selectedSchoolLevel = fixedSchoolLevel ?? schoolLevel;

  const selectSchoolLevel = (value: CatalogSchoolLevel) => {
    if (fixedSchoolLevel) return;
    setSchoolLevel(value);
    setAcademicYearId("");
  };

  const resetSelection = () => {
    if (!fixedSchoolLevel) setSchoolLevel(null);
    setAcademicYearId("");
  };

  return {
    schoolLevel: selectedSchoolLevel,
    academicYearId,
    academicYears,
    yearsLoading: yearsQuery.isLoading,
    yearsError: yearsQuery.isError,
    retryYears: yearsQuery.refetch,
    selectSchoolLevel,
    selectAcademicYear: setAcademicYearId,
    resetSelection,
    ready: Boolean(selectedSchoolLevel && academicYearId),
  };
}

export function AdminCatalogSelector({
  schoolLevel,
  academicYearId,
  academicYears,
  yearsLoading,
  yearsError,
  onSchoolLevelChange,
  onAcademicYearChange,
  onRetryYears,
  showSchoolLevel = true,
  showAcademicYear = true,
  stage,
  onStageChange,
  title = "Choose an academic catalogue",
  description = "Select the school level and academic year to open the matching subjects and classes.",
}: {
  schoolLevel: CatalogSchoolLevel | null;
  academicYearId: string;
  academicYears: CatalogAcademicYear[];
  yearsLoading: boolean;
  yearsError: boolean;
  onSchoolLevelChange: (value: CatalogSchoolLevel) => void;
  onAcademicYearChange: (value: string) => void;
  onRetryYears: () => void;
  showSchoolLevel?: boolean;
  showAcademicYear?: boolean;
  stage?: HeadmasterStage | "";
  onStageChange?: (value: HeadmasterStage) => void;
  title?: string;
  description?: string;
}) {
  return (
    <Card className="mx-auto max-w-3xl overflow-hidden border-primary/20 shadow-sm">
      <CardHeader className="border-b bg-primary/[0.03] p-6 sm:p-8">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1 leading-6">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 sm:p-8">
        {showSchoolLevel && <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">1. School level</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["primary", "Primary school", "View the primary academic catalogue."],
              ["secondary", "Secondary school", "View the secondary academic catalogue."],
            ] as const).map(([value, label, description]) => {
              const selected = schoolLevel === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSchoolLevelChange(value)}
                  aria-pressed={selected}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/[0.06] ring-1 ring-primary/30" : "hover:border-primary/40 hover:bg-muted/40"}`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                    {selected && <Check className="h-3 w-3" aria-hidden="true" />}
                  </span>
                  <span>
                    <strong className="block text-sm font-medium">{label}</strong>
                    <small className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>}

        {schoolLevel && onStageChange && <HeadmasterStageSelector
          role={schoolLevel === "primary" ? UserRole.PRIMARY_HEADMASTER : UserRole.SECONDARY_HEADMASTER}
          value={stage ?? ""}
          onChange={onStageChange}
          title="Choose a class or form"
          description="Select the class or form whose subjects you want to view."
        />}

        {showAcademicYear && <div className="space-y-3">
          <label className="text-sm font-semibold" htmlFor="admin-catalog-year">{onStageChange ? "3." : showSchoolLevel ? "2." : "1."} Academic year</label>
          {yearsLoading ? <Skeleton className="h-10 w-full" /> : yearsError ? (
            <button type="button" onClick={onRetryYears} className="block text-sm text-destructive underline underline-offset-4">
              Unable to load academic years. Try again.
            </button>
          ) : (
            <Select value={academicYearId} onValueChange={onAcademicYearChange} disabled={!schoolLevel || Boolean(onStageChange && !stage) || academicYears.length === 0}>
            <SelectTrigger id="admin-catalog-year" className="h-11 w-full" aria-label="Select academic year">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder={schoolLevel || !showSchoolLevel ? "Choose an academic year" : "Choose a school level first"} />
                </span>
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " · Current" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {schoolLevel && academicYearId && <p className="text-xs text-muted-foreground">Your {schoolLevel} catalogue is ready to open.</p>}
        </div>}
      </CardContent>
    </Card>
  );
}
