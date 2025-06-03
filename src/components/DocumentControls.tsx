
import React from "react";
import { Button } from "@/components/ui/button";

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

interface DocumentControlsProps {
  file: File | null;
  fileUrl: string | null;
  documentId: string | undefined;
  signatureImage: string | null;
  signatures: SignaturePosition[];
  placeholders: Placeholder[];
  signedPdfUrl: string | null;
  isProcessing: boolean;
  onCreateSignature: () => void;
  onSavePlaceholders: () => void;
  onFinalizeDocument: () => void;
  onDownload: () => void;
}

export const DocumentControls: React.FC<DocumentControlsProps> = ({
  file,
  fileUrl,
  documentId,
  signatureImage,
  signatures,
  placeholders,
  signedPdfUrl,
  isProcessing,
  onCreateSignature,
  onSavePlaceholders,
  onFinalizeDocument,
  onDownload,
}) => {
  return (
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
              onClick={onCreateSignature}
              className="w-full"
              disabled={isProcessing}
            >
              {signatureImage ? "Change Signature" : "Create Signature"}
            </Button>
            
            {placeholders.length > 0 && (
              <Button 
                onClick={onSavePlaceholders}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                Save Placeholders ({placeholders.length})
              </Button>
            )}
            
            {(signatureImage && signatures.length > 0 || placeholders.length > 0) && !signedPdfUrl && (
              <Button 
                onClick={onFinalizeDocument}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isProcessing || !file}
              >
                Finalize Document ({signatures.length} signatures, {placeholders.filter(p => p.type === "text" && p.value).length} text fields)
              </Button>
            )}
            
            {signedPdfUrl && (
              <Button 
                onClick={onDownload}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isProcessing}
              >
                Download Signed Document
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
