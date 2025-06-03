
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SignaturePosition {
  url: string;
  x: number;
  y: number;
  page: number;
}

export const useSignatureManagement = () => {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<SignaturePosition[]>([]);
  const [signatureOpen, setSignatureOpen] = useState(false);

  useEffect(() => {
    const savedSignature = localStorage.getItem('saved_signature');
    if (savedSignature) {
      setSignatureImage(savedSignature);
    }
  }, []);

  const handleSignatureCreate = (signatureDataUrl: string) => {
    setSignatureImage(signatureDataUrl);
    setSignatureOpen(false);
    
    localStorage.setItem('saved_signature', signatureDataUrl);
    
    toast.success("Signature created", {
      description: "Your signature has been created and saved for future use.",
    });
  };

  const handleApplySignature = async (position: { x: number; y: number; page: number }) => {
    if (!signatureImage) {
      toast.error("Error signing document", {
        description: "Signature is required.",
      });
      return;
    }
    
    const existingSignatureIndex = signatures.findIndex(
      sig => sig.x === position.x && sig.y === position.y && sig.page === position.page
    );

    if (existingSignatureIndex !== -1) {
      return;
    }
    
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

  const handleSignatureMove = (signatureIndex: number, newX: number, newY: number) => {
    console.log("Moving signature in parent component", signatureIndex, newX, newY);
    
    if (signatureIndex < 0 || signatureIndex >= signatures.length) {
      console.log("Invalid signature index:", signatureIndex);
      return;
    }
    
    setSignatures(prev => {
      const newSignatures = [...prev];
      const oldX = newSignatures[signatureIndex].x;
      const oldY = newSignatures[signatureIndex].y;
      const page = newSignatures[signatureIndex].page;
      
      console.log(`Updating signature from (${oldX}, ${oldY}) to (${newX}, ${newY}) on page ${page}`);
      
      newSignatures[signatureIndex] = {
        ...newSignatures[signatureIndex],
        x: newX,
        y: newY
      };
      return newSignatures;
    });
  };

  return {
    signatureImage,
    signatures,
    signatureOpen,
    setSignatures,
    setSignatureOpen,
    handleSignatureCreate,
    handleApplySignature,
    handleSignatureMove
  };
};
