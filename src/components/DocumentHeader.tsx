
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface DocumentHeaderProps {
  file: File | null;
  documentId: string | undefined;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ file, documentId }) => {
  const navigate = useNavigate();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Button 
        variant="ghost" 
        className="flex items-center" 
        onClick={() => navigate('/')}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Documents
      </Button>
      <h1 className="text-2xl font-bold">
        {file ? file.name : documentId ? documentId.substring(9, documentId.lastIndexOf('_')) : "Document Signing"}
      </h1>
    </header>
  );
};
