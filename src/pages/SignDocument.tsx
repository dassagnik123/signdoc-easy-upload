
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DocumentViewer } from "@/components/DocumentViewer";
import { SignatureDialog } from "@/components/SignatureDialog";
import { PlaceholderSidebar } from "@/components/PlaceholderSidebar";
import { toast } from "sonner";
import { PDFDocument, rgb } from "pdf-lib";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ChevronLeft } from "lucide-react";

interface SignaturePosition {
  url: string;
  x: number;
  y: number;
  page: number;
}

interface Placeholder {
  id: string;
  type: "signature" | "text";
  label: string;
  x: number;
  y: number;
  page: number;
  value?: string;
}

const SignDocument = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<SignaturePosition[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [draggedPlaceholderId, setDraggedPlaceholderId] = useState<string | null>(null);

  // Load document and placeholders on component mount
  useEffect(() => {
    if (!documentId) {
      toast.error("No document specified", {
        description: "Please select a document from the home page.",
      });
      navigate('/');
      return;
    }

    // Load saved signature
    const savedSignature = localStorage.getItem('saved_signature');
    if (savedSignature) {
      setSignatureImage(savedSignature);
    }
    
    // Load document data
    loadDocumentFromStorage(documentId);
    
  }, [documentId, navigate]);
  
  const loadDocumentFromStorage = async (docId: string) => {
    // Try to load document content
    const fileContent = localStorage.getItem(`file_${docId}`);
    
    if (!fileContent) {
      // Load document placeholders to display even without the file content
      const savedData = localStorage.getItem(docId);
      
      if (!savedData) {
        toast.error("Document not found", {
          description: "The document you're trying to access doesn't exist.",
        });
        navigate('/');
        return;
      }
      
      try {
        // Even though we don't have the file content, we can still load the placeholders
        const { placeholders: savedPlaceholders } = JSON.parse(savedData);
        setPlaceholders(savedPlaceholders);
        
        // Extract file name from document ID
        const fileName = docId.substring(9, docId.lastIndexOf('_'));
        
        toast.warning("Document content not found", {
          description: `Placeholders for ${fileName} were loaded, but you'll need to re-upload the file.`,
        });
      } catch (error) {
        console.error("Error loading saved data:", error);
        toast.error("Error loading document data", {
          description: "There was a problem loading your document's data.",
        });
      }
      
      return;
    }
    
    try {
      // Convert DataURL back to File object
      const dataURLtoBlob = (dataURL: string) => {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };
      
      // Extract file name and size from document ID
      const fileName = docId.substring(9, docId.lastIndexOf('_'));
      const fileSize = parseInt(docId.substring(docId.lastIndexOf('_') + 1), 10);
      
      // Create File object
      const blob = dataURLtoBlob(fileContent);
      const fileObject = new File([blob], fileName, { 
        type: blob.type,
        lastModified: Date.now() 
      });
      
      // Set file and create object URL for viewing
      setFile(fileObject);
      setFileUrl(URL.createObjectURL(fileObject));
      
      // Load placeholders
      loadPlaceholders(docId);
      
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Error loading document", {
        description: "There was a problem loading your document.",
      });
    }
  };

  // Load placeholders from localStorage
  const loadPlaceholders = (docId: string) => {
    const savedData = localStorage.getItem(docId);
    
    if (savedData) {
      try {
        const { placeholders: savedPlaceholders } = JSON.parse(savedData);
        setPlaceholders(savedPlaceholders);
        
        // Also load any signatures from placeholders
        if (signatureImage) {
          const sigPlaceholders = savedPlaceholders.filter(p => p.type === "signature");
          
          // Add signatures based on placeholders
          const newSignatures = sigPlaceholders.map(p => ({
            url: signatureImage,
            x: p.x,
            y: p.y,
            page: p.page
          }));
          
          setSignatures(newSignatures);
        }
        
        toast.success("Document loaded", {
          description: `Loaded document with ${savedPlaceholders.length} placeholders`,
        });
        
        return true;
      } catch (error) {
        console.error("Error loading saved placeholders:", error);
        toast.error("Error loading placeholders", {
          description: "Failed to load saved placeholders for this document.",
        });
      }
    }
    
    return false;
  };

  // Save placeholders to localStorage
  const savePlaceholders = () => {
    if (!documentId) {
      toast.error("Document ID not found", {
        description: "Unable to save placeholders without a document ID.",
      });
      return;
    }

    const saveData = {
      placeholders,
      documentName: file?.name || documentId.substring(9, documentId.lastIndexOf('_')),
      savedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(documentId, JSON.stringify(saveData));
    
    toast.success("Placeholders saved", {
      description: `Saved ${placeholders.length} placeholders`,
    });
  };

  const handleSignatureCreate = (signatureDataUrl: string) => {
    setSignatureImage(signatureDataUrl);
    setSignatureOpen(false);
    
    // Save signature to localStorage for future use
    localStorage.setItem('saved_signature', signatureDataUrl);
    
    toast.success("Signature created", {
      description: "Your signature has been created and saved for future use.",
    });
  };

  const handleApplySignature = async (position: { x: number; y: number; page: number }) => {
    if (!fileUrl || !signatureImage) {
      toast.error("Error signing document", {
        description: "Both document and signature are required.",
      });
      return;
    }
    
    // Check if a signature already exists at this position and page
    const existingSignatureIndex = signatures.findIndex(
      sig => sig.x === position.x && sig.y === position.y && sig.page === position.page
    );

    // If a signature already exists at this position, don't add another one
    if (existingSignatureIndex !== -1) {
      return;
    }
    
    // Add the signature to the array - ensure we use the correct page number
    setSignatures((prev) => [
      ...prev,
      {
        url: signatureImage,
        x: position.x,
        y: position.y,
        page: position.page
      }
    ]);
    
    toast.success("Signature added", {
      description: "Click 'Done Signing' when you've placed all signatures.",
    });
  };

  const handleUpdatePlaceholders = (updatedPlaceholders: Placeholder[]) => {
    setPlaceholders(updatedPlaceholders);
    
    // Apply signature to any signature placeholders if we have a signature
    if (signatureImage) {
      const signaturePlaceholders = updatedPlaceholders.filter(p => p.type === "signature" && !p.value);
      
      // For each signature placeholder without a value, add our signature
      signaturePlaceholders.forEach(placeholder => {
        // Update the placeholder value
        placeholder.value = signatureImage;
        
        // Also add to signatures array for rendering
        handleApplySignature({
          x: placeholder.x,
          y: placeholder.y,
          page: placeholder.page
        });
      });
    }
  };

  // Placeholder movement functionality
  const handlePlaceholderDragStart = (placeholderId: string) => {
    setDraggedPlaceholderId(placeholderId);
  };

  const handlePlaceholderMove = (id: string, newX: number, newY: number) => {
    setPlaceholders(prev => 
      prev.map(p => 
        p.id === id 
          ? { ...p, x: newX, y: newY } 
          : p
      )
    );

    // Also update any associated signature
    const placeholder = placeholders.find(p => p.id === id);
    if (placeholder && placeholder.type === "signature" && placeholder.value) {
      setSignatures(prev => 
        prev.map(sig => 
          (sig.page === placeholder.page && 
           Math.abs(sig.x - placeholder.x) < 5 && 
           Math.abs(sig.y - placeholder.y) < 5)
            ? { ...sig, x: newX, y: newY }
            : sig
        )
      );
    }
  };

  // Signature movement handler
  const handleSignatureMove = (signatureIndex: number, newX: number, newY: number) => {
    console.log("Moving signature in parent component", signatureIndex, newX, newY);
    
    if (signatureIndex < 0 || signatureIndex >= signatures.length) {
      console.log("Invalid signature index:", signatureIndex);
      return;
    }
    
    setSignatures(prev => {
      const newSignatures = [...prev];
      const oldX = newSignatures[signatureIndex].x;
      const oldY = newSignatures[signatureIndex].y;
      const page = newSignatures[signatureIndex].page;
      
      console.log(`Updating signature from (${oldX}, ${oldY}) to (${newX}, ${newY}) on page ${page}`);
      
      newSignatures[signatureIndex] = {
        ...newSignatures[signatureIndex],
        x: newX,
        y: newY
      };
      return newSignatures;
    });
    
    // Also update any associated placeholder if needed
    const signature = signatures[signatureIndex];
    if (signature) {
      setPlaceholders(prev => 
        prev.map(p => 
          (p.type === "signature" && 
           p.page === signature.page && 
           Math.abs(p.x - signature.x) < 5 && 
           Math.abs(p.y - signature.y) < 5)
            ? { ...p, x: newX, y: newY }
            : p
        )
      );
    }
  };

  const handlePlaceholderDelete = (placeholderId: string) => {
    // Find the placeholder that was deleted
    const deletedPlaceholder = placeholders.find(p => p.id === placeholderId);
    
    if (deletedPlaceholder) {
      // Remove the placeholder from state
      setPlaceholders(prev => prev.filter(p => p.id !== placeholderId));
      
      // If it was a signature placeholder, also remove any signatures at that position
      if (deletedPlaceholder.type === "signature") {
        setSignatures(prev => prev.filter(sig => 
          !(sig.x === deletedPlaceholder.x && 
            sig.y === deletedPlaceholder.y && 
            sig.page === deletedPlaceholder.page)
        ));
      }
    }
  };

  const handleFinalizeDocument = async () => {
    if (!file || (signatures.length === 0 && placeholders.length === 0)) {
      toast.error("Cannot finalize document", {
        description: "Please add at least one signature or text field to the document.",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log("Applying signatures:", signatures);
      console.log("Applying placeholders:", placeholders);
      console.log("File type:", file.type);
      
      // For PDF files
      if (file.type === "application/pdf") {
        // Load the PDF document
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Process each signature
        for (const signature of signatures) {
          // Create a base64 string of the signature (removing data URL prefix)
          const signatureBase64 = signature.url.split(',')[1];
          
          // Use Uint8Array instead of Buffer for browser compatibility
          const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
          
          // Embed the signature image
          const signatureEmbed = await pdfDoc.embedPng(signatureBytes);
          
          // Get the specified page
          const pages = pdfDoc.getPages();
          if (signature.page >= pages.length) {
            throw new Error("Invalid page number");
          }
          
          const page = pages[signature.page];
          const { width, height } = page.getSize();
          
          // Draw the signature on the page
          page.drawImage(signatureEmbed, {
            x: signature.x,
            y: height - signature.y - 50, // Flip Y-coordinate (PDF coordinate system starts from bottom-left)
            width: 200,
            height: 50,
          });
        }

        // Process each text placeholder
        for (const placeholder of placeholders.filter(p => p.type === "text" && p.value)) {
          const pages = pdfDoc.getPages();
          if (placeholder.page >= pages.length) {
            continue; // Skip invalid pages
          }
          
          const page = pages[placeholder.page];
          const { height } = page.getSize();
          
          // Add text to PDF
          page.drawText(placeholder.value || placeholder.label, {
            x: placeholder.x,
            y: height - placeholder.y - 20, // Adjust Y position for PDF coordinates
            size: 12,
            color: rgb(0, 0, 0), 
          });
        }
        
        // Save the modified PDF
        const pdfBytes = await pdfDoc.save();
        
        // Create a URL for the new PDF
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        setSignedPdfUrl(url);
      } else {
        // For all non-PDF files (including Word documents, text files, and images)
        const canvas = document.createElement('canvas');
        
        // Set a reasonable default size for the document representation
        canvas.width = 800;
        canvas.height = 600;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        
        // For image files, draw the actual image as background
        if (file.type.startsWith("image/")) {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          
          // Update canvas dimensions to match image
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          
          // Draw the original image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
          // For Word documents or text files, create a placeholder
          ctx.fillStyle = "#f0f0f0";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add document title
          ctx.font = "24px Arial";
          ctx.fillStyle = "#333333";
          ctx.textAlign = "center";
          ctx.fillText("Signed Document", canvas.width / 2, 60);
          
          // Draw document icon
          ctx.font = "48px Arial";
          ctx.fillStyle = "#4287f5";
          ctx.textAlign = "center";
          ctx.fillText("📄", canvas.width / 2, canvas.height / 3);
          
          // Add message
          ctx.font = "18px Arial";
          ctx.fillStyle = "#666666";
          ctx.textAlign = "center";
          ctx.fillText("Document with applied signatures", canvas.width / 2, canvas.height / 3 + 60);
        }
        
        // Draw each signature on the document
        for (const signature of signatures) {
          const sigImg = new Image();
          sigImg.src = signature.url;
          
          await new Promise((resolve, reject) => {
            sigImg.onload = resolve;
            sigImg.onerror = reject;
          });
          
          // Signature dimensions
          const sigWidth = 200;
          const sigHeight = 50;
          
          // For safety, ensure coordinates are within canvas bounds
          const x = Math.min(Math.max(signature.x, 0), canvas.width - sigWidth);
          const y = Math.min(Math.max(signature.y, 0), canvas.height - sigHeight);
          
          // Draw the signature at the specified position
          ctx.drawImage(sigImg, x, y, sigWidth, sigHeight);
        }

        // Draw each text field on the document
        for (const placeholder of placeholders.filter(p => p.type === "text" && p.value)) {
          // For safety, ensure coordinates are within canvas bounds
          const x = Math.min(Math.max(placeholder.x, 0), canvas.width - 100);
          const y = Math.min(Math.max(placeholder.y, 0), canvas.height - 20);
          
          // Draw a light background for the text
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.fillRect(x, y, 150, 25);
          
          // Draw the text
          ctx.font = "14px Arial";
          ctx.fillStyle = "#000000";
          ctx.textAlign = "left";
          ctx.fillText(placeholder.value || "", x + 5, y + 17);
        }
        
        // Convert canvas to data URL and create a blob URL
        const mimeType = file.type.startsWith("image/") ? file.type : "image/png";
        const dataUrl = canvas.toDataURL(mimeType);
        const blob = await (await fetch(dataUrl)).blob();
        const url = URL.createObjectURL(blob);
        
        setSignedPdfUrl(url);
      }
      
      toast.success("Document finalized", {
        description: "All signatures and fields have been applied to the document.",
      });
    } catch (error) {
      console.error("Error applying signatures:", error);
      toast.error("Error finalizing document", {
        description: "There was a problem applying your signatures. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!signedPdfUrl) return;
    
    const a = document.createElement("a");
    a.href = signedPdfUrl;
    a.download = `signed-${file?.name || "document.pdf"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("Download started", {
      description: "Your signed document is being downloaded.",
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen flex flex-col gap-6 p-6 bg-gray-50">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            className="flex items-center" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
          <h1 className="text-2xl font-bold">
            {file ? file.name : documentId ? documentId.substring(9, documentId.lastIndexOf('_')) : "Document Signing"}
          </h1>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Document Controls</h2>
            
            {!fileUrl && !file && (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                <p className="text-gray-500">Document content not available</p>
                <p className="text-sm text-gray-400 mt-1">Upload the document again to continue</p>
              </div>
            )}

            {(file || fileUrl) && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Current Document</h3>
                  <p className="text-sm text-gray-600 truncate">{file?.name || documentId?.substring(9, documentId.lastIndexOf('_'))}</p>
                  <p className="text-xs text-gray-500">Type: {file?.type || "Unknown"}</p>
                </div>
                
                {/* Show signature preview */}
                {signatureImage && (
                  <div className="mb-3">
                    <h3 className="font-medium mb-1">Your Signature</h3>
                    <div className="border p-2 bg-gray-50 rounded-md">
                      <img 
                        src={signatureImage} 
                        alt="Your signature" 
                        className="max-h-12 object-contain"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => setSignatureOpen(true)}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {signatureImage ? "Change Signature" : "Create Signature"}
                  </Button>
                  
                  {placeholders.length > 0 && (
                    <Button 
                      onClick={savePlaceholders}
                      variant="outline"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      Save Placeholders ({placeholders.length})
                    </Button>
                  )}
                  
                  {(signatureImage && signatures.length > 0 || placeholders.length > 0) && !signedPdfUrl && (
                    <Button 
                      onClick={handleFinalizeDocument}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isProcessing || !file}
                    >
                      Finalize Document ({signatures.length} signatures, {placeholders.filter(p => p.type === "text" && p.value).length} text fields)
                    </Button>
                  )}
                  
                  {signedPdfUrl && (
                    <>
                      <Button 
                        onClick={handleDownload}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isProcessing}
                      >
                        Download Signed Document
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-2/3 flex flex-col bg-white rounded-lg shadow overflow-hidden">
            {(fileUrl || signedPdfUrl) ? (
              <>
                <DocumentViewer 
                  file={signedPdfUrl || fileUrl!} 
                  fileType={file?.type || ""}
                  signatureImage={signatureImage}
                  onApplySignature={handleApplySignature}
                  isSigned={!!signedPdfUrl}
                  signatures={!signedPdfUrl ? signatures : undefined}
                  onUpdatePlaceholders={handleUpdatePlaceholders}
                  onDeletePlaceholder={handlePlaceholderDelete}
                  onPlaceholderDragStart={handlePlaceholderDragStart}
                  onPlaceholderMove={handlePlaceholderMove}
                  draggedPlaceholderId={draggedPlaceholderId}
                  disableClickToSign={true}
                  onSignatureMove={handleSignatureMove}
                />
                {!signedPdfUrl && (fileUrl || file) && (
                  <PlaceholderSidebar />
                )}
              </>
            ) : (
              <div className="h-[600px] flex items-center justify-center text-gray-500">
                Document content not available. Upload again to view and sign.
              </div>
            )}
          </div>
        </div>

        <SignatureDialog 
          open={signatureOpen} 
          onOpenChange={setSignatureOpen}
          onSignatureCreate={handleSignatureCreate}
        />
      </div>
    </DndProvider>
  );
};

export default SignDocument;
