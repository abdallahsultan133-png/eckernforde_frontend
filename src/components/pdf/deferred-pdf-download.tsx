import { useState, type ReactNode, type ComponentType } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export type PdfModule = {
  pdf: (document: ReactNode) => { toBlob: () => Promise<Blob> };
  DocumentComponent: ComponentType<Record<string, unknown>>;
};

type DeferredPdfDownloadProps = {
  fileName: string;
  documentProps: Record<string, unknown>;
  load: () => Promise<PdfModule>;
  onDownload?: () => void;
};

/** Keeps the PDF renderer out of the initial route payload while preserving a
 * single-click download action for every PDF button. */
export function DeferredPdfDownload({ fileName, documentProps, load, onDownload }: DeferredPdfDownloadProps) {
  const [module, setModule] = useState<PdfModule | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const loaded = module ?? await load();
      if (!module) setModule(loaded);
      const DocumentComponent = loaded.DocumentComponent;
      const blob = await loaded.pdf(<DocumentComponent {...documentProps} />).toBlob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = fileName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Give the browser time to start the download before releasing the blob,
      // which is important for slower mobile browsers.
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
      onDownload?.();
    } catch (error) {
      console.error("Unable to generate PDF", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" disabled={loading} onClick={handleDownload}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {loading ? "Downloading PDF" : loadError ? "Retry Download" : "Download PDF"}
    </Button>
  );
}
