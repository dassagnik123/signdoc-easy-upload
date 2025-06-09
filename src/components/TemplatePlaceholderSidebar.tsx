
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Signature, Type, Trash2 } from "lucide-react";
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

interface DraggablePlaceholderProps {
  type: "signature" | "text";
  label: string;
  category: "sender" | "recipient";
}

const DraggablePlaceholder = ({ type, label, category }: DraggablePlaceholderProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PLACEHOLDER",
    item: { type, label, category },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`flex items-center gap-2 p-3 border rounded-md cursor-move bg-white 
                  hover:bg-gray-50 transition-colors ${isDragging ? "opacity-50" : ""} ${
                    category === "sender" ? "border-blue-200" : "border-purple-200"
                  }`}
    >
      {type === "signature" ? (
        <Signature className={`h-4 w-4 ${category === "sender" ? "text-blue-600" : "text-purple-600"}`} />
      ) : (
        <Type className={`h-4 w-4 ${category === "sender" ? "text-blue-600" : "text-purple-600"}`} />
      )}
      <span className="text-sm">{label}</span>
      <span className={`text-xs px-2 py-1 rounded ${
        category === "sender" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
      }`}>
        {category === "sender" ? "Sender" : "Recipient"}
      </span>
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

interface TemplatePlaceholderSidebarProps {
  senderPlaceholders: Placeholder[];
  recipientPlaceholders: Placeholder[];
  onAddPlaceholder: (type: "signature" | "text", label: string, category: "sender" | "recipient") => void;
  onDeletePlaceholder: (placeholderId: string) => void;
}

export const TemplatePlaceholderSidebar = ({
  senderPlaceholders,
  recipientPlaceholders,
  onAddPlaceholder,
  onDeletePlaceholder,
}: TemplatePlaceholderSidebarProps) => {
  const senderPlaceholderTypes = [
    { type: "signature" as const, label: "My Signature" },
    { type: "text" as const, label: "My Name" },
    { type: "text" as const, label: "My Title" },
    { type: "text" as const, label: "Date" },
  ];

  const recipientPlaceholderTypes = [
    { type: "signature" as const, label: "Their Signature" },
    { type: "text" as const, label: "Their Name" },
    { type: "text" as const, label: "Their Title" },
    { type: "text" as const, label: "Company" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Template Placeholders</CardTitle>
        <p className="text-sm text-gray-600">Drag placeholders onto the document to create form fields</p>
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
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">{recipientPlaceholders.length}</div>
                <div className="text-xs text-purple-600">Recipient Fields</div>
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
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2 text-blue-600">Drag to Add Sender Fields</h4>
                <div className="grid gap-2">
                  {senderPlaceholderTypes.map((placeholder, index) => (
                    <DraggablePlaceholder
                      key={`sender-${index}`}
                      type={placeholder.type}
                      label={placeholder.label}
                      category="sender"
                    />
                  ))}
                </div>
              </div>
              
              <PlaceholderList 
                placeholders={senderPlaceholders} 
                title="Added Sender Fields"
                onDelete={onDeletePlaceholder}
              />
            </div>
          </TabsContent>

          <TabsContent value="recipient" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2 text-purple-600">Drag to Add Recipient Fields</h4>
                <div className="grid gap-2">
                  {recipientPlaceholderTypes.map((placeholder, index) => (
                    <DraggablePlaceholder
                      key={`recipient-${index}`}
                      type={placeholder.type}
                      label={placeholder.label}
                      category="recipient"
                    />
                  ))}
                </div>
              </div>
              
              <PlaceholderList 
                placeholders={recipientPlaceholders} 
                title="Added Recipient Fields"
                onDelete={onDeletePlaceholder}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
