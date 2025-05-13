
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "@/components/Upload";
import { DocumentViewer } from "@/components/DocumentViewer";
import { SignatureDialog } from "@/components/SignatureDialog";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number; page: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setSignedPdfUrl(null); // Reset signed PDF if a new document is uploaded
    setSignaturePosition(null); // Reset signature position
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
    
    setIsProcessing(true);
    setSignaturePosition(position);
    
    try {
      console.log("Applying signature at position:", position);
      console.log("File type:", file.type);
      
      // For PDF files
      if (file.type === "application/pdf") {
        // Load the PDF document
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Create a base64 string of the signature (removing data URL prefix)
        const signatureBase64 = signatureImage.split(',')[1];
        
        // Use Uint8Array instead of Buffer for browser compatibility
        const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
        
        // Embed the signature image
        const signatureEmbed = await pdfDoc.embedPng(signatureBytes);
        
        // Get the specified page
        const pages = pdfDoc.getPages();
        if (position.page >= pages.length) {
          throw new Error("Invalid page number");
        }
        
        const page = pages[position.page];
        const { width, height } = page.getSize();
        
        // Draw the signature on the page (adjusting position and size as needed)
        page.drawImage(signatureEmbed, {
          x: position.x,
          y: height - position.y - 50, // Flip Y-coordinate (PDF coordinate system starts from bottom-left)
          width: 200,
          height: 50,
        });
        
        // Save the modified PDF
        const pdfBytes = await pdfDoc.save();
        
        // Create a URL for the new PDF
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        setSignedPdfUrl(url);
      } else {
        // For other file types like images, create a canvas to composite the signature
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        const canvas = document.createElement('canvas');
        const sourceWidth = img.naturalWidth || img.width;
        const sourceHeight = img.naturalHeight || img.height;
        
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        
        // Draw the original image
        ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight);
        
        // Create and draw the signature image
        const sigImg = new Image();
        sigImg.src = signatureImage;
        
        await new Promise((resolve, reject) => {
          sigImg.onload = resolve;
          sigImg.onerror = reject;
        });
        
        // Signature dimensions - adjust as needed
        const sigWidth = 200;
        const sigHeight = 50;
        
        // Draw the signature at the specified position, making sure it's visible
        ctx.drawImage(sigImg, 
          Math.min(position.x, sourceWidth - sigWidth), 
          Math.min(position.y, sourceHeight - sigHeight), 
          sigWidth, sigHeight
        );
        
        // For Word documents or text files, create a placeholder signed version
        if (file.type.includes("word") || file.type.startsWith("text/")) {
          // Create a preview that shows the document with signature overlay
          ctx.fillStyle = "rgba(240, 240, 240, 0.8)";
          ctx.fillRect(0, 0, sourceWidth, sourceHeight);
          
          ctx.font = "24px Arial";
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.textAlign = "center";
          ctx.fillText("DOCUMENT SIGNED", sourceWidth / 2, sourceHeight / 2);
          
          // Draw the signature again so it's clearly visible
          ctx.drawImage(sigImg, 
            Math.min(position.x, sourceWidth - sigWidth), 
            Math.min(position.y, sourceHeight - sigHeight), 
            sigWidth, sigHeight
          );
        }
        
        // Convert canvas to data URL and create a blob URL
        const dataUrl = canvas.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png');
        const blob = await (await fetch(dataUrl)).blob();
        const url = URL.createObjectURL(blob);
        
        setSignedPdfUrl(url);
      }
      
      toast.success("Document signed", {
        description: "Your signature has been applied to the document.",
      });
    } catch (error) {
      console.error("Error applying signature:", error);
      toast.error("Error signing document", {
        description: "There was a problem applying your signature. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepositionSignature = () => {
    // Clear the signed URL and allow re-signing
    setSignedPdfUrl(null);
    
    toast.info("Reposition signature", {
      description: "Click anywhere to place your signature again.",
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
                    setSignaturePosition(null);
                  }}
                  className="w-full"
                  disabled={isProcessing}
                >
                  Upload New Document
                </Button>
                
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
                      Reposition Signature
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-full md:w-2/3 bg-white rounded-lg shadow overflow-hidden">
          {(file || signedPdfUrl) ? (
            <DocumentViewer 
              file={signedPdfUrl || URL.createObjectURL(file!)} 
              fileType={file?.type || ""}
              signatureImage={signatureImage}
              onApplySignature={handleApplySignature}
              isSigned={!!signedPdfUrl}
              onRepositionSignature={handleRepositionSignature}
            />
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
  );
};

export default Index;
