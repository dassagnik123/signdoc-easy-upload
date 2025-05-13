
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePen } from "lucide-react";

interface UploadProps {
  onFileUpload: (file: File) => void;
}

export const Upload = ({ onFileUpload }: UploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Only handle PDF files
      const file = files[0];
      if (file.type === "application/pdf") {
        onFileUpload(file);
      } else {
        alert("Please upload a PDF file");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gray-300 rounded-lg">
      <FilePen className="h-12 w-12 text-gray-400" />
      <div className="text-center">
        <h3 className="font-medium">Upload Document</h3>
        <p className="text-sm text-gray-500 mt-1">PDF files only</p>
      </div>
      <Input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        Select File
      </Button>
    </div>
  );
};
