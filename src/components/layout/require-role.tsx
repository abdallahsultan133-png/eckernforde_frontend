import type { ReactNode } from "react";
import { useGetIdentity } from "@refinedev/core";
import { Navigate } from "react-router";
import { Loader2 } from "lucide-react";
import type { User, UserRole } from "@/types";

/**
 * Route-level RBAC guard. The backend already rejects unauthorized requests
 * (requireRole middleware), but without this a signed-in user could still
 * navigate straight to a restricted route by URL — it just wasn't in their
 * sidebar menu. This blocks the route itself, not just the link to it.
 */
export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
    const { data: identity, isLoading } = useGetIdentity<User>();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!identity || !roles.includes(identity.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}
