
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pen, Image, FileText } from "lucide-react";

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignatureCreate: (signatureDataUrl: string) => void;
}

export const SignatureDialog = ({
  open,
  onOpenChange,
  onSignatureCreate,
}: SignatureDialogProps) => {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [activeTab, setActiveTab] = useState("draw");
  const [textSignature, setTextSignature] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [textFont, setTextFont] = useState("Dancing Script");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Reset state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onOpenChange(newOpen);
    } else {
      setIsEmpty(true);
      setTextSignature("");
      setSelectedImage(null);
      setPreviewUrl(null);
      setActiveTab("draw");
      onOpenChange(newOpen);
    }
  };

  const handleClear = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (activeTab === "draw" && sigCanvasRef.current && !isEmpty) {
      const dataUrl = sigCanvasRef.current.toDataURL("image/png");
      onSignatureCreate(dataUrl);
    } else if (activeTab === "type" && textSignature.trim() !== "") {
      // Create a canvas to render the text signature
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 150;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = `48px "${textFont}", cursive`;
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(textSignature, canvas.width / 2, canvas.height / 2);
        
        const dataUrl = canvas.toDataURL("image/png");
        onSignatureCreate(dataUrl);
      }
    } else if (activeTab === "upload" && previewUrl) {
      onSignatureCreate(previewUrl);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Create font selection options
  const fontOptions = [
    { value: "Dancing Script", label: "Signature" },
    { value: "Pacifico", label: "Handwriting" },
    { value: "Arial", label: "Standard" },
    { value: "Times New Roman", label: "Formal" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Signature</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <Pen className="h-4 w-4" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="draw">
            <div className="border border-gray-300 rounded-md bg-white">
              <SignatureCanvas
                ref={sigCanvasRef}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: "signature-canvas w-full",
                }}
                onBegin={() => setIsEmpty(false)}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Draw your signature using your mouse or touch screen
            </div>
          </TabsContent>
          
          <TabsContent value="type">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Signature Text</label>
                <Textarea 
                  value={textSignature}
                  onChange={(e) => setTextSignature(e.target.value)}
                  placeholder="Type your name here"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Font Style</label>
                <select
                  value={textFont}
                  onChange={(e) => setTextFont(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {fontOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {textSignature && (
                <div className="border border-gray-300 rounded-md p-4 bg-white">
                  <p className={`text-center text-3xl`} style={{fontFamily: textFont}}>
                    {textSignature}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="upload">
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                <Image className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  Upload an image of your signature
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="max-w-xs"
                />
              </div>
              
              {previewUrl && (
                <div className="border border-gray-300 rounded-md p-4 bg-white">
                  <img 
                    src={previewUrl} 
                    alt="Signature Preview" 
                    className="max-h-[150px] mx-auto object-contain"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-row gap-2 justify-between sm:justify-between">
          {activeTab === "draw" ? (
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}
          
          <Button 
            onClick={handleSave} 
            disabled={
              (activeTab === "draw" && isEmpty) || 
              (activeTab === "type" && !textSignature.trim()) || 
              (activeTab === "upload" && !previewUrl)
            }
          >
            Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
