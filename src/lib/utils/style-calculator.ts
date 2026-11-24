import { type ZoneNode } from "../types/types";
import { mergePanelStyle } from "./style";
import { getPanel } from "./faces";

// Helper to find the path of nodes from the root to the target index.
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

export function calculateInheritedStyle(
  root: ZoneNode,
  index: string
): Partial<ZoneNode> {
  const path = findPathToNode(root, index);

  if (!path) {
    return {};
  }

  const computedStyle: Partial<ZoneNode> = {};

  // Iterate down the path, merging styles from parent to child
  for (const node of path) {
    computedStyle.top = mergePanelStyle(computedStyle.top, node.top);
    computedStyle.bottom = mergePanelStyle(computedStyle.bottom, node.bottom);

    // Merge sides
    computedStyle.sides = {
      "0": mergePanelStyle(
        getPanel(computedStyle, "front"),
        getPanel(node, "front")
      ),
      "1": mergePanelStyle(
        getPanel(computedStyle, "right"),
        getPanel(node, "right")
      ),
      "2": mergePanelStyle(
        getPanel(computedStyle, "back"),
        getPanel(node, "back")
      ),
      "3": mergePanelStyle(
        getPanel(computedStyle, "left"),
        getPanel(node, "left")
      ),
    };

    computedStyle.color = node.color ?? computedStyle.color;
    computedStyle.partition = node.partition ?? computedStyle.partition;
  }

  return computedStyle;
}
