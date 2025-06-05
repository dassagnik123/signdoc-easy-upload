
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [orderType, setOrderType] = useState<"with-order" | "without-order">("with-order");

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
      order: orderType === "without-order" ? 1 : getNextOrderNumber(),
      status: "pending",
    };

    setRecipients([...recipients, newRecipient]);
    setNewRecipientName("");
    setNewRecipientEmail("");
    toast.success("Recipient added");
  };

  const getNextOrderNumber = () => {
    if (recipients.length === 0) return 1;
    const maxOrder = Math.max(...recipients.map(r => r.order));
    return maxOrder + 1;
  };

  const removeRecipient = (id: string) => {
    const updatedRecipients = recipients.filter((r) => r.id !== id);
    setRecipients(updatedRecipients);
    toast.success("Recipient removed");
  };

  const updateRecipientOrder = (id: string, newOrder: number) => {
    if (newOrder < 1) return;
    
    const updatedRecipients = recipients.map((r) =>
      r.id === id ? { ...r, order: newOrder } : r
    );
    setRecipients(updatedRecipients);
  };

  const moveRecipient = (id: string, direction: "up" | "down") => {
    if (orderType === "without-order") return;
    
    const recipient = recipients.find(r => r.id === id);
    if (!recipient) return;

    const newOrder = direction === "up" ? recipient.order - 1 : recipient.order + 1;
    if (newOrder < 1) return;

    updateRecipientOrder(id, newOrder);
  };

  const handleOrderTypeChange = (value: string) => {
    const newOrderType = value as "with-order" | "without-order";
    setOrderType(newOrderType);
    
    // Update existing recipients based on order type
    const updatedRecipients = recipients.map((r, index) => ({
      ...r,
      order: newOrderType === "without-order" ? 1 : index + 1
    }));
    setRecipients(updatedRecipients);
  };

  const handleSave = () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    onSave(recipients);
    onOpenChange(false);
    
    if (orderType === "without-order") {
      toast.success(`All ${recipients.length} recipients will sign simultaneously`);
    } else {
      // Count unique orders to show how many signing rounds there will be
      const uniqueOrders = new Set(recipients.map(r => r.order));
      const simultaneousGroups = recipients.filter(r => 
        recipients.filter(other => other.order === r.order).length > 1
      );
      
      if (simultaneousGroups.length > 0) {
        toast.success(`Signing order set with ${uniqueOrders.size} rounds for ${recipients.length} recipients`);
      } else {
        toast.success(`Signing order set for ${recipients.length} recipients`);
      }
    }
  };

  // Group recipients by order for display
  const groupedRecipients = recipients.reduce((groups, recipient) => {
    const order = recipient.order;
    if (!groups[order]) {
      groups[order] = [];
    }
    groups[order].push(recipient);
    return groups;
  }, {} as Record<number, Recipient[]>);

  const sortedOrders = Object.keys(groupedRecipients).map(Number).sort((a, b) => a - b);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Signing Order</DialogTitle>
          <DialogDescription>
            Add recipients and choose how they should sign the document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Type Selection */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-3">Signing Order</h3>
            <RadioGroup value={orderType} onValueChange={handleOrderTypeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="with-order" id="with-order" />
                <Label htmlFor="with-order" className="cursor-pointer">
                  With order - Recipients sign in specified order (can share same order)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="without-order" id="without-order" />
                <Label htmlFor="without-order" className="cursor-pointer">
                  Without order - All recipients can sign simultaneously
                </Label>
              </div>
            </RadioGroup>
          </div>

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
              <h3 className="font-medium">
                {orderType === "without-order" 
                  ? `Recipients (${recipients.length} - all sign simultaneously)`
                  : `Signing Order (${recipients.length} recipients)`
                }
              </h3>
              
              {orderType === "without-order" ? (
                // Show all recipients without grouping for "without-order"
                recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-medium text-sm">
                      •
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{recipient.name}</div>
                      <div className="text-sm text-gray-500">{recipient.email}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecipient(recipient.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                // Show grouped recipients for "with-order"
                sortedOrders.map((orderNumber) => (
                  <div key={orderNumber} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <span>Order {orderNumber}</span>
                      {groupedRecipients[orderNumber].length > 1 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {groupedRecipients[orderNumber].length} recipients (simultaneous)
                        </span>
                      )}
                    </div>
                    {groupedRecipients[orderNumber].map((recipient) => (
                      <div
                        key={recipient.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-white ml-4"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-medium text-sm">
                            {recipient.order}
                          </div>
                          <Input
                            type="number"
                            min="1"
                            value={recipient.order}
                            onChange={(e) => updateRecipientOrder(recipient.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-center"
                          />
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
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveRecipient(recipient.id, "down")}
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
                ))
              )}
            </div>
          )}

          {recipients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recipients added yet. Add recipients above to continue.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={recipients.length === 0}>
            Save {orderType === "without-order" ? "Recipients" : "Signing Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
