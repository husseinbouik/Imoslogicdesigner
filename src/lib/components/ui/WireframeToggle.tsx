// src/lib/components/ui/WireframeToggle.tsx

import { TbFrame } from "react-icons/tb";
import "./WireframeToggle.css";

interface WireframeToggleProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function WireframeToggle({ isVisible, onToggle }: WireframeToggleProps) {
  return (
    <button
      className={`footer-btn wireframe-toggle-btn ${isVisible ? "active" : ""}`}
      onClick={onToggle}
      title={isVisible ? "Hide Wireframes" : "Show Wireframes"}
    >
      <TbFrame />
    </button>
  );
}
