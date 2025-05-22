
import { useState } from "react";
import { useDrag } from "react-dnd";
import { Signature, FileText } from "lucide-react";

interface PlaceholderItemProps {
  type: "signature" | "text";
  label: string;
}

export const PlaceholderItem = ({ type, label }: PlaceholderItemProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PLACEHOLDER",
    item: { type, label },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`flex items-center gap-2 p-3 border rounded-md cursor-move bg-white 
                  hover:bg-gray-50 transition-colors ${isDragging ? "opacity-50" : ""}`}
    >
      {type === "signature" ? (
        <Signature className="h-5 w-5 text-blue-600" />
      ) : (
        <FileText className="h-5 w-5 text-green-600" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );
};
