import { type ChangeEvent, type ReactNode } from "react";
import { type ConfigData } from "../../utils/data/data";
import { type ZoneNode } from "../../types/types";
// Helper function remains inside this component for encapsulation.
function cleanNodeForExport(node: ZoneNode): ZoneNode {
  const cleanedNode: Partial<ZoneNode> = {};

  for (const key in node) {
    if (
      Object.prototype.hasOwnProperty.call(node, key) &&
      !key.startsWith("_")
    ) {
      (cleanedNode as any)[key] = (node as any)[key];
    }
  }

  if (cleanedNode.children) {
    cleanedNode.children = cleanedNode.children.map(child =>
      cleanNodeForExport(child)
    );
  }

  return cleanedNode as ZoneNode;
}

// --- Props Interface ---
interface JsonInterfaceProps {
  data: ConfigData;
  onDataChange: (data: ConfigData) => void;
  children: (handlers: {
    handleImport: (event: ChangeEvent<HTMLInputElement>) => void;
    handleExport: () => void;
  }) => ReactNode;
}

export function JsonInterface({
  data,
  onDataChange,
  children,
}: JsonInterfaceProps) {
  const handleExport = () => {
    try {
      const dataForExport: ConfigData = {
        ...data,
        root: cleanNodeForExport(data.root),
      };

      const baseName =
        dataForExport.root.zoneName || dataForExport.root.index || "Root";
      const fileName = `${baseName.replace(/\s+/g, "")}.json`;

      const jsonString = JSON.stringify(dataForExport, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export JSON:", error);
      alert("Error exporting data. Check the console for details.");
    }
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") {
          throw new Error("File could not be read as text.");
        }
        const importedData = JSON.parse(text);

        if (
          !importedData.formData ||
          !importedData.divisionData ||
          !importedData.root
        ) {
          throw new Error(
            "Invalid JSON structure. The file must contain 'formData', 'divisionData', and 'root' keys."
          );
        }
        onDataChange(importedData);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to import and parse JSON:", error);
        alert(`Error importing file: ${message}`);
      }
    };
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
      alert("Failed to read the file.");
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Call the children function, passing the handlers to the parent for rendering.
  return <>{children({ handleImport, handleExport })}</>;
}
