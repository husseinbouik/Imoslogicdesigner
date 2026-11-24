import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./CollapseButton.css";

interface CollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function CollapseButton({ isCollapsed, onToggle }: CollapseButtonProps) {
  return (
    <button
      // Always apply the active class now
      className="collapse-btn active"
      onClick={onToggle}
      title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
    >
      {isCollapsed ? <FaChevronUp /> : <FaChevronDown />}
    </button>
  );
}
