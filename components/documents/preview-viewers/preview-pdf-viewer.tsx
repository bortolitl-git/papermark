import { useEffect, useRef, useState } from "react";

import { Document, Page, pdfjs } from "react-pdf";

import { DocumentPreviewData } from "@/lib/types/document-preview";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PreviewPdfViewerProps {
  documentData: DocumentPreviewData;
  onClose: () => void;
}

/**
 * Renders a PDF directly from its file URL using react-pdf (pdf.js).
 * Used for documents that have no pre-rendered page images — e.g. self-hosted
 * setups without background conversion. pdf.js fetches the bytes and renders to
 * canvas, so it works regardless of the file's Content-Disposition.
 */
export function PreviewPdfViewer({ documentData }: PreviewPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // cap width for readability on wide screens
        setPageWidth(Math.min(containerRef.current.clientWidth - 32, 900));
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full overflow-auto p-4">
      <Document
        file={documentData.file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            Loading PDF…
          </div>
        }
        error={
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            Failed to load PDF.
          </div>
        }
        className="flex flex-col items-center gap-4"
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={`page_${i + 1}`}
            pageNumber={i + 1}
            width={pageWidth || undefined}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            className="overflow-hidden rounded shadow"
          />
        ))}
      </Document>
    </div>
  );
}
