import { processLindiv } from "imos-linear-division";
import {
  type ZoneNode,
  type Division,
  type PanelStyle,
  type Face,
} from "../types/types";
import { type LindivVariables } from "../hooks/useLinearDivision";
import { FACES_BY_USER_INDEX, getPanel } from "./faces";

export type DivisionAxis = "x" | "y" | "z";

export interface ZoneLayoutInput {
  /** The merged node (inherited styles already applied). */
  mergedNode: ZoneNode;
  /** The active division config (from formData override or node.division). */
  activeDivision: Division;
  /** Outer dimensions of the current zone in mm. */
  length: number;
  height: number;
  depth: number;
  /** Optional lindiv variable overrides. */
  variables?: LindivVariables;
}

export interface ZoneLayoutResult {
  /** The axis along which children are laid out. */
  divisionAxis: DivisionAxis;
  /**
   * Child zone sizes in mm (output of processLindiv, after start/end adjustments).
   * Same order as node.children (or reversed if shouldReverseOrder is true).
   */
  zones: number[];
  /**
   * Whether children should be rendered in reversed order for the viewport.
   * true when divisionType === "P" and the active face is "right" or "back".
   */
  shouldReverseOrder: boolean;
  /** Inner space (after panel thickness reductions) in all three axes, in mm. */
  innerLength: number;
  innerHeight: number;
  innerDepth: number;
  /** Shift to apply to the child group so panels are correctly offset, in mm. */
  groupShiftX: number;
  groupShiftY: number;
  groupShiftZ: number;
  /** Thickness of the partition divider in mm. */
  partitionThickness: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the active face that has isFacingPanel=true on this node.
 * Used to determine the perpendicular division axis.
 */
export function findFacingPanelFace(node: ZoneNode): Face | undefined {
  return FACES_BY_USER_INDEX.find(
    info => getPanel(node, info.key)?.isFacingPanel,
  )?.key;
}

/**
 * Calculates how much a panel's thickness reduces the available space,
 * based on its sidesReference alignment.
 */
function getPanelReduction(panelStyle: PanelStyle | undefined): number {
  if (!panelStyle?.cpName || !panelStyle.thickness) return 0;
  const ref = panelStyle.sidesReference ?? "end";
  if (ref === "end") return panelStyle.thickness;
  if (ref === "center") return panelStyle.thickness / 2;
  return 0;
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Computes the full layout for a divided zone.
 *
 * This is the SINGLE source of truth for division calculations.
 * Both the 3D renderer (DividedZone) and the dimension calculator
 * (dimension-calculator) must call this function — never duplicate the logic.
 *
 * Adding a new feature (e.g. inset affecting division space): edit ONLY here.
 */
export function computeZoneLayout(
  input: ZoneLayoutInput,
): ZoneLayoutResult | null {
  const { mergedNode, activeDivision, length, height, depth, variables } =
    input;

  // --- 1. Determine the 3D axis of division ---
  let divisionAxis: DivisionAxis;

  if (activeDivision.divisionType === "P") {
    // Perpendicular: axis is determined by which face has isFacingPanel=true
    const activeFace = findFacingPanelFace(mergedNode);
    switch (activeFace) {
      case "front":
      case "back":
        divisionAxis = "x";
        break;
      case "right":
      case "left":
        divisionAxis = "z";
        break;
      case "top":
      case "bottom":
        divisionAxis = "y";
        break;
      default:
        divisionAxis = "x";
    }
  } else if (activeDivision.direction === "h") {
    divisionAxis = "y"; // Horizontal → Y axis
  } else if (activeDivision.divisionType === "D") {
    divisionAxis = "z"; // Vertical-Depth → Z axis
  } else {
    divisionAxis = "x"; // Vertical-Width (default) → X axis
  }

  // --- 2. Compute panel reductions for inner space ---
  const leftReduction = getPanelReduction(getPanel(mergedNode, "left"));
  const rightReduction = getPanelReduction(getPanel(mergedNode, "right"));
  const bottomReduction = getPanelReduction(mergedNode.bottom);
  const topReduction = getPanelReduction(mergedNode.top);
  const frontReduction = getPanelReduction(getPanel(mergedNode, "front"));
  const backReduction = getPanelReduction(getPanel(mergedNode, "back"));

  const innerLength = length - leftReduction - rightReduction;
  const innerHeight = height - bottomReduction - topReduction;
  const innerDepth = depth - frontReduction - backReduction;

  // Group shift centers the child group correctly when panels have different sides
  const groupShiftX = (leftReduction - rightReduction) / 2;
  const groupShiftY = (bottomReduction - topReduction) / 2;
  const groupShiftZ = (backReduction - frontReduction) / 2;

  // --- 3. Identify start/end boundary panels for the division axis ---
  let startPanel: PanelStyle | undefined;
  let endPanel: PanelStyle | undefined;
  if (divisionAxis === "x") {
    startPanel = getPanel(mergedNode, "left");
    endPanel = getPanel(mergedNode, "right");
  } else if (divisionAxis === "y") {
    startPanel = mergedNode.bottom;
    endPanel = mergedNode.top;
  } else {
    startPanel = getPanel(mergedNode, "back");
    endPanel = getPanel(mergedNode, "front");
  }

  const divisionStartAlign = activeDivision.start ?? "end";
  const divisionEndAlign = activeDivision.end ?? "end";

  const startPanelThickness = startPanel?.thickness ?? 0;
  const endPanelThickness = endPanel?.thickness ?? 0;

  // How much to shrink the total lindiv space (panels that overlap from inside)
  let lindivStartReduction = 0;
  if (divisionStartAlign === "end" && startPanel?.cpName)
    lindivStartReduction = startPanelThickness;
  else if (divisionStartAlign === "center" && startPanel?.cpName)
    lindivStartReduction = startPanelThickness / 2;

  let lindivEndReduction = 0;
  if (divisionEndAlign === "end" && endPanel?.cpName)
    lindivEndReduction = endPanelThickness;
  else if (divisionEndAlign === "center" && endPanel?.cpName)
    lindivEndReduction = endPanelThickness / 2;

  // --- 4. Compute total space available for lindiv ---
  let totalSizeForLindiv = 0;
  if (divisionAxis === "x")
    totalSizeForLindiv = length - lindivStartReduction - lindivEndReduction;
  else if (divisionAxis === "y")
    totalSizeForLindiv = height - lindivStartReduction - lindivEndReduction;
  else totalSizeForLindiv = depth - lindivStartReduction - lindivEndReduction;

  const partitionThickness = mergedNode.partition?.thickness ?? 0;

  // --- 5. Run lindiv ---
  const zonesRaw = processLindiv(
    activeDivision.linear!,
    totalSizeForLindiv,
    partitionThickness,
    variables,
  );
  if (!Array.isArray(zonesRaw) || zonesRaw.length === 0) return null;

  // --- 6. Apply start/end extra adjustments (for "start" alignment panels) ---
  const zones = [...zonesRaw];

  let startAdjustment = 0;
  if (divisionStartAlign === "start" && startPanel?.cpName)
    startAdjustment = startPanelThickness;
  else if (divisionStartAlign === "center" && startPanel?.cpName)
    startAdjustment = startPanelThickness / 2;

  let endAdjustment = 0;
  if (divisionEndAlign === "start" && endPanel?.cpName)
    endAdjustment = endPanelThickness;
  else if (divisionEndAlign === "center" && endPanel?.cpName)
    endAdjustment = endPanelThickness / 2;

  if (zones.length > 0) {
    zones[0] -= startAdjustment;
    zones[zones.length - 1] -= endAdjustment;
  }

  // --- 7. Compute rendering reversal ---
  const shouldReverseOrder =
    activeDivision.divisionType === "P" &&
    (() => {
      const activeFace = findFacingPanelFace(mergedNode);
      return activeFace === "right" || activeFace === "back";
    })();

  return {
    divisionAxis,
    zones,
    shouldReverseOrder,
    innerLength,
    innerHeight,
    innerDepth,
    groupShiftX,
    groupShiftY,
    groupShiftZ,
    partitionThickness,
  };
}
