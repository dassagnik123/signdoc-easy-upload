
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export const useDocumentLoader = (documentId: string | undefined) => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);

  useEffect(() => {
    if (!documentId) {
      toast.error("No document specified", {
        description: "Please select a document from the home page.",
      });
      navigate('/');
      return;
    }

    loadDocumentFromStorage(documentId);
  }, [documentId, navigate]);

  const loadDocumentFromStorage = async (docId: string) => {
    const fileContent = localStorage.getItem(`file_${docId}`);
    
    if (!fileContent) {
      const savedData = localStorage.getItem(docId);
      
      if (!savedData) {
        toast.error("Document not found", {
          description: "The document you're trying to access doesn't exist.",
        });
        navigate('/');
        return;
      }
      
      try {
        const { placeholders: savedPlaceholders } = JSON.parse(savedData);
        setPlaceholders(savedPlaceholders || []);
        
        const fileName = docId.substring(9, docId.lastIndexOf('_'));
        
        toast.warning("Document content not found", {
          description: `Placeholders for ${fileName} were loaded, but you'll need to re-upload the file.`,
        });
      } catch (error) {
        console.error("Error loading saved data:", error);
        toast.error("Error loading document data", {
          description: "There was a problem loading your document's data.",
        });
      }
      
      return;
    }
    
    try {
      const dataURLtoBlob = (dataURL: string) => {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };
      
      const fileName = docId.substring(9, docId.lastIndexOf('_'));
      const blob = dataURLtoBlob(fileContent);
      const fileObject = new File([blob], fileName, { 
        type: blob.type,
        lastModified: Date.now() 
      });
      
      setFile(fileObject);
      setFileUrl(URL.createObjectURL(fileObject));
      
      loadPlaceholders(docId);
      
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Error loading document", {
        description: "There was a problem loading your document.",
      });
    }
  };

  const loadPlaceholders = (docId: string) => {
    const savedData = localStorage.getItem(docId);
    
    if (savedData) {
      try {
        const { placeholders: savedPlaceholders } = JSON.parse(savedData);
        setPlaceholders(savedPlaceholders || []);
        
        toast.success("Document loaded", {
          description: `Loaded document with ${savedPlaceholders?.length || 0} placeholders`,
        });
        
        return true;
      } catch (error) {
        console.error("Error loading saved placeholders:", error);
        toast.error("Error loading placeholders", {
          description: "Failed to load saved placeholders for this document.",
        });
      }
    }
    
    return false;
  };

  return {
    file,
    fileUrl,
    placeholders,
    setPlaceholders
  };
};
