
import React, { useState } from "react";
import { useDrag } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Signature, FileText, User } from "lucide-react";

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
  recipients: Recipient[];
  onAddPlaceholder: (type: "signature" | "text", label: string, recipientId: string) => void;
}

const PlaceholderItem: React.FC<PlaceholderItemProps> = ({ type, label, recipients, onAddPlaceholder }) => {
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PLACEHOLDER",
    item: { type, label, recipientId: selectedRecipient },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleAddPlaceholder = () => {
    if (selectedRecipient) {
      onAddPlaceholder(type, label, selectedRecipient);
    }
  };

  return (
    <Card className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        {type === "signature" ? (
          <Signature className="h-4 w-4 text-blue-600" />
        ) : (
          <FileText className="h-4 w-4 text-green-600" />
        )}
        <span className="font-medium text-sm">{label}</span>
      </div>
      
      <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder="Select recipient" />
        </SelectTrigger>
        <SelectContent>
          {recipients.map((recipient) => (
            <SelectItem key={recipient.id} value={recipient.id}>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">
                  {recipient.order}
                </span>
                {recipient.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="flex gap-2">
        <Button
          ref={drag}
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-7"
          disabled={!selectedRecipient || isDragging}
        >
          Drag to Place
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs h-7"
          onClick={handleAddPlaceholder}
          disabled={!selectedRecipient}
        >
          Add Field
        </Button>
      </div>
    </Card>
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
      <div className="bg-white border-t p-4 text-center">
        <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Set recipients first to assign placeholders</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-t p-4">
      <h3 className="font-medium mb-3 text-sm">Add Fields for Recipients</h3>
      <div className="space-y-3">
        <PlaceholderItem
          type="signature"
          label="Signature"
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
        <PlaceholderItem
          type="text"
          label="Date"
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
        <PlaceholderItem
          type="text"
          label="Name"
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
        <PlaceholderItem
          type="text"
          label="Title"
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
        <PlaceholderItem
          type="text"
          label="Company"
          recipients={recipients}
          onAddPlaceholder={onAddPlaceholder}
        />
      </div>
    </div>
  );
};
