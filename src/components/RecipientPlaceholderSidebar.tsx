
import React, { useState } from "react";
import { useDrag } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Signature, FileText, User, Plus } from "lucide-react";

interface Recipient {
  id: string;
  name: string;
  email: string;
  order: number;
  status: "pending" | "signed" | "declined";
}

interface PlaceholderItemProps {
  type: "signature" | "text";
  label: string;
  icon: React.ReactNode;
  onAddPlaceholder: (type: "signature" | "text", label: string, recipientId: string) => void;
  recipients: Recipient[];
}

const SimplePlaceholderItem: React.FC<PlaceholderItemProps> = ({ 
  type, 
  label, 
  icon, 
  onAddPlaceholder, 
  recipients 
}) => {
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PLACEHOLDER",
    item: { type, label, recipientId: selectedRecipient },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleQuickAdd = () => {
    if (selectedRecipient) {
      onAddPlaceholder(type, label, selectedRecipient);
      setSelectedRecipient(""); // Reset selection after adding
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </div>
      
      <div className="flex gap-2">
        <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
          <SelectTrigger className="flex-1 h-8 text-xs">
            <SelectValue placeholder="Who signs?" />
          </SelectTrigger>
          <SelectContent>
            {recipients.map((recipient) => (
              <SelectItem key={recipient.id} value={recipient.id}>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {recipient.order}
                  </span>
                  <span className="truncate">{recipient.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          size="sm"
          className="h-8 px-3"
          onClick={handleQuickAdd}
          disabled={!selectedRecipient}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Drag option for advanced users */}
      {selectedRecipient && (
        <Button
          ref={drag}
          size="sm"
          variant="ghost"
          className="w-full mt-2 h-7 text-xs opacity-60 hover:opacity-100"
          disabled={isDragging}
        >
          Or drag to place precisely
        </Button>
      )}
    </div>
  );
};

interface RecipientPlaceholderSidebarProps {
  recipients: Recipient[];
  onAddPlaceholder: (type: "signature" | "text", label: string, recipientId: string) => void;
}

export const RecipientPlaceholderSidebar: React.FC<RecipientPlaceholderSidebarProps> = ({
  recipients,
  onAddPlaceholder,
}) => {
  if (recipients.length === 0) {
    return (
      <div className="bg-gray-50 border-t p-6 text-center">
        <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-medium text-gray-700 mb-2">Add Recipients First</h3>
        <p className="text-sm text-gray-500">
          Set up who needs to sign this document before adding signature fields
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border-t p-4">
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-1">Add Signature Fields</h3>
        <p className="text-xs text-gray-600">
          Choose what each person needs to sign or fill out
        </p>
      </div>

      <div className="space-y-3">
        <SimplePlaceholderItem
          type="signature"
          label="Signature"
          icon={<Signature className="h-4 w-4 text-blue-600" />}
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
        
        <SimplePlaceholderItem
          type="text"
          label="Name"
          icon={<FileText className="h-4 w-4 text-green-600" />}
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
        
        <SimplePlaceholderItem
          type="text"
          label="Date"
          icon={<FileText className="h-4 w-4 text-green-600" />}
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
        
        <SimplePlaceholderItem
          type="text"
          label="Title"
          icon={<FileText className="h-4 w-4 text-green-600" />}
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
        
        <SimplePlaceholderItem
          type="text"
          label="Company"
          icon={<FileText className="h-4 w-4 text-green-600" />}
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
      </div>

      {recipients.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Signing Order:</div>
          <div className="space-y-1">
            {recipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-medium">
                  {recipient.order}
                </span>
                <span className="truncate text-gray-700">{recipient.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
