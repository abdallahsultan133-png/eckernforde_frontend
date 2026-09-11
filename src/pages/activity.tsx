import { Link } from "react-router";
import { ArrowLeft, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { RecentActivity } from "@/components/dashboard/recent-activity";

const ActivityPage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                above={
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to dashboard
                    </Link>
                }
                title={
                    <span className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        All Activity
                    </span>
                }
                description="Every recent announcement, assignment, and submission across the school."
            />

            <RecentActivity limit={100} showReadMore={false} />
        </div>
    );
};

export default ActivityPage;
