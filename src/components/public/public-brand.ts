import { APP_NAME, APP_TAGLINE } from "@/constants";

export const PUBLIC_BRAND = {
  name: APP_NAME,
  tagline: APP_TAGLINE,
  mark: "K",
  stages: [
    { label: "Nursery", href: "/academics/early-years", tone: "nursery" },
    { label: "Primary", href: "/academics/primary", tone: "primary" },
    { label: "Secondary", href: "/academics/secondary", tone: "secondary" },
  ],
} as const;

