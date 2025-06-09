
import { useState } from "react";
import { Upload } from "@/components/Upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentViewer } from "@/components/DocumentViewer";
import { TemplatePlaceholderSidebar } from "@/components/TemplatePlaceholderSidebar";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";

const Template = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const {
    senderPlaceholders,
    recipientPlaceholders,
    setSenderPlaceholders,
    setRecipientPlaceholders,
    draggedPlaceholderId,
    handlePlaceholderDragStart,
    handlePlaceholderMove,
    handlePlaceholderDelete,
    handleSaveTemplate
  } = useTemplateManagement();

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    
    // Create URL for file preview
    const url = URL.createObjectURL(uploadedFile);
    setFileUrl(url);
    
    toast.success("Document uploaded", {
      description: "You can now add placeholders to create a template.",
    });
  };

  const handleAddPlaceholder = (type: "signature" | "text", label: string, category: "sender" | "recipient") => {
    const newPlaceholder = {
      id: `placeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label,
      x: 300,
      y: 200,
      page: 0,
      value: "",
      category,
    };
    
    if (category === "sender") {
      setSenderPlaceholders(prev => [...prev, newPlaceholder]);
    } else {
      setRecipientPlaceholders(prev => [...prev, newPlaceholder]);
    }
  };

  const allPlaceholders = [...senderPlaceholders, ...recipientPlaceholders];

  const handleUpdatePlaceholders = (updatedPlaceholders: any[]) => {
    const senderUpdated = updatedPlaceholders.filter(p => p.category === "sender");
    const recipientUpdated = updatedPlaceholders.filter(p => p.category === "recipient");
    
    setSenderPlaceholders(senderUpdated);
    setRecipientPlaceholders(recipientUpdated);
  };

  const onSaveTemplate = () => {
    if (!file) {
      toast.error("No document uploaded", {
        description: "Please upload a document first.",
      });
      return;
    }
    
    handleSaveTemplate(file, senderPlaceholders, recipientPlaceholders);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen flex flex-col gap-6 p-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Document Template</h1>
            <p className="text-gray-600">Create reusable document templates with placeholders</p>
          </div>
          <Button onClick={onSaveTemplate} disabled={!file}>
            Save Template
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Upload and Placeholder Management */}
          <div className="w-full lg:w-1/3 space-y-6">
            {!file ? (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <Upload onFileUpload={handleFileUpload} buttonText="Upload Template Document" />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Current Document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{file.name}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        setFile(null);
                        setFileUrl(null);
                        setSenderPlaceholders([]);
                        setRecipientPlaceholders([]);
                      }}
                    >
                      Change Document
                    </Button>
                  </CardContent>
                </Card>

                <TemplatePlaceholderSidebar 
                  senderPlaceholders={senderPlaceholders}
                  recipientPlaceholders={recipientPlaceholders}
                  onAddPlaceholder={handleAddPlaceholder}
                  onDeletePlaceholder={handlePlaceholderDelete}
                />
              </div>
            )}
          </div>

          {/* Document Viewer */}
          <div className="w-full lg:w-2/3">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                {fileUrl ? (
                  <DocumentViewer 
                    file={fileUrl}
                    fileType={file?.type || ""}
                    signatureImage={null}
                    onApplySignature={() => {}}
                    isSigned={false}
                    placeholders={allPlaceholders}
                    onUpdatePlaceholders={handleUpdatePlaceholders}
                    onDeletePlaceholder={handlePlaceholderDelete}
                    onPlaceholderDragStart={handlePlaceholderDragStart}
                    onPlaceholderMove={handlePlaceholderMove}
                    draggedPlaceholderId={draggedPlaceholderId}
                    disableClickToSign={true}
                  />
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-gray-500">
                    Upload a document to start creating your template
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default Template;
