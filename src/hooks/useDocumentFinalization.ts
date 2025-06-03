
import { useState } from "react";
import { toast } from "sonner";
import { PDFDocument, rgb } from "pdf-lib";

interface Placeholder {
  id: string;
  type: "signature" | "text";
  label: string;
  x: number;
  y: number;
  page: number;
  value?: string;
}

interface SignaturePosition {
  url: string;
  x: number;
  y: number;
  page: number;
}

export const useDocumentFinalization = () => {
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFinalizeDocument = async (
    file: File | null,
    signatures: SignaturePosition[],
    placeholders: Placeholder[]
  ) => {
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
      
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        for (const signature of signatures) {
          const signatureBase64 = signature.url.split(',')[1];
          const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
          const signatureEmbed = await pdfDoc.embedPng(signatureBytes);
          
          const pages = pdfDoc.getPages();
          if (signature.page >= pages.length) {
            throw new Error("Invalid page number");
          }
          
          const page = pages[signature.page];
          const { width, height } = page.getSize();
          
          page.drawImage(signatureEmbed, {
            x: signature.x,
            y: height - signature.y - 50,
            width: 200,
            height: 50,
          });
        }

        for (const placeholder of placeholders.filter(p => p.type === "text" && p.value)) {
          const pages = pdfDoc.getPages();
          if (placeholder.page >= pages.length) {
            continue;
          }
          
          const page = pages[placeholder.page];
          const { height } = page.getSize();
          
          page.drawText(placeholder.value || placeholder.label, {
            x: placeholder.x,
            y: height - placeholder.y - 20,
            size: 12,
            color: rgb(0, 0, 0), 
          });
        }
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        setSignedPdfUrl(url);
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        
        if (file.type.startsWith("image/")) {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = "#f0f0f0";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.font = "24px Arial";
          ctx.fillStyle = "#333333";
          ctx.textAlign = "center";
          ctx.fillText("Signed Document", canvas.width / 2, 60);
          
          ctx.font = "48px Arial";
          ctx.fillStyle = "#4287f5";
          ctx.textAlign = "center";
          ctx.fillText("📄", canvas.width / 2, canvas.height / 3);
          
          ctx.font = "18px Arial";
          ctx.fillStyle = "#666666";
          ctx.textAlign = "center";
          ctx.fillText("Document with applied signatures", canvas.width / 2, canvas.height / 3 + 60);
        }
        
        for (const signature of signatures) {
          const sigImg = new Image();
          sigImg.src = signature.url;
          
          await new Promise((resolve, reject) => {
            sigImg.onload = resolve;
            sigImg.onerror = reject;
          });
          
          const sigWidth = 200;
          const sigHeight = 50;
          
          const x = Math.min(Math.max(signature.x, 0), canvas.width - sigWidth);
          const y = Math.min(Math.max(signature.y, 0), canvas.height - sigHeight);
          
          ctx.drawImage(sigImg, x, y, sigWidth, sigHeight);
        }

        for (const placeholder of placeholders.filter(p => p.type === "text" && p.value)) {
          const x = Math.min(Math.max(placeholder.x, 0), canvas.width - 100);
          const y = Math.min(Math.max(placeholder.y, 0), canvas.height - 20);
          
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.fillRect(x, y, 150, 25);
          
          ctx.font = "14px Arial";
          ctx.fillStyle = "#000000";
          ctx.textAlign = "left";
          ctx.fillText(placeholder.value || "", x + 5, y + 17);
        }
        
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

  const handleDownload = (file: File | null) => {
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

  return {
    signedPdfUrl,
    isProcessing,
    handleFinalizeDocument,
    handleDownload
  };
};
