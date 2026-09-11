import { useEffect, useRef, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME, BACKEND_BASE_URL } from "@/constants";
import { applyAvatarCrop, signUploadParams } from "@/lib/cloudinary.ts";
import { loadCloudinaryWidget } from "@/lib/load-cloudinary-widget";
import type { User } from "@/types";

const getInitials = (name = "") =>
  name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

// Refine keys every useGetIdentity query as ["auth", "identity"] (see
// @refinedev/core keys().auth().action("identity")). Refetching it re-runs
// authProvider.getIdentity, refreshing the avatar in the header, sidebar and
// this page in one go.
const IDENTITY_QUERY_KEY = ["auth", "identity"];

/**
 * Display-photo control for Profile & Settings. Opens the Cloudinary upload
 * widget (square crop), bakes the crop the user drew into the delivery URL
 * (the widget otherwise returns the full, uncropped image), persists that URL
 * to the user's account via PUT /profile/me/photo, then refreshes the cached
 * identity so the new photo replaces the initials avatar everywhere. "Remove"
 * clears it back to initials.
 */
export function AvatarUploader() {
  const { data: identity } = useGetIdentity<User>();
  const queryClient = useQueryClient();

  const widgetRef = useRef<CloudinaryWidget | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (url: string | null, publicId: string | null) => {
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/profile/me/photo`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, publicId }),
      });
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({})))?.error ?? "Failed to update photo");
      }
      // Force an immediate identity refetch so the avatar swaps now, not on the
      // next navigation.
      await queryClient.refetchQueries({ queryKey: IDENTITY_QUERY_KEY });
      toast.success(url ? "Photo updated." : "Photo removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update photo");
    } finally {
      setBusy(false);
    }
  };

  // The widget is built once; keep its success handler pointing at the latest
  // `save` closure (same pattern as components/upload-widget.tsx).
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  // Build the widget only when this authenticated profile screen is visited.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const init = () => {
      if (!window.cloudinary || widgetRef.current) return !!widgetRef.current;
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          apiKey: CLOUDINARY_API_KEY,
          uploadSignature: signUploadParams,
          multiple: false,
          folder: "uploads/avatars",
          maxFileSize: 5_000_000,
          clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
          cropping: true,
          croppingAspectRatio: 1,
          croppingShowDimensions: true,
          showSkipCropButton: false,
        },
        (error, result) => {
          if (!error && result.event === "success") {
            const cropBox = result.info.coordinates?.custom?.[0];
            void saveRef.current(
              applyAvatarCrop(result.info.secure_url, cropBox),
              result.info.public_id,
            );
          }
        },
      );
      return true;
    };

    let cancelled = false;
    void loadCloudinaryWidget().then(() => {
      if (!cancelled) init();
    }).catch((error) => console.warn("Avatar uploader unavailable:", error));
    return () => { cancelled = true; };
  }, []);

  const hasPhoto = !!identity?.image;

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <Avatar className="h-20 w-20">
          {identity?.image && <AvatarImage src={identity.image} alt={identity.name} />}
          <AvatarFallback className="text-xl">{getInitials(identity?.name)}</AvatarFallback>
        </Avatar>
        {busy && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Display photo</p>
        <p className="text-xs text-muted-foreground">
          Upload a photo so people see your face instead of your initials. Square, PNG or JPG, up to 5&nbsp;MB.
        </p>
        <div className="flex flex-wrap gap-2 pt-0.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => widgetRef.current?.open()}
          >
            <Camera className="mr-1.5 h-4 w-4" />
            {hasPhoto ? "Change photo" : "Upload photo"}
          </Button>
          {hasPhoto && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => save(null, null)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
