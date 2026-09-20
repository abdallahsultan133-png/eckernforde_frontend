import { useState, type ReactNode, type ComponentType } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

type PdfDownloadLinkProps = {
  document: ReactNode;
  fileName: string;
  children: (state: { loading: boolean }) => ReactNode;
};

export type PdfModule = {
  PDFDownloadLink: ComponentType<PdfDownloadLinkProps>;
  DocumentComponent: ComponentType<Record<string, unknown>>;
};

type DeferredPdfDownloadProps = {
  fileName: string;
  documentProps: Record<string, unknown>;
  load: () => Promise<PdfModule>;
  onDownload?: () => void;
};

/** Keeps the PDF renderer out of the initial route payload. The renderer is
 * loaded only after a user explicitly asks to prepare a PDF. */
export function DeferredPdfDownload({ fileName, documentProps, load, onDownload }: DeferredPdfDownloadProps) {
  const [module, setModule] = useState<PdfModule | null>(null);
  const [loading, setLoading] = useState(false);

  if (module) {
    const PdfDownloadLink = module.PDFDownloadLink;
    const DocumentComponent = module.DocumentComponent;
    return (
      <PdfDownloadLink document={<DocumentComponent {...documentProps} />} fileName={fileName}>
        {({ loading: generating }) => (
          <Button size="sm" disabled={generating} onClick={() => !generating && onDownload?.()}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {generating ? "Preparing PDF" : "Download PDF"}
          </Button>
        )}
      </PdfDownloadLink>
    );
  }

  return (
    <Button size="sm" disabled={loading} onClick={async () => {
      setLoading(true);
      try {
        setModule(await load());
      } finally {
        setLoading(false);
      }
    }}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {loading ? "Loading PDF tools" : "Prepare PDF"}
    </Button>
  );
}
