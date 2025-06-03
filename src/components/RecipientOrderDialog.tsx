
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export interface Recipient {
  id: string;
  name: string;
  email: string;
  order: number;
  status: "pending" | "signed" | "declined";
}

interface RecipientOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (recipients: Recipient[]) => void;
  initialRecipients?: Recipient[];
}

export const RecipientOrderDialog: React.FC<RecipientOrderDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialRecipients = [],
}) => {
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientEmail, setNewRecipientEmail] = useState("");

  const addRecipient = () => {
    if (!newRecipientName.trim() || !newRecipientEmail.trim()) {
      toast.error("Please fill in both name and email");
      return;
    }

    if (!newRecipientEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    const newRecipient: Recipient = {
      id: `recipient_${Date.now()}`,
      name: newRecipientName.trim(),
      email: newRecipientEmail.trim(),
      order: recipients.length + 1,
      status: "pending",
    };

    setRecipients([...recipients, newRecipient]);
    setNewRecipientName("");
    setNewRecipientEmail("");
    toast.success("Recipient added");
  };

  const removeRecipient = (id: string) => {
    const updatedRecipients = recipients
      .filter((r) => r.id !== id)
      .map((r, index) => ({ ...r, order: index + 1 }));
    setRecipients(updatedRecipients);
    toast.success("Recipient removed");
  };

  const moveRecipient = (id: string, direction: "up" | "down") => {
    const currentIndex = recipients.findIndex((r) => r.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= recipients.length) return;

    const updatedRecipients = [...recipients];
    [updatedRecipients[currentIndex], updatedRecipients[newIndex]] = [
      updatedRecipients[newIndex],
      updatedRecipients[currentIndex],
    ];

    // Update order numbers
    updatedRecipients.forEach((r, index) => {
      r.order = index + 1;
    });

    setRecipients(updatedRecipients);
  };

  const handleSave = () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    onSave(recipients);
    onOpenChange(false);
    toast.success(`Signing order set for ${recipients.length} recipients`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Signing Order</DialogTitle>
          <DialogDescription>
            Add recipients and define the order in which they should sign the document.
            Recipients will receive the document in sequence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new recipient */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-3">Add Recipient</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={newRecipientEmail}
                  onChange={(e) => setNewRecipientEmail(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addRecipient} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Recipients list */}
          {recipients.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Signing Order ({recipients.length} recipients)</h3>
              {recipients.map((recipient, index) => (
                <div
                  key={recipient.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-medium text-sm">
                    {recipient.order}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-sm text-gray-500">{recipient.email}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveRecipient(recipient.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveRecipient(recipient.id, "down")}
                      disabled={index === recipients.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(recipient.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recipients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recipients added yet. Add recipients above to define the signing order.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={recipients.length === 0}>
            Save Signing Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
