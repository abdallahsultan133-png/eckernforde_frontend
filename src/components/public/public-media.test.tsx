import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicMedia, PUBLIC_MEDIA } from "./public-media";

describe("PublicMedia asset sources", () => {
  it.each(["opening", "creative", "community"] as const)(
    "renders the %s responsive image set",
    (variant) => {
      const media = PUBLIC_MEDIA[variant];
      const { container } = render(
        <PublicMedia name={`test-${variant}`} image={variant} />
      );
      const image = container.querySelector("img");

      expect(image).not.toBeNull();
      expect(image?.getAttribute("src")).toBe(`${media.src}-1280.jpg`);
      expect(image?.getAttribute("srcset")).toContain(`${media.src}-640.jpg 640w`);
      expect(image?.getAttribute("srcset")).toContain(`${media.src}-1280.jpg 1280w`);
      expect(image?.getAttribute("srcset")).toContain(`${media.src}-1920.jpg 1920w`);
      expect(image?.getAttribute("alt")).toBe(media.alt);
    }
  );
});
