
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

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setSignedPdfUrl(null); // Reset signed PDF if a new document is uploaded
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
    if (!file || !signatureImage) return;

    try {
      // Load the PDF document
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Create a base64 string of the signature (removing data URL prefix)
      const signatureBase64 = signatureImage.split(',')[1];
      
      // Embed the signature image
      const signatureImageBytes = Buffer.from(signatureBase64, 'base64');
      const signatureEmbed = await pdfDoc.embedPng(signatureImageBytes);
      
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
      
      toast.success("Document signed", {
        description: "Your signature has been applied to the document.",
      });
    } catch (error) {
      console.error("Error applying signature:", error);
      toast.error("Error signing document", {
        description: "There was a problem applying your signature.",
      });
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
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => setSignatureOpen(true)}
                  className="w-full"
                >
                  {signatureImage ? "Change Signature" : "Create Signature"}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFile(null);
                    setSignedPdfUrl(null);
                  }}
                  className="w-full"
                >
                  Upload New Document
                </Button>
                
                {signedPdfUrl && (
                  <Button 
                    onClick={handleDownload}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Download Signed Document
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-full md:w-2/3 bg-white rounded-lg shadow overflow-hidden">
          {(file || signedPdfUrl) ? (
            <DocumentViewer 
              file={signedPdfUrl || URL.createObjectURL(file!)} 
              signatureImage={signatureImage}
              onApplySignature={handleApplySignature}
              isSigned={!!signedPdfUrl}
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
