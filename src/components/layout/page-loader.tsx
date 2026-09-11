import { Loader2 } from "lucide-react";

/** Suspense fallback shown while a lazily-loaded route chunk downloads. */
export const PageLoader = () => (
    <div className="flex min-h-[50vh] w-full items-center justify-center" role="status" aria-label="Loading page">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
);
