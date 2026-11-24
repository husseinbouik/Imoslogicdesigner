import { CollapseButton } from "./CollapseButton";
import { WireframeToggle } from "./WireframeToggle";
import "./PanelHeader.css";
import { PiExportBold } from "react-icons/pi";
import { BiImport } from "react-icons/bi";
import { FiSun, FiMoon, FiGrid, FiPackage } from "react-icons/fi";
import type { ChangeEvent } from "react";

interface PanelHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isWireframeVisible: boolean;
  onWireframeToggle: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  theme: string;
  onThemeToggle: () => void;
  isCPManagerOpen: boolean;
  isPDManagerOpen: boolean;
  onOpenCPManager: () => void;
  onOpenPDManager: () => void;
}

export function PanelHeader({
  isCollapsed,
  onToggle,
  isWireframeVisible,
  onWireframeToggle,
  onImport,
  onExport,
  theme,
  onThemeToggle,
  isCPManagerOpen,
  isPDManagerOpen,
  onOpenCPManager,
  onOpenPDManager,
}: PanelHeaderProps) {
  return (
    <div className="panel-header-container">
      {!isCollapsed && (
        <h3 className="panel-header-title-text">Article Designer</h3>
      )}
      <div className="panel-header-controls">
        {/* Controls visible ONLY when collapsed */}
        {isCollapsed && (
          <>
            <WireframeToggle
              isVisible={isWireframeVisible}
              onToggle={onWireframeToggle}
            />
            <button
              className="footer-btn"
              onClick={onThemeToggle}
              title={
                theme === "light"
                  ? "Switch to Dark Mode"
                  : "Switch to Light Mode"
              }
            >
              {theme === "light" ? <FiMoon /> : <FiSun />}
            </button>
            <button
              className="footer-btn"
              onClick={onExport}
              title="Export JSON"
            >
              <PiExportBold />
            </button>
            <label className="footer-btn" title="Import JSON">
              <BiImport />
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                style={{ display: "none" }}
              />
            </label>
            {/* CP / PD manager icons — also shown when collapsed */}
            <button
              className={`footer-btn ${isCPManagerOpen ? "active" : ""}`}
              onClick={onOpenCPManager}
              title="CP Manager"
            >
              <FiGrid />
            </button>
            <button
              className={`footer-btn ${isPDManagerOpen ? "active" : ""}`}
              onClick={onOpenPDManager}
              title="PD Manager"
            >
              <FiPackage />
            </button>
          </>
        )}
      </div>
      <CollapseButton isCollapsed={isCollapsed} onToggle={onToggle} />
    </div>
  );
}
