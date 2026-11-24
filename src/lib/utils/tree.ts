import { type ZoneNode } from "../types/types";

/**
 * Recursively finds a node within a tree by its index.
 */
export function findNodeByIndex(
  root: ZoneNode,
  index: string
): ZoneNode | null {
  if (root.index === index) {
    return root;
  }
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByIndex(child, index);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Recursively updates a node in the tree and returns a new tree structure.
 * This ensures immutability.
 */
export function updateNodeInTree(
  root: ZoneNode,
  updatedNode: ZoneNode,
  targetIndex: string
): ZoneNode {
  if (root.index === targetIndex) {
    // When the node is found, return the updated version, merging with the old one
    // to preserve any properties not being edited.
    return { ...updatedNode };
  }

  if (root.children) {
    // If not found at this level, recurse through the children.
    return {
      ...root,
      children: root.children.map(child =>
        updateNodeInTree(child, updatedNode, targetIndex)
      ),
    };
  }
  return root;
}
