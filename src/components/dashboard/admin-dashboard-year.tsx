import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { SchoolLevelSelector, type SchoolLevel } from "@/components/academic/school-level-selector.tsx";

type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string; active: boolean };
type YearContextValue = {
  role?: "primary_headmaster" | "secondary_headmaster" | "super_admin";
  selectedYearId: string;
  setSelectedYearId: (value: string) => void;
  years: AcademicYear[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  withYear: (path: string) => string | null;
  selectedStage: string;
  setSelectedStage: (value: string) => void;
  withScope: (path: string) => string | null;
  selectedSchoolLevel: SchoolLevel | "";
  setSelectedSchoolLevel: (value: SchoolLevel | "") => void;
};

const YearContext = createContext<YearContextValue | null>(null);

export function AdminDashboardYearProvider({ children, role }: { children: ReactNode; role?: YearContextValue["role"] }) {
  const yearsQuery = useApiQuery<{ data: AcademicYear[] }>("/grades/academic-years");
  const years = yearsQuery.data?.data ?? [];
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<SchoolLevel | "">("");

  useEffect(() => {
    if (!years.length) {
      setSelectedYearId("");
      return;
    }
    if (!years.some((year) => String(year.id) === selectedYearId)) {
      setSelectedYearId(String(years.find((year) => year.active)?.id ?? years[0].id));
    }
  }, [years, selectedYearId]);

  const withYear = useCallback((path: string) => {
    if (!selectedYearId || (role === "super_admin" && !selectedSchoolLevel)) return null;
    const separator = path.includes("?") ? "&" : "?";
    const school = role === "super_admin" ? `&schoolLevel=${encodeURIComponent(selectedSchoolLevel)}` : "";
    return `${path}${separator}academicYearId=${encodeURIComponent(selectedYearId)}${school}`;
  }, [role, selectedSchoolLevel, selectedYearId]);


  const withScope = useCallback((path: string) => {
    const yearPath = withYear(path);
    if (!yearPath || !selectedStage) return role === "super_admin" ? null : yearPath;
    return `${yearPath}&stage=${encodeURIComponent(selectedStage)}`;
  }, [role, selectedStage, withYear]);

  const value = useMemo<YearContextValue>(() => ({
    role,
    selectedYearId,
    setSelectedYearId,
    years,
    selectedStage,
    setSelectedStage,
    withScope,
    selectedSchoolLevel,
    setSelectedSchoolLevel,
    isLoading: yearsQuery.isLoading,
    isError: yearsQuery.isError,
    refetch: () => { void yearsQuery.refetch(); },
    withYear,
  }), [role, selectedYearId, setSelectedYearId, selectedStage, setSelectedStage, selectedSchoolLevel, setSelectedSchoolLevel, years, yearsQuery.isLoading, yearsQuery.isError, yearsQuery.refetch, withYear, withScope]);

  return <YearContext.Provider value={value}>{children}</YearContext.Provider>;
}

export function useAdminDashboardYear() {
  const context = useContext(YearContext);
  return context ?? {
    selectedYearId: "",
    setSelectedYearId: () => undefined,
    years: [] as AcademicYear[],
    isLoading: false,
    selectedStage: "",
    setSelectedStage: () => undefined,
    withScope: (path: string) => path,
    selectedSchoolLevel: "" as SchoolLevel | "",
    setSelectedSchoolLevel: () => undefined,
    isError: false,
    refetch: () => undefined,
    withYear: (path: string) => path,
  };
}

export function AdminDashboardYearSelector({ variant = "compact" }: { variant?: "compact" | "family" }) {
  const { selectedYearId, setSelectedYearId, selectedStage, setSelectedStage, selectedSchoolLevel, setSelectedSchoolLevel, years, role, isLoading, isError, refetch } = useAdminDashboardYear();
  const visibleYears = role === "primary_headmaster" || role === "secondary_headmaster"
    ? years.filter((year) => year.active)
    : years;

  if (isError) {
    return <button type="button" onClick={refetch} className="text-sm text-destructive underline underline-offset-4">Unable to load academic year. Retry</button>;
  }

  if (variant === "family") {
    return <div className="family-selector admin-dashboard-year-selector">
      <label htmlFor="dashboard-academic-year">Academic year</label>
      <select
        id="dashboard-academic-year"
        aria-label="Choose dashboard academic year"
        value={selectedYearId}
        onChange={(event) => { setSelectedYearId(event.target.value); if (selectedStage) setSelectedStage(""); }}
        disabled={isLoading || visibleYears.length === 0}
      >
        {!selectedYearId && <option value="">Choose academic year</option>}
        {visibleYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.active ? " · Current" : ""}</option>)}
      </select>
    </div>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {role === "super_admin" && <SchoolLevelSelector value={selectedSchoolLevel} onChange={(level) => { setSelectedSchoolLevel(level); setSelectedStage(""); }} />}
      <label className="flex h-8 min-w-40 items-center gap-1.5 rounded-none border bg-background px-2 text-xs shadow-sm">
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="shrink-0 font-medium text-muted-foreground">Year</span>
        <Select value={selectedYearId} onValueChange={(value) => { setSelectedYearId(value); if (selectedStage) setSelectedStage(""); }} disabled={isLoading || visibleYears.length === 0}>
          <SelectTrigger aria-label="Choose dashboard academic year" className="!h-7 min-w-0 flex-1 !rounded-none border-0 p-0 text-xs shadow-none focus:ring-0">
            <SelectValue placeholder="Choose academic year" />
          </SelectTrigger>
          <SelectContent>{visibleYears.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}</SelectItem>)}</SelectContent>
        </Select>
      </label>
    </div>
  );
}

export function HeadmasterDashboardClassFormSelector({ role }: { role: "primary_headmaster" | "secondary_headmaster" | "super_admin" }) {
  const { selectedStage, setSelectedStage, selectedSchoolLevel } = useAdminDashboardYear();
  const selectedRole = role === "super_admin" ? selectedSchoolLevel === "secondary" ? "secondary_headmaster" : "primary_headmaster" : role;
  const selectorLabel = selectedRole === "secondary_headmaster" ? "Select form" : "Select class";
  const options = selectedRole === "primary_headmaster"
    ? [["nursery", "Nursery"], ["kindergarten_i", "KG I"], ["kindergarten_ii", "KG II"], ["kindergarten_iii", "KG III"], ["standard_i", "Class I"], ["standard_ii", "Class II"], ["standard_iii", "Class III"], ["standard_iv", "Class IV"], ["standard_v", "Class V"], ["standard_vi", "Class VI"]]
    : [["form_i", "Form I"], ["form_ii", "Form II"], ["form_iii", "Form III"], ["form_iv", "Form IV"]];
  return (
    <label className="flex h-9 min-w-32 items-center gap-2 rounded-lg border bg-background px-3 text-sm shadow-sm">
      <Select value={selectedStage} onValueChange={setSelectedStage}>
        <SelectTrigger aria-label={selectorLabel} disabled={role === "super_admin" && !selectedSchoolLevel} className="h-8 border-0 p-0 shadow-none focus:ring-0">
          <SelectValue placeholder={selectorLabel} />
        </SelectTrigger>
        <SelectContent>{options.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
      </Select>
    </label>
  );
}
