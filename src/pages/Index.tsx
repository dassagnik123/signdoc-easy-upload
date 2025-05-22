
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "@/components/Upload";
import { DocumentViewer } from "@/components/DocumentViewer";
import { SignatureDialog } from "@/components/SignatureDialog";
import { PlaceholderSidebar } from "@/components/PlaceholderSidebar";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<SignaturePosition[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  
  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setSignedPdfUrl(null); // Reset signed PDF if a new document is uploaded
    setSignatures([]); // Reset signatures array
    setPlaceholders([]); // Reset placeholders array
    toast.success("Document uploaded", {
      description: `${uploadedFile.name} has been uploaded successfully.`,
    });
  };

  const handleSignatureCreate = (signatureDataUrl: string) => {
    setSignatureImage(signatureDataUrl);
    setSignatureOpen(false);
    toast.success("Signature created", {
      description: "Your signature has been created successfully.",
    });
  };

  const handleApplySignature = async (position: { x: number; y: number; page: number }) => {
    if (!file || !signatureImage) {
      toast.error("Error signing document", {
        description: "Both document and signature are required.",
      });
      return;
    }
    
    // Add the signature to the array instead of immediately processing the document
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
            color: { r: 0, g: 0, b: 0 },
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

  const handleRepositionSignature = () => {
    // Clear the signed URL and allow re-signing
    setSignedPdfUrl(null);
    // Note: We're not clearing placeholders to preserve any text fields
    setSignatures([]);
    
    toast.info("Reposition signatures", {
      description: "Click anywhere to place your signatures again.",
    });
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
        <header className="text-center">
          <h1 className="text-3xl font-bold mb-2">Document Signing App</h1>
          <p className="text-gray-600">Upload a document and add your digital signature</p>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Document Controls</h2>
            
            {!file && (
              <Upload onFileUpload={handleFileUpload} />
            )}

            {file && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Current Document</h3>
                  <p className="text-sm text-gray-600 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">Type: {file.type || "Unknown"}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => setSignatureOpen(true)}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {signatureImage ? "Change Signature" : "Create Signature"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFile(null);
                      setSignedPdfUrl(null);
                      setSignatures([]);
                      setPlaceholders([]);
                    }}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    Upload New Document
                  </Button>
                  
                  {(signatureImage && signatures.length > 0 || placeholders.length > 0) && !signedPdfUrl && (
                    <Button 
                      onClick={handleFinalizeDocument}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
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
                      
                      <Button
                        variant="outline"
                        onClick={handleRepositionSignature}
                        className="w-full"
                        disabled={isProcessing}
                      >
                        Reposition Signatures
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-2/3 flex flex-col bg-white rounded-lg shadow overflow-hidden">
            {(file || signedPdfUrl) ? (
              <>
                <DocumentViewer 
                  file={signedPdfUrl || URL.createObjectURL(file!)} 
                  fileType={file?.type || ""}
                  signatureImage={signatureImage}
                  onApplySignature={handleApplySignature}
                  isSigned={!!signedPdfUrl}
                  onRepositionSignature={handleRepositionSignature}
                  signatures={!signedPdfUrl ? signatures : undefined}
                  onUpdatePlaceholders={handleUpdatePlaceholders}
                />
                {!signedPdfUrl && file && (
                  <PlaceholderSidebar />
                )}
              </>
            ) : (
              <div className="h-[600px] flex items-center justify-center text-gray-500">
                Upload a document to get started
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

export default Index;
