import { useState } from "react";

import { AdminCatalogSelector } from "@/components/academic/admin-catalog-selector.tsx";
import type { HeadmasterStage } from "@/components/academic/headmaster-stage-selector.tsx";
import type { SchoolLevel } from "@/components/academic/school-level-selector.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type AcademicYear = { id: number; name: string; active: boolean };

export function useSuperAdminSchoolScope(enabled: boolean, initial?: {
  schoolLevel?: SchoolLevel | "";
  stage?: HeadmasterStage | "";
  yearId?: string;
}) {
  const yearsQuery = useApiQuery<{ data: AcademicYear[] }>(enabled ? "/grades/academic-years" : null);
  const years = yearsQuery.data?.data ?? [];
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | "">(initial?.schoolLevel ?? "");
  const [stage, setStage] = useState<HeadmasterStage | "">(initial?.stage ?? "");
  const [yearId, setYearId] = useState(initial?.yearId ?? "");
  const reset = () => { setSchoolLevel(""); setStage(""); setYearId(""); };
  return { schoolLevel, setSchoolLevel, stage, setStage, yearId, setYearId, years, yearsLoading: yearsQuery.isLoading, yearsError: yearsQuery.isError, retryYears: yearsQuery.refetch, reset };
}

export function SuperAdminSchoolScopeSelector({ scope, includeStage = true, includeYear = true }: {
  scope: ReturnType<typeof useSuperAdminSchoolScope>;
  includeStage?: boolean;
  includeYear?: boolean;
}) {
  return <AdminCatalogSelector
    schoolLevel={scope.schoolLevel || null}
    academicYearId={scope.yearId}
    academicYears={scope.years}
    yearsLoading={scope.yearsLoading}
    yearsError={scope.yearsError}
    onSchoolLevelChange={(level) => { scope.setSchoolLevel(level); scope.setStage(""); scope.setYearId(""); }}
    onAcademicYearChange={scope.setYearId}
    onRetryYears={scope.retryYears}
    stage={includeStage ? scope.stage : undefined}
    onStageChange={includeStage ? (stage) => { scope.setStage(stage); scope.setYearId(""); } : undefined}
    showAcademicYear={includeYear}
    title="Choose school records"
    description="Select the school, class or form, and academic year to open the matching records."
  />;
}
