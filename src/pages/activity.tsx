import { Link } from "react-router";
import { ArrowLeft, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { RecentActivity } from "@/components/dashboard/recent-activity";

const ActivityPage = () => {
    return (
        <PageContainer>
            <PageHeader
                above={
                    <Link
                        to="/portal"
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
      description="Recent announcements, homework, submissions, and administrative changes available to your role."
            />

            <RecentActivity limit={100} showReadMore={false} />
        </PageContainer>
    );
};

export default ActivityPage;
