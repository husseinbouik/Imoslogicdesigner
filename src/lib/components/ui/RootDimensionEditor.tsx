import { type ChangeEvent } from "react";
import "./RootDimensionEditor.css";

interface RootDimensionEditorProps {
  length: number;
  height: number;
  depth: number;
  onDimensionsChange: (
    dimension: "length" | "height" | "depth",
    value: number
  ) => void;
}

export function RootDimensionEditor({
  length,
  height,
  depth,
  onDimensionsChange,
}: RootDimensionEditorProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      onDimensionsChange(name as "length" | "height" | "depth", numericValue);
    }
  };

  return (
    <div className="root-dimension-editor-container">
      <div className="dimension-inputs">
        <div className="dimension-input-group">
          <label>Length</label>
          <input
            type="number"
            name="length"
            value={length}
            onChange={handleChange}
          />
        </div>
        <div className="dimension-input-group">
          <label>Height</label>
          <input
            type="number"
            name="height"
            value={height}
            onChange={handleChange}
          />
        </div>
        <div className="dimension-input-group">
          <label>Depth</label>
          <input
            type="number"
            name="depth"
            value={depth}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}
