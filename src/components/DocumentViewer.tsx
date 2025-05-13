
import { useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Signature, MoveHorizontal } from "lucide-react";

// Set the worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface DocumentViewerProps {
  file: string;
  fileType: string;
  signatureImage: string | null;
  onApplySignature: (position: { x: number; y: number; page: number }) => void;
  isSigned: boolean;
  onRepositionSignature?: () => void;
}

export const DocumentViewer = ({
  file,
  fileType,
  signatureImage,
  onApplySignature,
  isSigned,
  onRepositionSignature,
}: DocumentViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [signingMode, setSigningMode] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  // Reset page number when file changes
  useEffect(() => {
    setPageNumber(1);
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!signingMode || !signatureImage) return;

    // Get the bounding rectangle of the clicked element
    const rect = documentRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate the position relative to the document viewer
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Apply signature at the calculated position
    onApplySignature({
      x: x / scale,
      y: y / scale,
      page: pageNumber - 1
    });
    
    setSigningMode(false);
  };

  const renderContent = () => {
    if (fileType.startsWith("application/pdf")) {
      return (
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-center py-10">Loading document...</div>}
          error={<div className="text-center py-10 text-red-500">Failed to load document</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      );
    } else if (fileType.startsWith("image/")) {
      return (
        <img 
          src={file} 
          alt="Document" 
          style={{ maxWidth: '100%', transform: `scale(${scale})`, transformOrigin: 'top left' }} 
        />
      );
    } else if (fileType.startsWith("text/") || fileType.includes("word")) {
      return (
        <div className="p-4 bg-white border rounded-md">
          <p className="text-center mb-4">
            {fileType.includes("word") 
              ? "Word document preview not available, but you can still sign this document" 
              : "Text document"}
          </p>
          {fileType.startsWith("text/") && (
            <iframe 
              src={file} 
              title="Text document" 
              className="w-full min-h-[500px] border"
            />
          )}
        </div>
      );
    }
    
    return (
      <div className="text-center py-10">Unsupported document type</div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 p-3 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-2">
          {fileType.startsWith("application/pdf") && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={pageNumber <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pageNumber} of {numPages || "?"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!numPages || pageNumber >= numPages}
              >
                Next
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            -
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            +
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {signatureImage && !isSigned && (
            <Button
              size="sm"
              onClick={() => setSigningMode(!signingMode)}
              className={signingMode ? "bg-green-600" : ""}
            >
              <Signature className="h-4 w-4 mr-2" />
              {signingMode ? "Cancel Signing" : "Place Signature"}
            </Button>
          )}
          
          {signatureImage && isSigned && onRepositionSignature && (
            <Button
              size="sm"
              onClick={onRepositionSignature}
              variant="outline"
            >
              <MoveHorizontal className="h-4 w-4 mr-2" />
              Reposition Signature
            </Button>
          )}
        </div>
      </div>

      <div
        className={`flex-1 overflow-auto p-4 flex justify-center ${
          signingMode ? "cursor-crosshair" : ""
        }`}
        ref={documentRef}
        onClick={signingMode ? handlePageClick : undefined}
      >
        <div>
          {renderContent()}
        </div>
      </div>

      {signingMode && (
        <div className="bg-blue-50 p-3 text-sm text-blue-700">
          Click anywhere on the document to place your signature
        </div>
      )}
    </div>
  );
};
