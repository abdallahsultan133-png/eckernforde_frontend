import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

type PublicCtaVariant = "primary" | "secondary" | "text" | "navigation" | "portal";

type PublicCtaProps = Omit<ComponentProps<typeof Link>, "children"> & {
  children: ReactNode;
  variant?: PublicCtaVariant;
  showArrow?: boolean;
};

export function PublicCta({
  children,
  variant = "primary",
  showArrow = false,
  className = "",
  ...props
}: PublicCtaProps) {
  return (
    <Link className={`public-cta public-cta--${variant} ${className}`.trim()} {...props}>
      <span>{children}</span>
      {showArrow ? <ArrowRight className="public-cta__icon" aria-hidden="true" /> : null}
    </Link>
  );
}

