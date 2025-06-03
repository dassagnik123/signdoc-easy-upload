
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RecipientOrderDialog, Recipient } from "@/components/RecipientOrderDialog";
import { Users } from "lucide-react";

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
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);

  const handleSaveRecipients = (newRecipients: Recipient[]) => {
    setRecipients(newRecipients);
    
    // Save recipients to localStorage for the current document
    if (documentId) {
      const existingData = localStorage.getItem(documentId);
      let saveData: any = {};
      
      if (existingData) {
        try {
          saveData = JSON.parse(existingData);
        } catch (error) {
          console.error("Error parsing existing data:", error);
        }
      }
      
      saveData.recipients = newRecipients;
      saveData.savedAt = new Date().toISOString();
      
      localStorage.setItem(documentId, JSON.stringify(saveData));
    }
  };

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

          {/* Recipients Section */}
          <div>
            <h3 className="font-medium mb-2">Recipients & Signing Order</h3>
            {recipients.length > 0 ? (
              <div className="space-y-2 mb-3">
                {recipients.map((recipient, index) => (
                  <div key={recipient.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                      {recipient.order}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{recipient.name}</div>
                      <div className="text-gray-500 text-xs">{recipient.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-3">No recipients set</p>
            )}
            
            <Button 
              onClick={() => setRecipientDialogOpen(true)}
              variant="outline"
              className="w-full"
              disabled={isProcessing}
            >
              <Users className="h-4 w-4 mr-2" />
              {recipients.length > 0 ? "Edit Recipients" : "Set Recipients"}
            </Button>
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

      <RecipientOrderDialog
        open={recipientDialogOpen}
        onOpenChange={setRecipientDialogOpen}
        onSave={handleSaveRecipients}
        initialRecipients={recipients}
      />
    </div>
  );
};
