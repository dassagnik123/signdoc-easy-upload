
import { useParams } from "react-router-dom";
import { SignatureDialog } from "@/components/SignatureDialog";
import { PlaceholderSidebar } from "@/components/PlaceholderSidebar";
import { DocumentViewer } from "@/components/DocumentViewer";
import { DocumentHeader } from "@/components/DocumentHeader";
import { DocumentControls } from "@/components/DocumentControls";
import { useDocumentLoader } from "@/hooks/useDocumentLoader";
import { useSignatureManagement } from "@/hooks/useSignatureManagement";
import { usePlaceholderManagement } from "@/hooks/usePlaceholderManagement";
import { useDocumentFinalization } from "@/hooks/useDocumentFinalization";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const SignDocument = () => {
  const { documentId } = useParams<{ documentId: string }>();
  
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
