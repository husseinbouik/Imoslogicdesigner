import { type ZoneNode, type DivisionData } from "../types/types";
import { computeZoneLayout } from "./zone-layout";
import { calculateInheritedStyle } from "./style-calculator";
import { mergePanelStyle } from "./style";
import { getPanel } from "./faces";

function findPathToNode(root: ZoneNode, index: string): ZoneNode[] | null {
  if (root.index === index) {
    return [root];
  }
  if (root.children) {
    for (const child of root.children) {
      const path = findPathToNode(child, index);
      if (path) {
        return [root, ...path];
      }
    }
  }
  return null;
}

export function calculateNodeDimensions(
  root: ZoneNode,
  index: string,
  divisionData: Record<string, DivisionData>,
): { length: number; height: number; depth: number } | null {
  const path = findPathToNode(root, index);
  if (!path) return null;

  const targetNode = path[path.length - 1];
  let allocatedDims: { length: number; height: number; depth: number };

  if (index === root.index) {
    allocatedDims = {
      length: root.length!,
      height: root.height!,
      depth: root.depth!,
    };
  } else {
    const parent = path[path.length - 2];
    const parentDims = calculateNodeDimensions(
      root,
      parent.index,
      divisionData,
    );
    if (!parentDims) return null;

    const activeDivision = divisionData[parent.index] || parent.division;
    if (!activeDivision || !parent.children?.length) {
      allocatedDims = parentDims;
    } else {
      const childIndexInParent = parent.children.findIndex(
        c => c.index === targetNode.index,
      );
      if (childIndexInParent === -1) return null;

      const parentInheritedStyle = calculateInheritedStyle(root, parent.index);

      // Build the merged parent node (inherited styles + own styles)
      const mergedParentNode: ZoneNode = { ...parent };
      mergedParentNode.top = mergePanelStyle(
        parentInheritedStyle.top,
        parent.top,
      );
      mergedParentNode.bottom = mergePanelStyle(
        parentInheritedStyle.bottom,
        parent.bottom,
      );
      mergedParentNode.sides = {
        "0": mergePanelStyle(
          getPanel(parentInheritedStyle, "front"),
          getPanel(parent, "front"),
        ),
        "1": mergePanelStyle(
          getPanel(parentInheritedStyle, "right"),
          getPanel(parent, "right"),
        ),
        "2": mergePanelStyle(
          getPanel(parentInheritedStyle, "back"),
          getPanel(parent, "back"),
        ),
        "3": mergePanelStyle(
          getPanel(parentInheritedStyle, "left"),
          getPanel(parent, "left"),
        ),
      };
      mergedParentNode.color = parent.color ?? parentInheritedStyle.color;
      mergedParentNode.partition =
        parent.partition ?? parentInheritedStyle.partition;

      const { length, height, depth } = parentDims;

      const layout = computeZoneLayout({
        mergedNode: mergedParentNode,
        activeDivision,
        length,
        height,
        depth,
      });

      if (!layout) return null;

      const { divisionAxis, zones, innerLength, innerHeight, innerDepth } =
        layout;

      // The index into zones — use the unreversed order for dimension lookups
      const zoneSizeMM = zones[childIndexInParent];
      if (zoneSizeMM === undefined) return null;

      let finalChildLength = 0,
        finalChildHeight = 0,
        finalChildDepth = 0;

      if (divisionAxis === "x") {
        finalChildLength = zoneSizeMM;
        finalChildHeight = innerHeight;
        finalChildDepth = innerDepth;
      } else if (divisionAxis === "y") {
        finalChildLength = innerLength;
        finalChildHeight = zoneSizeMM;
        finalChildDepth = innerDepth;
      } else {
        finalChildLength = innerLength;
        finalChildHeight = innerHeight;
        finalChildDepth = zoneSizeMM;
      }

      allocatedDims = {
        length: finalChildLength,
        height: finalChildHeight,
        depth: finalChildDepth,
      };
    }
  }

  // inset does not change the outer allocated dimensions.
  return allocatedDims;
}
