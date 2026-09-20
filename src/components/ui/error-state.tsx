import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    variant?: "panel" | "inline";
    className?: string;
}

export function ErrorState({
    title = "Something went wrong",
    description = "We couldn't load this data. Please try again.",
    onRetry,
    variant = "panel",
    className,
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 border-destructive/25 bg-destructive/[0.04] text-left",
                variant === "panel" && "border-y px-4 py-8 sm:px-6",
                variant === "inline" && "border-l-2 px-3 py-3",
                className
            )}
            role="alert"
        >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="mt-0.5 max-w-2xl text-sm leading-5 text-muted-foreground">{description}</p>
                {onRetry && (
                    <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={onRetry}>
                        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Try again
                    </Button>
                )}
            </div>
        </div>
    );
}
