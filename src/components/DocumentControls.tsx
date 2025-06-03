
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RecipientOrderDialog, Recipient } from "@/components/RecipientOrderDialog";
import { Users, FileText, Signature, Settings } from "lucide-react";

interface Placeholder {
  id: string;
  type: "signature" | "text";
  label: string;
  x: number;
  y: number;
  page: number;
  value?: string;
  recipientId?: string;
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

  // Load recipients from localStorage when component mounts or documentId changes
  useEffect(() => {
    if (documentId) {
      const existingData = localStorage.getItem(documentId);
      if (existingData) {
        try {
          const saveData = JSON.parse(existingData);
          if (saveData.recipients) {
            setRecipients(saveData.recipients);
          }
        } catch (error) {
          console.error("Error loading recipients:", error);
        }
      }
    }
  }, [documentId]);

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

  const getTotalAssignedFields = () => {
    return placeholders.filter(p => p.recipientId).length;
  };

  const getFieldsForRecipient = (recipientId: string) => {
    return placeholders.filter(p => p.recipientId === recipientId);
  };

  return (
    <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Document Setup</h2>
      
      {!fileUrl && !file && (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
          <p className="text-gray-500">Document content not available</p>
          <p className="text-sm text-gray-400 mt-1">Upload the document again to continue</p>
        </div>
      )}

      {(file || fileUrl) && (
        <div className="space-y-6">
          {/* Document Info */}
          <div className="pb-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900 mb-1">Document</h3>
            <p className="text-sm text-gray-600 truncate">{file?.name || documentId?.substring(9, documentId.lastIndexOf('_'))}</p>
          </div>

          {/* Step 1: Recipients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">1. Who Signs?</h3>
              <Button 
                onClick={() => setRecipientDialogOpen(true)}
                variant="ghost"
                size="sm"
                disabled={isProcessing}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            {recipients.length > 0 ? (
              <div className="space-y-2">
                {recipients.map((recipient) => {
                  const assignedFields = getFieldsForRecipient(recipient.id);
                  return (
                    <div key={recipient.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                          {recipient.order}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{recipient.name}</div>
                          <div className="text-xs text-gray-500">{assignedFields.length} fields</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Button 
                onClick={() => setRecipientDialogOpen(true)}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                <Users className="h-4 w-4 mr-2" />
                Add Recipients
              </Button>
            )}
          </div>

          {/* Step 2: Signature */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">2. Your Signature</h3>
            {signatureImage ? (
              <div className="mb-3">
                <div className="border p-2 bg-gray-50 rounded">
                  <img 
                    src={signatureImage} 
                    alt="Your signature" 
                    className="max-h-8 object-contain"
                  />
                </div>
              </div>
            ) : null}
            
            <Button 
              onClick={onCreateSignature}
              variant={signatureImage ? "outline" : "default"}
              className="w-full"
              disabled={isProcessing}
            >
              {signatureImage ? "Update Signature" : "Create Signature"}
            </Button>
          </div>

          {/* Step 3: Progress & Actions */}
          {recipients.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">3. Complete Setup</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fields assigned:</span>
                  <span className="font-medium">{getTotalAssignedFields()}</span>
                </div>
                {signatureImage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Signatures placed:</span>
                    <span className="font-medium">{signatures.length}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {placeholders.length > 0 && (
                  <Button 
                    onClick={onSavePlaceholders}
                    variant="outline"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    Save Progress
                  </Button>
                )}
                
                {(signatureImage && signatures.length > 0 || placeholders.length > 0) && !signedPdfUrl && (
                  <Button 
                    onClick={onFinalizeDocument}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isProcessing || !file}
                  >
                    Finalize Document
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
