import { useEffect, useRef, useState } from "react";
import { File, Loader2, Paperclip, X } from "lucide-react";
import { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME } from "@/constants";
import { signUploadParams } from "@/lib/cloudinary.ts";
import { cn } from "@/lib/utils.ts";
import { loadCloudinaryWidget } from "@/lib/load-cloudinary-widget";

export type FileUploadValue = {
  url: string;
  publicId: string;
  fileName: string;
};

type FileUploadWidgetProps = {
  value?: FileUploadValue | null;
  onChange: (value: FileUploadValue | null) => void;
  disabled?: boolean;
  maxFileSizeMb?: number;
};

const FileUploadWidget = ({ value = null, onChange, disabled = false, maxFileSizeMb = 10 }: FileUploadWidgetProps) => {
  const widgetRef = useRef<CloudinaryWidget | null>(null);
  const onChangeRef = useRef(onChange);
  const [preview, setPreview] = useState<FileUploadValue | null>(value);
  const [ready, setReady] = useState(false);

  useEffect(() => { setPreview(value); }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeWidget = () => {
      if (!window.cloudinary || widgetRef.current) return false;

      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          apiKey: CLOUDINARY_API_KEY,
          uploadSignature: signUploadParams,
          resourceType: "auto",
          multiple: false,
          folder: "uploads/attachments",
          maxFileSize: maxFileSizeMb * 1000 * 1000,
          clientAllowedFormats: ["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp", "ppt", "pptx", "xls", "xlsx", "txt"],
        },
        (error, result) => {
          if (!error && result.event === "success") {
            const payload: FileUploadValue = {
              url: result.info.secure_url,
              publicId: result.info.public_id,
              fileName: result.info.original_filename,
            };
            setPreview(payload);
            onChangeRef.current?.(payload);
          }
        }
      );
      setReady(true);
      return true;
    };

    let cancelled = false;
    void loadCloudinaryWidget().then(() => {
      if (!cancelled) initializeWidget();
    }).catch(() => { if (!cancelled) setReady(false); });
    return () => { cancelled = true; };
  }, [maxFileSizeMb]);

  const openWidget = () => {
    if (!disabled) widgetRef.current?.open();
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChangeRef.current?.(null);
  };

  if (preview) {
    return (
      <div className="flex items-center gap-3 rounded-md border p-3">
        <File className="h-5 w-5 shrink-0 text-muted-foreground" />
        <a href={preview.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm font-medium hover:underline">
          {preview.fileName}
        </a>
        {!disabled && (
          <button type="button" onClick={clear} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openWidget}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); openWidget(); } }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed p-6 text-center transition-colors hover:bg-accent",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      {ready ? <Paperclip className="h-5 w-5 text-muted-foreground" /> : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      <p className="text-sm font-medium">Click to attach a file</p>
      <p className="text-xs text-muted-foreground">PDF, DOC, PPT, XLS, or image up to {maxFileSizeMb}MB</p>
    </div>
  );
};

export default FileUploadWidget;
