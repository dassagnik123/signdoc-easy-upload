
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

  const handleClear = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (sigCanvasRef.current && !isEmpty) {
      const dataUrl = sigCanvasRef.current.toDataURL("image/png");
      onSignatureCreate(dataUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Signature</DialogTitle>
        </DialogHeader>
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
        <DialogFooter className="flex flex-row gap-2 justify-between sm:justify-between">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleSave} disabled={isEmpty}>
            Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
