import { lazy, Suspense, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
const Attendance = lazy(() => import("./attendance-overview-chart").then(module => ({ default: module.AttendanceOverviewChart })));
const Performance = lazy(() => import("./performance-chart").then(module => ({ default: module.PerformanceChart })));
export function WorkspaceInsights({ personal = false }: { personal?: boolean }) {
  const [open,setOpen] = useState(false);
  return <details className="campus-insights" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Explore attendance and academic progress</summary>
    {open && <Suspense fallback={<Skeleton className="h-64 w-full" />}><div className="campus-insights-grid">
      <Attendance personal={personal} /><Performance personal={personal} showClassRanking={!personal} />
    </div></Suspense>}
  </details>;
}
