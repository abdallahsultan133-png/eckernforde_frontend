import { Navigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import Dashboard from "@/pages/dashboard.tsx";
import { Layout } from "@/components/layout/layout.tsx";

type PortalContextResponse = { data: { setupRequired: boolean; configurationRequired?: boolean } };

export default function PortalEntry() {
  const { data, isLoading, isError, refetch } = useApiQuery<PortalContextResponse>("/portal-context", { staleTime: 60_000 });
  // Keep the existing dashboard visible when React Query refreshes a stale
  // context in the background. Only the first request needs the full loader.
  if (isLoading && !data) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-80 w-full" /></div>;
  if (isError) return <ErrorState title="Unable to open your portal" description="Your school context could not be loaded." onRetry={refetch} />;
  if (data?.data.setupRequired) return <Navigate to="/portal/setup" replace />;
  return <Layout><Dashboard /></Layout>;
}
