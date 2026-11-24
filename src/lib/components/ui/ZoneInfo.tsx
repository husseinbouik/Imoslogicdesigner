import { type ZoneNode, type PanelStyle } from "../../types/types";
import "./ZoneInfo.css";
import { getPanel } from "../../utils/faces";

interface ZoneInfoProps {
  selectedNode: ZoneNode | null;
  rawSelectedNode: ZoneNode | null;
}

// Helper function - must be identical to the one in ZoneRenderer.tsx.
const getSignedOffset = (panel?: PanelStyle): number => {
  if (!panel?.inset) return 0;
  const value = parseFloat(panel.inset);
  return !isNaN(value) ? value : 0;
};

// This function calculates inner dims from the FINAL RENDERED size.
function calculateInnerDimensions(
  finalRenderedDims: { length: number; height: number; depth: number },
  rawNode: ZoneNode,
) {
  const leftThickness = getPanel(rawNode, "left")?.cpName
    ? (getPanel(rawNode, "left")!.thickness ?? 0)
    : 0;
  const rightThickness = getPanel(rawNode, "right")?.cpName
    ? (getPanel(rawNode, "right")!.thickness ?? 0)
    : 0;
  const topThickness = getPanel(rawNode, "top")?.cpName
    ? (getPanel(rawNode, "top")!.thickness ?? 0)
    : 0;
  const bottomThickness = getPanel(rawNode, "bottom")?.cpName
    ? (getPanel(rawNode, "bottom")!.thickness ?? 0)
    : 0;
  const frontThickness = getPanel(rawNode, "front")?.cpName
    ? (getPanel(rawNode, "front")!.thickness ?? 0)
    : 0;
  const backThickness = getPanel(rawNode, "back")?.cpName
    ? (getPanel(rawNode, "back")!.thickness ?? 0)
    : 0;

  return {
    innerWidth: finalRenderedDims.length - leftThickness - rightThickness,
    innerHeight: finalRenderedDims.height - topThickness - bottomThickness,
    innerDepth: finalRenderedDims.depth - frontThickness - backThickness,
  };
}

export function ZoneInfo({ selectedNode, rawSelectedNode }: ZoneInfoProps) {
  if (!selectedNode || !rawSelectedNode) {
    return null;
  }

  // --- START OF LOGIC ---

  // 1. Calculate the actual final size of the 3D model.
  //    This will now be used for BOTH the "Outer Zone" display and the "Inner Zone" calculation.
  const baseLength = selectedNode.length ?? 0;
  const baseHeight = selectedNode.height ?? 0;
  const baseDepth = selectedNode.depth ?? 0;

  const leftOffset = getSignedOffset(getPanel(selectedNode, "left"));
  const rightOffset = getSignedOffset(getPanel(selectedNode, "right"));
  const frontOffset = getSignedOffset(getPanel(selectedNode, "front"));
  const backOffset = getSignedOffset(getPanel(selectedNode, "back"));
  const topOffset = 0; // Top and bottom are ignored as requested.
  const bottomOffset = 0;

  const finalRenderedDims = {
    length: baseLength - (leftOffset + rightOffset),
    height: baseHeight - (topOffset + bottomOffset),
    depth: baseDepth - (frontOffset + backOffset),
  };

  // 2. "Inner Zone" Dimensions are calculated from the final size.
  const innerDims = calculateInnerDimensions(
    finalRenderedDims,
    rawSelectedNode,
  );

  // --- END OF LOGIC ---

  return (
    <div className="zone-info-container">
      {/* Index (unchanged) */}
      <div className="info-grid">
        <div
          className="label"
          style={{ fontWeight: "bold", fontSize: "1.6rem" }}
        >
          Article Index:
        </div>
        <div className="value" style={{ fontWeight: "bold" }}>
          {selectedNode.index}
        </div>
      </div>

      {/* --- Zone Outer Section --- */}
      <div style={{ paddingTop: "8px" }}>
        <div style={{ fontWeight: "bold", paddingBottom: "8px" }}>
          Zone Outer:
        </div>
        <div
          className="info-grid"
          style={{ borderTop: "1px solid #eee", paddingTop: "8px" }}
        >
          <div className="label">width</div>
          <div className="value">
            {/* MODIFICATION: Use the calculated final dimensions for the display */}
            {`${finalRenderedDims.length.toFixed(2)} mm`}
          </div>
          <div className="label">height</div>
          <div className="value">
            {/* MODIFICATION: Use the calculated final dimensions for the display */}
            {`${finalRenderedDims.height.toFixed(2)} mm`}
          </div>
          <div className="label">depth</div>
          <div className="value">
            {/* MODIFICATION: Use the calculated final dimensions for the display */}
            {`${finalRenderedDims.depth.toFixed(2)} mm`}
          </div>
        </div>
      </div>

      {/* --- Zone Inner Section --- */}
      <div style={{ paddingTop: "8px" }}>
        <div style={{ fontWeight: "bold", paddingBottom: "8px" }}>
          Zone Inner:
        </div>
        <div
          className="info-grid"
          style={{ borderTop: "1px solid #eee", paddingTop: "8px" }}
        >
          <div className="label">width</div>
          <div className="value">{innerDims.innerWidth.toFixed(2)} mm</div>
          <div className="label">height</div>
          <div className="value">{innerDims.innerHeight.toFixed(2)} mm</div>
          <div className="label">depth</div>
          <div className="value">{innerDims.innerDepth.toFixed(2)} mm</div>
        </div>
      </div>
    </div>
  );
}
