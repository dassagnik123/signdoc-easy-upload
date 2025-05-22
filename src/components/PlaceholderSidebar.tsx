
import { PlaceholderItem } from "./PlaceholderItem";

export const PlaceholderSidebar = () => {
  const placeholders = [
    { type: "signature" as const, label: "Signature" },
    { type: "text" as const, label: "Full Name" },
    { type: "text" as const, label: "Date" },
    { type: "text" as const, label: "Company" },
  ];

  return (
    <div className="w-full bg-gray-50 p-4 border-t">
      <h3 className="text-sm font-medium mb-3">Drag & Drop Placeholders</h3>
      <div className="grid grid-cols-2 gap-2">
        {placeholders.map((placeholder, index) => (
          <PlaceholderItem
            key={`${placeholder.type}-${index}`}
            type={placeholder.type}
            label={placeholder.label}
          />
        ))}
      </div>
    </div>
  );
};
