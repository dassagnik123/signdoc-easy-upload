import { useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Signature, MoveHorizontal, FileText } from "lucide-react";
import { renderAsync } from "docx-preview";
import { useDrop } from "react-dnd";

// Set the worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Placeholder {
  id: string;
  type: "signature" | "text";
  label: string;
  x: number;
  y: number;
  page: number;
  value?: string;
  recipientId?: string;
  category?: "sender" | "recipient"; // Add category support
}

interface DocumentViewerProps {
  file: string;
  fileType: string;
  signatureImage: string | null;
  onApplySignature: (position: { x: number; y: number; page: number }) => void;
  isSigned: boolean;
  onRepositionSignature?: () => void;
  signatures?: Array<{ url: string; x: number; y: number; page: number }>;
  placeholders?: Placeholder[]; // Add placeholders prop
  onUpdatePlaceholders?: (placeholders: Placeholder[]) => void;
  onDeletePlaceholder?: (placeholderId: string) => void;
  onPlaceholderDragStart?: (placeholderId: string) => void;
  onPlaceholderMove?: (placeholderId: string, newX: number, newY: number) => void;
  draggedPlaceholderId?: string | null;
  disableClickToSign?: boolean;
  onSignatureMove?: (signatureIndex: number, newX: number, newY: number) => void;
}

export const DocumentViewer = ({
  file,
  fileType,
  signatureImage,
  onApplySignature,
  isSigned,
  signatures = [],
  onUpdatePlaceholders,
  onDeletePlaceholder,
  onPlaceholderDragStart,
  onPlaceholderMove,
  draggedPlaceholderId,
  disableClickToSign = false,
  onSignatureMove,
  placeholders: externalPlaceholders,
}: DocumentViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [signingMode, setSigningMode] = useState(false);
  const [isWordLoading, setIsWordLoading] = useState(false);
  const [wordError, setWordError] = useState<string | null>(null);
  const [isDraggingPlaceholder, setIsDraggingPlaceholder] = useState(false);
  const [isDraggingSignature, setIsDraggingSignature] = useState(false);
  const [draggingSignatureIndex, setDraggingSignatureIndex] = useState<number | null>(null);
  
  // Add missing state variables for placeholder editing
  const [editingPlaceholderId, setEditingPlaceholderId] = useState<string | null>(null);
  const [placeholderText, setPlaceholderText] = useState("");
  
  // Placeholders state for form fields
  const [internalPlaceholders, setInternalPlaceholders] = useState<Placeholder[]>([]);
  const placeholders = externalPlaceholders || internalPlaceholders;
  const setPlaceholders = onUpdatePlaceholders ? 
    (updater: React.SetStateAction<Placeholder[]>) => {
      const newPlaceholders = typeof updater === 'function' ? updater(placeholders) : updater;
      onUpdatePlaceholders(newPlaceholders);
    } : setInternalPlaceholders;
  
  const documentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wordContainerRef = useRef<HTMLDivElement>(null);

  // Reset page number when file changes
  useEffect(() => {
    setPageNumber(1);
    setWordError(null);
    
    // If this is a Word document, render it using docx-preview
    if ((fileType.includes("word") || fileType.includes("doc")) && !isSigned) {
      renderWordDocument();
    }
  }, [file, fileType]);

  // Pass placeholders to parent component when they change
  useEffect(() => {
    if (onUpdatePlaceholders) {
      onUpdatePlaceholders(placeholders);
    }
  }, [placeholders, onUpdatePlaceholders]);

  const renderWordDocument = async () => {
    if (!(fileType.includes("word") || fileType.includes("doc"))) return;
    
    setIsWordLoading(true);
    setWordError(null);
    
    try {
      // Make sure the container exists first
      if (!wordContainerRef.current) {
        console.error("Word container ref is null");
        setWordError("Failed to render Word document. You can still sign it.");
        setIsWordLoading(false);
        return;
      }
      
      // Clear the container before rendering
      wordContainerRef.current.innerHTML = '';
      
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

  // Improved page click handler to prevent unwanted clicks during dragging
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't handle clicks if we're in dragging mode
    if (isDraggingSignature || isDraggingPlaceholder) return;
    
    // Otherwise continue with original functionality
    if (disableClickToSign || !signingMode || !signatureImage) return;

    // Get the bounding rectangle of the clicked element
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate the position relative to the document viewer
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Apply signature at the calculated position
    onApplySignature({
      x: x / scale,
      y: y / scale,
      page: pageNumber - 1 // Page index should be 0-based
    });
  };

  const handlePlaceholderMouseDown = (e: React.MouseEvent, placeholderId: string) => {
    // Don't start dragging if we're clicking on a button or control
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    e.stopPropagation(); // Stop event from propagating to parent elements
    setIsDraggingPlaceholder(true);
    if (onPlaceholderDragStart) {
      onPlaceholderDragStart(placeholderId);
    }
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleSignatureMouseDown = (e: React.MouseEvent, signatureIndex: number) => {
    // Don't start dragging if we're clicking on a button or control
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    e.stopPropagation(); // Prevent PDF from getting the click event
    e.preventDefault(); // Prevent default behaviors like text selection
    
    console.log("Signature drag started", signatureIndex);
    setIsDraggingSignature(true);
    setDraggingSignatureIndex(signatureIndex);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!contentRef.current) return;
    
    const rect = contentRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Handle placeholder dragging
    if (isDraggingPlaceholder && draggedPlaceholderId && onPlaceholderMove) {
      onPlaceholderMove(draggedPlaceholderId, x, y);
    }
    
    // Handle signature dragging
    if (isDraggingSignature && draggingSignatureIndex !== null && onSignatureMove) {
      console.log("Moving signature", draggingSignatureIndex, "to", x, y);
      onSignatureMove(draggingSignatureIndex, x, y);
    }
  };

  const handleMouseUp = () => {
    if (isDraggingSignature) {
      console.log("Signature drag ended");
    }
    
    setIsDraggingPlaceholder(false);
    setIsDraggingSignature(false);
    setDraggingSignatureIndex(null);
  };

  // Add event listeners for mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };
    
    if (isDraggingPlaceholder || isDraggingSignature) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingPlaceholder, isDraggingSignature]);

  const renderSignatures = () => {
    if (!signatures || signatures.length === 0) return null;

    // Filter signatures for the current page
    const currentPageSignatures = signatures.filter(
      (sig) => sig.page === pageNumber - 1 // Match the current page (0-based index)
    );

    return currentPageSignatures.map((sig, index) => {
      // Find the actual index in the original signatures array
      const originalIndex = signatures.findIndex(
        (s) => s.page === sig.page && s.x === sig.x && s.y === sig.y
      );
      
      return (
        <div
          key={`signature-${index}`}
          className={`absolute ${!isSigned ? 'cursor-move border-2 border-transparent hover:border-blue-300' : 'pointer-events-none'}`}
          style={{
            left: `${sig.x * scale}px`,
            top: `${sig.y * scale}px`,
            zIndex: draggingSignatureIndex === originalIndex ? 20 : 10,
            touchAction: 'none', // Prevents scrolling when dragging on touch devices
          }}
          onMouseDown={(e) => !isSigned && handleSignatureMouseDown(e, originalIndex)}
        >
          <img
            src={sig.url}
            alt="Signature"
            style={{
              width: "200px",
              height: "50px",
              objectFit: "contain",
              pointerEvents: "none", // Make sure the image doesn't interfere with dragging
            }}
            draggable={false} // Disable browser's native drag
          />
        </div>
      );
    });
  };

  const handleDeletePlaceholder = (id: string) => {
    setPlaceholders(prev => prev.filter(p => p.id !== id));
    if (onDeletePlaceholder) {
      onDeletePlaceholder(id);
    }
    
    if (editingPlaceholderId === id) {
      setEditingPlaceholderId(null);
      setPlaceholderText("");
    }
  };

  const handleEditPlaceholder = (id: string) => {
    const placeholder = placeholders.find(p => p.id === id);
    if (placeholder) {
      setEditingPlaceholderId(id);
      setPlaceholderText(placeholder.value || "");
    }
  };

  const handleSavePlaceholder = () => {
    if (editingPlaceholderId) {
      setPlaceholders(prev => 
        prev.map(p => 
          p.id === editingPlaceholderId 
            ? { ...p, value: placeholderText } 
            : p
        )
      );
      setEditingPlaceholderId(null);
      setPlaceholderText("");
    }
  };

  const renderPlaceholders = () => {
    // Filter placeholders for current page
    const currentPagePlaceholders = placeholders.filter(
      p => p.page === pageNumber - 1 // Match current page (0-based index)
    );
    
    return currentPagePlaceholders.map(placeholder => (
      <div
        key={placeholder.id}
        className={`absolute border-2 border-dashed ${
          draggedPlaceholderId === placeholder.id 
            ? 'border-green-500' 
            : placeholder.category === 'sender' 
              ? 'border-blue-400' 
              : 'border-purple-400'
        } p-2 ${
          placeholder.category === 'sender' 
            ? 'bg-blue-50' 
            : 'bg-purple-50'
        } bg-opacity-30 min-w-[100px] min-h-[40px] cursor-move`}
        style={{
          left: `${placeholder.x * scale}px`,
          top: `${placeholder.y * scale}px`,
          zIndex: 15,
          touchAction: 'none',
        }}
        onMouseDown={(e) => handlePlaceholderMouseDown(e, placeholder.id)}
      >
        {placeholder.type === "signature" && placeholder.value ? (
          <img
            src={placeholder.value}
            alt="Signature"
            className="max-w-[200px] max-h-[50px] object-contain pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col">
            <div className={`text-xs font-medium ${
              placeholder.category === 'sender' ? 'text-blue-600' : 'text-purple-600'
            }`}>
              {placeholder.label}
            </div>
            {placeholder.category && (
              <div className="text-xs text-gray-500 italic">
                {placeholder.category === 'sender' ? 'Sender' : 'Recipient'}
              </div>
            )}
            {placeholder.recipientId && (
              <div className="text-xs text-gray-500 italic">Assigned to recipient</div>
            )}
            {placeholder.value ? (
              <div className="text-sm">{placeholder.value}</div>
            ) : (
              <div 
                className="text-xs text-gray-400 italic cursor-pointer"
                onClick={() => handleEditPlaceholder(placeholder.id)}
              >
                Click to edit
              </div>
            )}
          </div>
        )}
        
        {/* Edit/Delete controls */}
        <div className="absolute top-0 right-0 bg-white rounded-bl-md border border-gray-200 flex">
          {placeholder.type === "text" && (
            <button 
              onClick={() => handleEditPlaceholder(placeholder.id)}
              className="p-1 text-blue-500 hover:bg-blue-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
          <button 
            onClick={() => handleDeletePlaceholder(placeholder.id)}
            className="p-1 text-red-500 hover:bg-red-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        </div>
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
              <div className="overflow-auto max-h-[600px] relative mb-4">
                <div 
                  ref={wordContainerRef} 
                  className="word-document-container relative min-h-[400px] bg-white p-4"
                >
                  {/* Fallback in case docx-preview fails but doesn't throw an error */}
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-blue-600 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">Word Document</h3>
                    <p className="text-gray-500 mt-2">
                      Word document preview may not be available, but you can still sign it.
                    </p>
                  </div>
                </div>
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

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "PLACEHOLDER",
    drop: (item: { type: "signature" | "text"; label: string; category: "sender" | "recipient" }, monitor) => {
      const dropOffset = monitor.getClientOffset();
      if (dropOffset && contentRef.current) {
        const contentRect = contentRef.current.getBoundingClientRect();
        const x = dropOffset.x - contentRect.left;
        const y = dropOffset.y - contentRect.top;
        
        addPlaceholder(item.type, item.label, x / scale, y / scale, item.category);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Function to add a new placeholder with category and auto-populate signature for sender
  const addPlaceholder = (type: "signature" | "text", label: string, x: number, y: number, category: "sender" | "recipient") => {
    console.log("Adding placeholder:", { type, label, x, y, category });
    
    // Auto-populate signature for sender if available
    let initialValue = "";
    if (type === "signature" && category === "sender" && signatureImage) {
      initialValue = signatureImage;
      console.log("Auto-populating sender signature");
    }

    const newPlaceholder: Placeholder = {
      id: `placeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label,
      x,
      y,
      page: pageNumber - 1, // Store 0-based page index
      value: initialValue,
      category,
    };
    
    console.log("Creating new placeholder:", newPlaceholder);
    
    // Add to existing placeholders instead of replacing
    setPlaceholders(prev => {
      const updated = [...prev, newPlaceholder];
      console.log("Updated placeholders:", updated);
      return updated;
    });
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
      </div>

      <div
        className={`flex-1 overflow-auto p-4 flex justify-center ${
          isOver ? "bg-blue-50" : ""
        }`}
        ref={documentRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          ref={(node) => {
            // Combine the drop ref with the content ref
            drop(node);
            contentRef.current = node;
          }}
          className="relative"
          onClick={handlePageClick}
        >
          {renderContent()}
          {renderPlaceholders()}
        </div>
      </div>
      
      {/* Edit placeholder modal */}
      {editingPlaceholderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-3">
              Edit {placeholders.find(p => p.id === editingPlaceholderId)?.label}
            </h3>
            <textarea
              value={placeholderText}
              onChange={(e) => setPlaceholderText(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mb-3"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingPlaceholderId(null)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlaceholder}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
