import { Link } from "react-router";
import { AlertTriangle, Home, Lock } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export const NotFoundPage = () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
            <h1 className="text-5xl font-bold tracking-tight">404</h1>
            <p className="mt-2 text-xl font-semibold">Page not found</p>
            <p className="mt-1 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <Button asChild>
            <Link to="/portal"><Home className="mr-2 h-4 w-4" />Back to portal</Link>
        </Button>
    </div>
);

export const UnauthorizedPage = () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <Lock className="h-10 w-10 text-red-500" />
        </div>
        <div>
            <h1 className="text-5xl font-bold tracking-tight">403</h1>
            <p className="mt-2 text-xl font-semibold">Access denied</p>
            <p className="mt-1 text-sm text-muted-foreground">You don't have permission to view this page.</p>
        </div>
        <Button asChild>
            <Link to="/portal"><Home className="mr-2 h-4 w-4" />Back to portal</Link>
        </Button>
    </div>
);
