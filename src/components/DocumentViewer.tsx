import { useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Signature, MoveHorizontal, FileText } from "lucide-react";
import { renderAsync } from "docx-preview";

// Set the worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface DocumentViewerProps {
  file: string;
  fileType: string;
  signatureImage: string | null;
  onApplySignature: (position: { x: number; y: number; page: number }) => void;
  isSigned: boolean;
  onRepositionSignature?: () => void;
  signatures?: Array<{ url: string; x: number; y: number; page: number }>;
}

export const DocumentViewer = ({
  file,
  fileType,
  signatureImage,
  onApplySignature,
  isSigned,
  onRepositionSignature,
  signatures = [],
}: DocumentViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [signingMode, setSigningMode] = useState(false);
  const [isWordLoading, setIsWordLoading] = useState(false);
  const [wordError, setWordError] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wordContainerRef = useRef<HTMLDivElement>(null);

  // Reset page number when file changes
  useEffect(() => {
    setPageNumber(1);
    setWordError(null);
    
    // If this is a Word document, render it using docx-preview
    if ((fileType.includes("word") || fileType.includes("doc")) && wordContainerRef.current && !isSigned) {
      renderWordDocument();
    }
  }, [file, fileType]);

  const renderWordDocument = async () => {
    if (!wordContainerRef.current || !(fileType.includes("word") || fileType.includes("doc"))) return;
    
    setIsWordLoading(true);
    setWordError(null);
    
    try {
      // For files stored as URL (like Blob URLs)
      const response = await fetch(file);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      await renderAsync(arrayBuffer, wordContainerRef.current, null, {
        className: "docx-viewer",
        inWrapper: true,
        useBase64URL: true
      });
    } catch (error) {
      console.error("Error rendering Word document:", error);
      setWordError("Failed to render Word document. You can still sign it.");
    } finally {
      setIsWordLoading(false);
    }
  };

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
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate the position relative to the document viewer
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log("Click position:", { x, y, scale, rect });

    // Apply signature at the calculated position
    onApplySignature({
      x: x / scale,
      y: y / scale,
      page: pageNumber - 1
    });
  };

  const renderSignatures = () => {
    if (!signatures || signatures.length === 0) return null;

    // Filter signatures for the current page
    const currentPageSignatures = signatures.filter(
      (sig) => sig.page === pageNumber - 1
    );

    return currentPageSignatures.map((sig, index) => (
      <div
        key={`signature-${index}`}
        className="absolute pointer-events-none"
        style={{
          left: `${sig.x * scale}px`,
          top: `${sig.y * scale}px`,
          zIndex: 10,
        }}
      >
        <img
          src={sig.url}
          alt="Signature"
          style={{
            width: "200px",
            height: "50px",
            objectFit: "contain",
          }}
        />
      </div>
    ));
  };

  const renderContent = () => {
    if (fileType.startsWith("application/pdf")) {
      return (
        <div className="relative">
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
          {renderSignatures()}
        </div>
      );
    } else if (fileType.startsWith("image/")) {
      return (
        <div className="relative">
          <img 
            src={file} 
            alt="Document" 
            style={{ 
              maxWidth: '100%', 
              transform: `scale(${scale})`, 
              transformOrigin: 'top left' 
            }} 
          />
          {renderSignatures()}
        </div>
      );
    } else if (fileType.startsWith("text/")) {
      return (
        <div className="p-4 bg-white border rounded-md relative">
          <div className="w-full min-h-[500px] border overflow-auto">
            <iframe 
              src={file} 
              title="Text document" 
              className="w-full min-h-[500px] border"
            />
          </div>
          {renderSignatures()}
        </div>
      );
    } else if (fileType.includes("word") || fileType.includes("doc")) {
      return (
        <div className="p-4 bg-white border rounded-md flex flex-col items-center justify-center space-y-4 relative min-h-[600px]">
          {isWordLoading ? (
            <div className="text-center py-10">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
              <p>Loading Word document...</p>
            </div>
          ) : isSigned ? (
            <div className="text-center py-10 space-y-4">
              <FileText className="w-16 h-16 text-blue-600 mx-auto" />
              <h3 className="text-lg font-medium">Word Document</h3>
              <p className="text-center text-gray-500 max-w-md">
                Your signatures have been applied to this Word document.
              </p>
              <div className="p-4 border border-dashed border-gray-300 w-full max-w-lg min-h-[300px] flex items-center justify-center relative">
                <div className="text-center">
                  <p className="text-green-600 font-medium mb-2">Document Signed Successfully</p>
                  <p className="text-gray-500">Download to view your signed document</p>
                </div>
                {renderSignatures()}
              </div>
            </div>
          ) : wordError ? (
            <div className="text-center py-10 space-y-4">
              <FileText className="w-16 h-16 text-red-600 mx-auto" />
              <h3 className="text-lg font-medium">Word Document</h3>
              <p className="text-red-500">{wordError}</p>
              <div className="p-4 border border-dashed border-gray-300 w-full max-w-lg min-h-[300px] flex items-center justify-center relative">
                <div className="text-center">
                  <p className="text-gray-400">Click "Place Signature" to add signatures to this document</p>
                  {signatures && signatures.length > 0 && (
                    <p className="text-green-600 mt-2">{signatures.length} signature(s) added</p>
                  )}
                </div>
                {renderSignatures()}
              </div>
            </div>
          ) : (
            <div className="w-full relative">
              <div className="overflow-auto max-h-[600px] relative">
                <div 
                  ref={wordContainerRef} 
                  className="word-document-container relative min-h-[400px] bg-white"
                />
                {renderSignatures()}
              </div>
            </div>
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
          {signatureImage && (
            <Button
              size="sm"
              onClick={() => setSigningMode(!signingMode)}
              className={signingMode ? "bg-green-600" : ""}
            >
              <Signature className="h-4 w-4 mr-2" />
              {signingMode ? "Done Signing" : "Place Signature"}
            </Button>
          )}
          
          {signatureImage && isSigned && onRepositionSignature && (
            <Button
              size="sm"
              onClick={onRepositionSignature}
              variant="outline"
            >
              <MoveHorizontal className="h-4 w-4 mr-2" />
              Reposition Signatures
            </Button>
          )}
        </div>
      </div>

      <div
        className={`flex-1 overflow-auto p-4 flex justify-center ${
          signingMode ? "cursor-crosshair" : ""
        }`}
        ref={documentRef}
      >
        <div 
          ref={contentRef}
          onClick={signingMode ? handlePageClick : undefined}
          className={signingMode ? "cursor-crosshair relative" : "relative"}
        >
          {renderContent()}
        </div>
      </div>

      {signingMode && (
        <div className="bg-blue-50 p-3 text-sm text-blue-700">
          Click anywhere on the document to place your signature. Click "Done Signing" when finished.
        </div>
      )}
    </div>
  );
};
