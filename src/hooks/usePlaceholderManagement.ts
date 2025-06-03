
import { useState } from "react";
import { toast } from "sonner";

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

export const usePlaceholderManagement = (
  placeholders: Placeholder[],
  setPlaceholders: React.Dispatch<React.SetStateAction<Placeholder[]>>,
  signatureImage: string | null,
  handleApplySignature: (position: { x: number; y: number; page: number }) => void,
  signatures: SignaturePosition[],
  setSignatures: React.Dispatch<React.SetStateAction<SignaturePosition[]>>
) => {
  const [draggedPlaceholderId, setDraggedPlaceholderId] = useState<string | null>(null);

  const savePlaceholders = (documentId: string, file: File | null) => {
    if (!documentId) {
      toast.error("Document ID not found", {
        description: "Unable to save placeholders without a document ID.",
      });
      return;
    }

    try {
      const saveData = {
        placeholders,
        documentName: file?.name || documentId.substring(9, documentId.lastIndexOf('_')),
        savedAt: new Date().toISOString(),
      };
      
      const dataString = JSON.stringify(saveData);
      
      try {
        localStorage.setItem(documentId, dataString);
      } catch (quotaError) {
        console.log("Storage quota exceeded, cleaning up old files...");
        
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('file_') && key !== `file_${documentId}`) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        localStorage.setItem(documentId, dataString);
      }
      
      toast.success("Placeholders saved", {
        description: `Saved ${placeholders.length} placeholders`,
      });
      
      console.log("Saved placeholders:", placeholders);
    } catch (error) {
      console.error("Error saving placeholders:", error);
      toast.error("Failed to save placeholders", {
        description: "Storage quota exceeded. Try clearing browser data or use fewer large files.",
      });
    }
  };

  const handleUpdatePlaceholders = (updatedPlaceholders: Placeholder[]) => {
    console.log("Updating placeholders:", updatedPlaceholders);
    setPlaceholders(updatedPlaceholders);
    
    if (signatureImage) {
      const signaturePlaceholders = updatedPlaceholders.filter(p => p.type === "signature" && !p.value);
      
      signaturePlaceholders.forEach(placeholder => {
        placeholder.value = signatureImage;
        
        handleApplySignature({
          x: placeholder.x,
          y: placeholder.y,
          page: placeholder.page
        });
      });
    }
  };

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

  const handlePlaceholderDelete = (placeholderId: string) => {
    const deletedPlaceholder = placeholders.find(p => p.id === placeholderId);
    
    if (deletedPlaceholder) {
      setPlaceholders(prev => prev.filter(p => p.id !== placeholderId));
      
      if (deletedPlaceholder.type === "signature") {
        setSignatures(prev => prev.filter(sig => 
          !(sig.x === deletedPlaceholder.x && 
            sig.y === deletedPlaceholder.y && 
            sig.page === deletedPlaceholder.page)
        ));
      }
    }
  };

  return {
    draggedPlaceholderId,
    savePlaceholders,
    handleUpdatePlaceholders,
    handlePlaceholderDragStart,
    handlePlaceholderMove,
    handlePlaceholderDelete
  };
};
