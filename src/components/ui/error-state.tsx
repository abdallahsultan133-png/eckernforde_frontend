import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({
    title = "Something went wrong",
    description = "We couldn't load this data. Please try again.",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-6 py-10 text-center",
                className
            )}
        >
            <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
            {onRetry && (
                <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={onRetry}>
                    <RotateCw className="h-3.5 w-3.5" />
                    Retry
                </Button>
            )}
        </div>
    );
}
