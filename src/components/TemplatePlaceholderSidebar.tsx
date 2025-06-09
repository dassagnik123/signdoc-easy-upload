
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Signature, Type, Trash2 } from "lucide-react";
import { useDrag } from "react-dnd";

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

interface TemplatePlaceholderSidebarProps {
  senderPlaceholders: Placeholder[];
  recipientPlaceholders: Placeholder[];
  onAddPlaceholder: (type: "signature" | "text", label: string, category: "sender" | "recipient") => void;
  onDeletePlaceholder: (placeholderId: string) => void;
}

const DraggablePlaceholderItem = ({ type, label }: { type: "signature" | "text"; label: string }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PLACEHOLDER",
    item: { type, label },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`flex items-center gap-2 p-2 border rounded cursor-move ${
        isDragging ? "opacity-50" : "hover:bg-gray-50"
      }`}
    >
      {type === "signature" ? (
        <Signature className="h-4 w-4 text-blue-600" />
      ) : (
        <Type className="h-4 w-4 text-green-600" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );
};

const PlaceholderList = ({ 
  placeholders, 
  title, 
  onDelete 
}: { 
  placeholders: Placeholder[]; 
  title: string;
  onDelete: (id: string) => void;
}) => (
  <div className="space-y-2">
    <h4 className="font-medium text-sm">{title}</h4>
    {placeholders.length === 0 ? (
      <p className="text-xs text-gray-500 italic">No placeholders added yet</p>
    ) : (
      <div className="space-y-2">
        {placeholders.map((placeholder) => (
          <div key={placeholder.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              {placeholder.type === "signature" ? (
                <Signature className="h-4 w-4 text-blue-600" />
              ) : (
                <Type className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm">{placeholder.label}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(placeholder.id)}
              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const TemplatePlaceholderSidebar = ({
  senderPlaceholders,
  recipientPlaceholders,
  onAddPlaceholder,
  onDeletePlaceholder,
}: TemplatePlaceholderSidebarProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [placeholderType, setPlaceholderType] = useState<"signature" | "text">("signature");
  const [placeholderLabel, setPlaceholderLabel] = useState("");
  const [placeholderCategory, setPlaceholderCategory] = useState<"sender" | "recipient">("sender");

  const handleAddPlaceholder = () => {
    if (!placeholderLabel.trim()) return;

    onAddPlaceholder(placeholderType, placeholderLabel, placeholderCategory);
    setPlaceholderLabel("");
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Template Placeholders</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Placeholder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Placeholder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Placeholder Type</Label>
                  <Select value={placeholderType} onValueChange={(value: "signature" | "text") => setPlaceholderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signature">Signature</SelectItem>
                      <SelectItem value="text">Text Field</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Assigned To</Label>
                  <Select value={placeholderCategory} onValueChange={(value: "sender" | "recipient") => setPlaceholderCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sender">Sender</SelectItem>
                      <SelectItem value="recipient">Recipient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={placeholderLabel}
                    onChange={(e) => setPlaceholderLabel(e.target.value)}
                    placeholder={placeholderType === "signature" ? "e.g., Signature" : "e.g., Full Name"}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPlaceholder} disabled={!placeholderLabel.trim()}>
                    Add Placeholder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sender">Sender</TabsTrigger>
            <TabsTrigger value="recipient">Recipient</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{senderPlaceholders.length}</div>
                <div className="text-xs text-blue-600">Sender Fields</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{recipientPlaceholders.length}</div>
                <div className="text-xs text-green-600">Recipient Fields</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <PlaceholderList 
                placeholders={senderPlaceholders} 
                title="Sender Placeholders"
                onDelete={onDeletePlaceholder}
              />
              <PlaceholderList 
                placeholders={recipientPlaceholders} 
                title="Recipient Placeholders"
                onDelete={onDeletePlaceholder}
              />
            </div>
          </TabsContent>

          <TabsContent value="sender" className="space-y-4">
            <PlaceholderList 
              placeholders={senderPlaceholders} 
              title="Sender Placeholders"
              onDelete={onDeletePlaceholder}
            />
          </TabsContent>

          <TabsContent value="recipient" className="space-y-4">
            <PlaceholderList 
              placeholders={recipientPlaceholders} 
              title="Recipient Placeholders"
              onDelete={onDeletePlaceholder}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
