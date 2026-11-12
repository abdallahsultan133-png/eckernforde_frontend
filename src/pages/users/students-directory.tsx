import { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useNavigate } from "react-router";
import { GraduationCap } from "lucide-react";

import { AdminCatalogSelector, useAdminCatalogSelection } from "@/components/academic/admin-catalog-selector.tsx";
import { HeadmasterStageSelector, type HeadmasterStage } from "@/components/academic/headmaster-stage-selector.tsx";
import { SuperAdminSchoolScopeSelector, useSuperAdminSchoolScope } from "@/components/academic/super-admin-school-scope.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { UserRole, type User } from "@/types";

export default function StudentsDirectoryPage() {
  const { data: identity } = useGetIdentity<User>();
  const navigate = useNavigate();
  const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;
  const headmasterSchoolLevel = identity?.role === UserRole.PRIMARY_HEADMASTER
    ? "primary"
    : identity?.role === UserRole.SECONDARY_HEADMASTER ? "secondary" : null;
  const superAdminScope = useSuperAdminSchoolScope(isSuperAdmin);
  const headmasterScope = useAdminCatalogSelection(Boolean(headmasterSchoolLevel), headmasterSchoolLevel);
  const [headmasterStage, setHeadmasterStage] = useState<HeadmasterStage | "">("");
  const schoolLevel = isSuperAdmin ? superAdminScope.schoolLevel : headmasterScope.schoolLevel ?? "";
  const stage = isSuperAdmin ? superAdminScope.stage : headmasterStage;
  const academicYearId = isSuperAdmin ? superAdminScope.yearId : headmasterScope.academicYearId;
  const scopeReady = Boolean(schoolLevel && stage && academicYearId);

  useEffect(() => {
    if (!scopeReady) return;
    navigate(`/students/selected?${new URLSearchParams({ schoolLevel, stage, academicYearId }).toString()}`);
  }, [academicYearId, navigate, schoolLevel, scopeReady, stage]);

  return <PageContainer>
    <PageHeader
      breadcrumb
      showBackLink={false}
      title={<span className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-muted-foreground" />Students</span>}
      description={isSuperAdmin ? "Choose a school, class or form, and academic year to open its students." : "Choose a class or form and academic year to open its students."}
    />
    {isSuperAdmin ? <SuperAdminSchoolScopeSelector scope={superAdminScope} /> : headmasterSchoolLevel && identity?.role ? <div className="space-y-4">
      <HeadmasterStageSelector
        role={identity.role}
        value={headmasterStage}
        onChange={(value) => { setHeadmasterStage(value); headmasterScope.selectAcademicYear(""); }}
        title="Choose a class or form"
        description="Select the class or form whose students you want to view."
      />
      <AdminCatalogSelector
        schoolLevel={headmasterScope.schoolLevel}
        academicYearId={headmasterScope.academicYearId}
        academicYears={headmasterScope.academicYears}
        yearsLoading={headmasterScope.yearsLoading}
        yearsError={headmasterScope.yearsError}
        onSchoolLevelChange={headmasterScope.selectSchoolLevel}
        onAcademicYearChange={headmasterScope.selectAcademicYear}
        onRetryYears={headmasterScope.retryYears}
        showSchoolLevel={false}
        title="Choose an academic year"
        description="Select the year for the chosen class or form."
      />
    </div> : null}
  </PageContainer>;
}
