import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "@/components/Upload";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface Document {
  id: string;
  name: string;
  savedAt: string;
  placeholders: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    const docs: Document[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('document_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          
          if (data.savedAt && data.documentName) {
            docs.push({
              id: key,
              name: data.documentName,
              savedAt: data.savedAt,
              placeholders: data.placeholders?.length || 0
            });
          }
        } catch (error) {
          console.error("Error parsing document data:", error);
        }
      }
    }
    
    // Sort by most recently saved
    docs.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    setDocuments(docs);
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Create a unique ID for the document
      const documentId = `document_${file.name.replace(/\s+/g, '_')}_${Date.now()}`;
      
      // Store the file content in localStorage
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          localStorage.setItem(`file_${documentId}`, reader.result as string);
          
          // Navigate to the sign document page
          navigate(`/sign/${documentId}`);
        } catch (error) {
          console.error("Error saving file:", error);
          toast.error("Error saving file", {
            description: "The file may be too large for browser storage.",
          });
        }
      };
      
      reader.onerror = () => {
        toast.error("Error reading file", {
          description: "There was a problem reading the selected file.",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error in file upload:", error);
      toast.error("Upload failed", {
        description: "There was a problem uploading your document.",
      });
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDocument = () => {
    if (documentToDelete) {
      try {
        // Remove the document data
        localStorage.removeItem(documentToDelete);
        
        // Remove the file content
        localStorage.removeItem(`file_${documentToDelete}`);
        
        // Update the documents list
        setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete));
        
        toast.success("Document deleted", {
          description: "The document has been removed.",
        });
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Error deleting document", {
          description: "There was a problem removing the document.",
        });
      }
      
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Digital Document Signing
          </h1>
          <p className="text-xl text-gray-600">
            Upload, sign, and manage your documents with ease
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Upload New Document */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload & Sign Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Upload onFileUpload={handleFileUpload} />
            </CardContent>
          </Card>

          {/* Create Template */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create Document Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-gray-600">Create reusable templates with predefined placeholders</p>
                <Button 
                  onClick={() => navigate('/template')}
                  className="w-full"
                  variant="outline"
                >
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Existing Documents Section */}
        {documents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Your Documents</h2>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{doc.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(doc.savedAt), { addSuffix: true })} • 
                        {doc.placeholders} placeholder{doc.placeholders !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/sign/${doc.id}`)}
                    >
                      Open
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600 cursor-pointer"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDocument}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
