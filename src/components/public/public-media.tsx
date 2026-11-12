import { Camera } from "lucide-react";

export const PUBLIC_MEDIA = {
  opening: {
    src: "/images/kijani-hero",
    height: 768,
    alt: "Illustrative image of students working together on a practical project",
  },
  creative: {
    src: "/images/kijani-creative-learning",
    height: 1081,
    alt: "Illustrative image of creative learning",
  },
  community: {
    src: "/images/kijani-community-voice",
    height: 1440,
    alt: "Illustrative image of a school community",
  },
} as const;

export function PublicMedia({
  name,
  image,
  className = "",
  eager = false,
}: {
  name: string;
  image?: keyof typeof PUBLIC_MEDIA;
  className?: string;
  eager?: boolean;
}) {
  const media = image ? PUBLIC_MEDIA[image] : undefined;
  const label = name
    .replace(/-(welcome|film)$/, "")
    .replace(/-\d+$/, "")
    .replaceAll("-", " ");

  return (
    <div
      className={`ref-media ${media ? "has-image" : "is-placeholder"} ${className}`}
      data-placeholder={media ? undefined : `${name}-placeholder`}
    >
      {media ? (
        <>
          <img
            src={`${media.src}-1280.jpg`}
            srcSet={[640, 1280, 1920]
              .map((width) => `${media.src}-${width}.jpg ${width}w`)
              .join(", ")}
            sizes={
              eager
                ? "(max-width: 767px) 1600px, 100vw"
                : "(max-width: 767px) 90vw, 50vw"
            }
            alt={media.alt}
            width={1920}
            height={media.height}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            decoding="async"
          />
          <span className="ref-image-note">
            Illustrative image · school photograph to follow
          </span>
        </>
      ) : (
        <div className="ref-placeholder-label">
          <Camera size={25} strokeWidth={1} aria-hidden="true" />
          <span>{label.charAt(0).toUpperCase() + label.slice(1)}</span>
          <small>PHOTOGRAPH TO FOLLOW</small>
        </div>
      )}
    </div>
  );
}
