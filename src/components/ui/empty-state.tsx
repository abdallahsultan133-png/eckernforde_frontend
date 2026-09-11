import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
    label: string;
    to: string;
}

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: EmptyStateAction;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-6 py-10 text-center",
                className
            )}
        >
            <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{title}</p>
            {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
            {action && (
                <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link to={action.to}>{action.label}</Link>
                </Button>
            )}
        </div>
    );
}
