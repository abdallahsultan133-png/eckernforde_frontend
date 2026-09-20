import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Shared vertical rhythm for operational portal pages. */
export function PageContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1600px] space-y-6 pb-10", className)}
      {...props}
    />
  );
}

