
import { useParams } from "react-router-dom";
import { SignatureDialog } from "@/components/SignatureDialog";
import { RecipientPlaceholderSidebar } from "@/components/RecipientPlaceholderSidebar";
import { DocumentViewer } from "@/components/DocumentViewer";
import { DocumentHeader } from "@/components/DocumentHeader";
import { DocumentControls } from "@/components/DocumentControls";
import { useDocumentLoader } from "@/hooks/useDocumentLoader";
import { useSignatureManagement } from "@/hooks/useSignatureManagement";
import { usePlaceholderManagement } from "@/hooks/usePlaceholderManagement";
import { useDocumentFinalization } from "@/hooks/useDocumentFinalization";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useState, useEffect } from "react";

interface Recipient {
  id: string;
  name: string;
  email: string;
  order: number;
  status: "pending" | "signed" | "declined";
}

const SignDocument = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  
  const { file, fileUrl, placeholders, setPlaceholders } = useDocumentLoader(documentId);
  
  const {
    signatureImage,
    signatures,
    signatureOpen,
    setSignatures,
    setSignatureOpen,
    handleSignatureCreate,
    handleApplySignature,
    handleSignatureMove
  } = useSignatureManagement();
  
  const {
    draggedPlaceholderId,
    savePlaceholders,
    handleUpdatePlaceholders,
    handlePlaceholderDragStart,
    handlePlaceholderMove,
    handlePlaceholderDelete
  } = usePlaceholderManagement(
    placeholders,
    setPlaceholders,
    signatureImage,
    handleApplySignature,
    signatures,
    setSignatures
  );
  
  const {
    signedPdfUrl,
    isProcessing,
    handleFinalizeDocument,
    handleDownload
  } = useDocumentFinalization();

  // Load recipients from localStorage
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

  const onSavePlaceholders = () => {
    if (documentId) {
      savePlaceholders(documentId, file);
    }
  };

  const onFinalizeDocument = () => {
    handleFinalizeDocument(file, signatures, placeholders);
  };

  const onDownload = () => {
    handleDownload(file);
  };

  const handleAddPlaceholder = (type: "signature" | "text", label: string, recipientId: string) => {
    // Add placeholder at center of current view
    const newPlaceholder = {
      id: `placeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label,
      x: 300, // Default position
      y: 200, // Default position
      page: 0, // Default to first page
      value: type === "signature" && signatureImage ? signatureImage : "",
      recipientId,
    };
    
    setPlaceholders(prev => [...prev, newPlaceholder]);
    
    // If it's a signature placeholder and we have a signature, apply it
    if (type === "signature" && signatureImage) {
      handleApplySignature({ 
        x: newPlaceholder.x, 
        y: newPlaceholder.y, 
        page: newPlaceholder.page 
      });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen flex flex-col gap-6 p-6 bg-gray-50">
        <DocumentHeader file={file} documentId={documentId} />

        <div className="flex flex-col md:flex-row gap-6">
          <DocumentControls
            file={file}
            fileUrl={fileUrl}
            documentId={documentId}
            signatureImage={signatureImage}
            signatures={signatures}
            placeholders={placeholders}
            signedPdfUrl={signedPdfUrl}
            isProcessing={isProcessing}
            onCreateSignature={() => setSignatureOpen(true)}
            onSavePlaceholders={onSavePlaceholders}
            onFinalizeDocument={onFinalizeDocument}
            onDownload={onDownload}
          />

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
                  <RecipientPlaceholderSidebar 
                    recipients={recipients}
                    onAddPlaceholder={handleAddPlaceholder}
                  />
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
