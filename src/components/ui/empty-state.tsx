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
    variant?: "panel" | "inline";
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, variant = "panel", className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 text-left",
                variant === "panel" && "border-y border-border bg-muted/20 px-4 py-8 sm:px-6",
                variant === "inline" && "py-3",
                className
            )}
        >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                {description && <p className="mt-0.5 max-w-2xl text-sm leading-5 text-muted-foreground">{description}</p>}
                {action && (
                    <Button asChild size="sm" variant="outline" className="mt-3">
                        <Link to={action.to}>{action.label}</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
