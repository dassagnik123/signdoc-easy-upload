
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload } from "@/components/Upload";
import { toast } from "sonner";
import { File, Plus } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface SavedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  placeholdersCount: number;
  savedAt: string;
}

const Home = () => {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const navigate = useNavigate();
  
  // Load documents from localStorage on component mount
  useEffect(() => {
    loadSavedDocuments();
  }, []);
  
  const loadSavedDocuments = () => {
    const savedDocs: SavedDocument[] = [];
    
    // Scan localStorage for document keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('document_')) {
        try {
          const savedData = JSON.parse(localStorage.getItem(key) || '');
          const nameParts = key.split('_');
          
          // Skip if it's not a valid document key or it's just a saved signature
          if (nameParts.length < 3 || key === 'saved_signature') continue;
          
          // Extract file name from the key (remove 'document_' prefix)
          const fileName = key.substring(9, key.lastIndexOf('_'));
          const fileSize = parseInt(key.substring(key.lastIndexOf('_') + 1), 10);
          
          savedDocs.push({
            id: key,
            name: fileName,
            type: fileName.split('.').pop() || 'unknown',
            size: fileSize,
            lastModified: new Date(savedData.savedAt).getTime(),
            placeholdersCount: savedData.placeholders?.length || 0,
            savedAt: savedData.savedAt
          });
        } catch (error) {
          console.error("Error parsing saved document data:", error);
        }
      }
    }
    
    // Sort documents by last saved date (newest first)
    savedDocs.sort((a, b) => b.lastModified - a.lastModified);
    setDocuments(savedDocs);
  };

  const handleFileUpload = (uploadedFile: File) => {
    // Generate document ID (same as the key used in localStorage)
    const documentId = `document_${uploadedFile.name}_${uploadedFile.size}`;
    
    // Store file in localStorage temporarily (as a DataURL)
    const reader = new FileReader();
    reader.onloadend = () => {
      // Store file content as DataURL
      localStorage.setItem(`file_${documentId}`, reader.result as string);
      
      // Navigate to the sign document page with this document ID
      navigate(`/sign/${documentId}`);
    };
    
    reader.onerror = () => {
      toast.error("Error reading file", {
        description: "There was an error processing your document. Please try again.",
      });
    };
    
    // Read file as DataURL
    reader.readAsDataURL(uploadedFile);
  };

  const handleCardClick = (documentId: string) => {
    navigate(`/sign/${documentId}`);
  };

  return (
    <div className="min-h-screen flex flex-col gap-6 p-6 bg-gray-50">
      <header className="text-center">
        <h1 className="text-3xl font-bold mb-2">Document Signing App</h1>
        <p className="text-gray-600">Manage and sign your documents</p>
      </header>

      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Upload a New Document</h2>
          <Upload onFileUpload={handleFileUpload} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Documents</h2>
          
          {documents.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No documents yet</p>
              <p className="text-sm text-gray-400 mt-1">Upload a document to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCardClick(doc.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <File className="w-5 h-5 mr-2" />
                      <span className="truncate">{doc.name}</span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-500">
                      {doc.placeholdersCount} placeholder{doc.placeholdersCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Last modified: {new Date(doc.lastModified).toLocaleDateString()}
                    </p>
                  </CardContent>
                  
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(doc.id);
                    }}>
                      Open
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
