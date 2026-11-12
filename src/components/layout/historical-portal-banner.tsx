import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query";
import { portalSchoolName } from "@/lib/school-brand";

export type HistoricalPortalContext = {
  academicYearId: number;
  schoolBand: "primary" | "secondary";
  stage: string;
  academicYear: { id: number; name: string; startsOn: string; endsOn: string };
  classes: Array<{ id: number; name: string }>;
};

export const stageLabel = (stage: string) => stage.split("_").map((part) => /^(i|ii|iii|iv|v|vi|vii)$/.test(part) ? part.toUpperCase() : `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");

export function useHistoricalPortal() {
  return useApiQuery<{ data: { archiveContext: HistoricalPortalContext | null } }>("/portal-context", { staleTime: 0 });
}

export function HistoricalPortalBanner() {
  const { data } = useHistoricalPortal();
  const context = data?.data.archiveContext;
  const [closing, setClosing] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  if (!context) return null;

  const close = async () => {
    setClosing(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/portal-context/teacher-history/close`, { method: "POST", credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Could not return to the current year.");
      await queryClient.resetQueries();
      navigate("/portal", { replace: true });
      toast.success("Current teaching year restored.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not return to the current year.");
    } finally {
      setClosing(false);
    }
  };

  return <div className="border-b border-amber-300/70 bg-amber-50 px-4 py-2.5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
    <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5 text-sm">
        <Archive className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p><strong>Previous-year portal:</strong> {context.academicYear.name} · {portalSchoolName(context.schoolBand)} · {stageLabel(context.stage)} <span className="text-xs opacity-75">(read only)</span></p>
      </div>
      <Button size="sm" variant="outline" onClick={close} disabled={closing} className="border-amber-400 bg-background/80 hover:bg-background">
        {closing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <X className="mr-1.5 h-4 w-4" />}Return to current year
      </Button>
    </div>
  </div>;
}
