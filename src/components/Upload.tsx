
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
      const file = files[0];
      const allowedTypes = [
        "application/pdf", // PDF
        "image/jpeg", "image/png", "image/gif", // Images
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // Word
        "text/plain" // Text
      ];
      
      if (allowedTypes.includes(file.type)) {
        onFileUpload(file);
      } else {
        alert("Please upload a PDF, image, Word, or text file");
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
        <p className="text-sm text-gray-500 mt-1">PDF, Images, Word or Text files</p>
      </div>
      <Input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
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
