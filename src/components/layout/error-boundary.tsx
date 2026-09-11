import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

/**
 * Catches render-time exceptions anywhere in the tree below it so a single
 * bad page doesn't white-screen the whole app. React error boundaries only
 * catch errors during render/lifecycle, not in event handlers or async code
 * — those are already handled per-page via try/catch + toast.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Unhandled render error:", error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center" role="alert" aria-live="assertive">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                        <AlertOctagon className="h-10 w-10 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            This page ran into an unexpected error. You can try reloading it.
                        </p>
                    </div>
                    <Button onClick={() => { this.setState({ error: null }); window.location.reload(); }}>
                        <RefreshCw className="mr-2 h-4 w-4" />Reload page
                    </Button>
                </main>
            );
        }

        return this.props.children;
    }
}
