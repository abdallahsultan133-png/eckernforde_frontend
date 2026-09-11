import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface QuickAction {
    label: string;
    href: string;
    icon: LucideIcon;
}

interface QuickActionsProps {
    actions: QuickAction[];
    description?: string;
    highlight?: { message: string; href: string };
}

export function QuickActions({ actions, description = "Jump straight into your most common tasks.", highlight }: QuickActionsProps) {
    return (
        <Card>
            <CardContent className="space-y-4 p-6">
                <h2 className="text-xl font-semibold">Quick Actions</h2>
                <p className="text-muted-foreground">{description}</p>

                {highlight && (
                    <Link
                        to={highlight.href}
                        className="block rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
                    >
                        {highlight.message} →
                    </Link>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                    {actions.map((action) => (
                        <Link
                            key={action.label}
                            to={action.href}
                            className="group/qa flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover/qa:bg-primary group-hover/qa:text-primary-foreground">
                                <action.icon className="h-[18px] w-[18px]" />
                            </span>
                            <span className="flex-1 text-sm font-medium">{action.label}</span>
                            <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover/qa:translate-x-0 group-hover/qa:opacity-100" />
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
