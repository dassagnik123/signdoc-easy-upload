
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
  category: "sender" | "recipient";
}

export const useTemplateManagement = () => {
  const [senderPlaceholders, setSenderPlaceholders] = useState<Placeholder[]>([]);
  const [recipientPlaceholders, setRecipientPlaceholders] = useState<Placeholder[]>([]);
  const [draggedPlaceholderId, setDraggedPlaceholderId] = useState<string | null>(null);

  const handlePlaceholderDragStart = (placeholderId: string) => {
    setDraggedPlaceholderId(placeholderId);
  };

  const handlePlaceholderMove = (id: string, newX: number, newY: number) => {
    console.log("Moving placeholder:", id, "to", newX, newY);
    
    // Check if it's a sender placeholder
    const senderPlaceholder = senderPlaceholders.find(p => p.id === id);
    if (senderPlaceholder) {
      setSenderPlaceholders(prev => 
        prev.map(p => 
          p.id === id 
            ? { ...p, x: newX, y: newY } 
            : p
        )
      );
      return;
    }

    // Check if it's a recipient placeholder
    const recipientPlaceholder = recipientPlaceholders.find(p => p.id === id);
    if (recipientPlaceholder) {
      setRecipientPlaceholders(prev => 
        prev.map(p => 
          p.id === id 
            ? { ...p, x: newX, y: newY } 
            : p
        )
      );
    }
  };

  const handlePlaceholderDelete = (placeholderId: string) => {
    console.log("Deleting placeholder:", placeholderId);
    setSenderPlaceholders(prev => prev.filter(p => p.id !== placeholderId));
    setRecipientPlaceholders(prev => prev.filter(p => p.id !== placeholderId));
  };

  const handleAddPlaceholder = (type: "signature" | "text", label: string, x: number, y: number, page: number, category: "sender" | "recipient", signatureImage?: string) => {
    console.log("Adding placeholder:", { type, label, x, y, page, category });
    
    // Auto-populate signature for sender if available
    let initialValue = "";
    if (type === "signature" && category === "sender" && signatureImage) {
      initialValue = signatureImage;
      console.log("Auto-populating sender signature");
    }

    const newPlaceholder: Placeholder = {
      id: `placeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label,
      x,
      y,
      page,
      value: initialValue,
      category,
    };
    
    console.log("Creating new placeholder:", newPlaceholder);
    
    if (category === "sender") {
      setSenderPlaceholders(prev => {
        const updated = [...prev, newPlaceholder];
        console.log("Updated sender placeholders:", updated);
        return updated;
      });
    } else {
      setRecipientPlaceholders(prev => {
        const updated = [...prev, newPlaceholder];
        console.log("Updated recipient placeholders:", updated);
        return updated;
      });
    }
  };

  const handleSaveTemplate = (file: File, senderPlaceholders: Placeholder[], recipientPlaceholders: Placeholder[]) => {
    try {
      const templateId = `template_${file.name}_${Date.now()}`;
      
      const templateData = {
        id: templateId,
        name: file.name,
        senderPlaceholders,
        recipientPlaceholders,
        createdAt: new Date().toISOString(),
      };
      
      // Save template to localStorage
      localStorage.setItem(templateId, JSON.stringify(templateData));
      
      // Also save the file content
      const reader = new FileReader();
      reader.onload = () => {
        const fileContent = reader.result as string;
        localStorage.setItem(`file_${templateId}`, fileContent);
      };
      reader.readAsDataURL(file);
      
      toast.success("Template saved", {
        description: `Template "${file.name}" has been saved successfully.`,
      });
      
      console.log("Saved template:", templateData);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template", {
        description: "There was an error saving your template.",
      });
    }
  };

  return {
    senderPlaceholders,
    recipientPlaceholders,
    setSenderPlaceholders,
    setRecipientPlaceholders,
    draggedPlaceholderId,
    handlePlaceholderDragStart,
    handlePlaceholderMove,
    handlePlaceholderDelete,
    handleAddPlaceholder,
    handleSaveTemplate,
  };
};
