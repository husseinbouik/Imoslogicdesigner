import { useState, useMemo } from "react";
import { useConfigData } from "./useConfigData";
import { type ZoneNode, type Selection, type Face } from "../types/types";
import { findNodeByIndex, updateNodeInTree } from "../utils/tree";
import {
  defaultPanelStyles,
  defaultDivision,
  defaultPartition,
} from "../utils/default";
import { calculateInheritedStyle } from "../utils/style-calculator";
import { calculateNodeDimensions } from "../utils/dimension-calculator";
import {
  getPanel,
  isSideFace,
  faceToSideKeyMap,
  FACE_INFO_MAP,
} from "../utils/faces";
import { generateChildrenFromLinearDivision } from "../utils/zone-generator";

export function useZoningLogic() {
  const [data, setData] = useConfigData();
  const [selection, setSelection] = useState<Selection | null>(null);

  const rootCalculatedDims = useMemo(() => {
    const dims = calculateNodeDimensions(
      data.root,
      data.root.index,
      data.divisionData,
    );
    return (
      dims ?? {
        length: data.root.length || 0,
        height: data.root.height || 0,
        depth: data.root.depth || 0,
      }
    );
  }, [data]);

  const rawSelectedNode = selection
    ? findNodeByIndex(data.root, selection.index)
    : null;

  const displaySelectedNode = useMemo(() => {
    if (!rawSelectedNode || !selection) return null;
    const inheritedStyle = calculateInheritedStyle(data.root, selection.index);
    const calculatedDims = calculateNodeDimensions(
      data.root,
      selection.index,
      data.divisionData,
    );
    return { ...inheritedStyle, ...rawSelectedNode, ...calculatedDims };
  }, [rawSelectedNode, selection, data]);

  const isRootSelected =
    rawSelectedNode !== null && rawSelectedNode === data.root;

  const handleSelect = (newSelection: Selection) => {
    setSelection(prevSelection => {
      if (
        prevSelection &&
        prevSelection.index === newSelection.index &&
        prevSelection.part === newSelection.part
      ) {
        return null;
      }
      return newSelection;
    });
  };

  const handleNodeChange = (updatedNode: ZoneNode) => {
    const newRoot = updateNodeInTree(data.root, updatedNode, selection!.index);
    setData({ ...data, root: newRoot });
    if (selection && selection.index !== updatedNode.index) {
      setSelection(currentSelection => ({
        ...currentSelection!,
        index: updatedNode.index,
      }));
    }
  };

  const handleToggleFaceStyle = (nodeIndex: string, face: Face) => {
    const nodeToUpdate = findNodeByIndex(data.root, nodeIndex);
    if (!nodeToUpdate) return;

    const isSide = isSideFace(face);
    const sideKey = isSide ? faceToSideKeyMap.get(face) : null;
    const updatedNode: ZoneNode = { ...nodeToUpdate };
    const isPanelComponentActive = getPanel(nodeToUpdate, face)?.cpName;

    if (isPanelComponentActive) {
      // DEACTIVATING
      const panelToStore =
        isSide && sideKey
          ? updatedNode.sides![sideKey]
          : updatedNode[face as "top" | "bottom"];

      // Store in hidden state
      if (isSide && sideKey) {
        if (!updatedNode._sides) updatedNode._sides = {};
        updatedNode._sides[sideKey] = panelToStore;
      } else {
        (updatedNode as any)[`_${face}`] = panelToStore;
      }

      // Preserve isFacingPanel or remove completely
      if (panelToStore!.isFacingPanel) {
        const remainingPanel = { isFacingPanel: true };
        if (isSide && sideKey) {
          if (!updatedNode.sides) updatedNode.sides = {};
          updatedNode.sides[sideKey] = remainingPanel;
        } else {
          (updatedNode as any)[face] = remainingPanel;
        }
      } else {
        if (isSide && sideKey) {
          if (updatedNode.sides) delete updatedNode.sides[sideKey];
          if (updatedNode.sides && Object.keys(updatedNode.sides).length === 0)
            delete updatedNode.sides;
        } else {
          delete (updatedNode as Partial<ZoneNode>)[face as "top" | "bottom"];
        }
      }
    } else {
      // ACTIVATING
      const activePanel = getPanel(updatedNode, face);
      const storedPanel =
        isSide && sideKey
          ? updatedNode._sides?.[sideKey]
          : (updatedNode as any)[`_${face}`];

      // Clean up hidden state
      if (isSide && sideKey) {
        if (updatedNode._sides?.[sideKey]) {
          delete updatedNode._sides[sideKey];
          if (Object.keys(updatedNode._sides).length === 0)
            delete updatedNode._sides;
        }
      } else {
        delete (updatedNode as any)[`_${face}`];
      }

      // Dynamically generate the panel index based on its parent and its face index
      const faceInfo = FACE_INFO_MAP.get(face)!;
      const dynamicIndex = `${nodeToUpdate.index}.${faceInfo.index}`;

      const defaultPanel = defaultPanelStyles[face];
      const newPanel = {
        ...defaultPanel,
        ...(storedPanel ?? {}),
        ...(activePanel ?? {}),
        index: dynamicIndex, // Set the dynamically generated index here
      };

      if (isSide && sideKey) {
        if (!updatedNode.sides) updatedNode.sides = {};
        updatedNode.sides[sideKey] = newPanel;
      } else {
        (updatedNode as any)[face] = newPanel;
      }
    }

    const newRoot = updateNodeInTree(data.root, updatedNode, nodeIndex);
    setData({ ...data, root: newRoot });
  };

  const handleToggleDivision = (nodeIndex: string) => {
    const nodeToUpdate = findNodeByIndex(data.root, nodeIndex);
    if (!nodeToUpdate) return;

    const isDivisionActive = nodeToUpdate.division !== undefined;
    const updatedNode: ZoneNode = { ...nodeToUpdate };

    if (isDivisionActive) {
      if (updatedNode.division) updatedNode._division = updatedNode.division;
      if (updatedNode.partition) updatedNode._partition = updatedNode.partition;
      if (updatedNode.children) updatedNode._children = updatedNode.children;
      delete updatedNode.division;
      delete updatedNode.partition;
      delete updatedNode.children;
    } else {
      updatedNode.division = updatedNode._division ?? { ...defaultDivision };
      updatedNode.partition = updatedNode._partition ?? { ...defaultPartition };

      if (updatedNode._children) {
        updatedNode.children = updatedNode._children;
      } else if (updatedNode.division?.linear) {
        updatedNode.children = generateChildrenFromLinearDivision(
          updatedNode.index,
          updatedNode.division.linear,
        );
      }

      delete updatedNode._division;
      delete updatedNode._partition;
      delete updatedNode._children;
    }
    const newRoot = updateNodeInTree(data.root, updatedNode, nodeIndex);
    setData({ ...data, root: newRoot });
  };

  const handleToggleDrawer = (nodeIndex: string) => {
    const nodeToUpdate = findNodeByIndex(data.root, nodeIndex);
    if (!nodeToUpdate) return;

    const isDrawerActive = nodeToUpdate.drawer !== undefined;
    const updatedNode: ZoneNode = { ...nodeToUpdate };

    if (isDrawerActive) {
      if (updatedNode.drawer) updatedNode._drawer = updatedNode.drawer;
      delete updatedNode.drawer;
    } else {
      updatedNode.drawer = updatedNode._drawer ?? {
        linear: "1",
        configs: { "0": {} },
      };
      delete updatedNode._drawer;
    }
    const newRoot = updateNodeInTree(data.root, updatedNode, nodeIndex);
    setData({ ...data, root: newRoot });
  };

  const handleRootDimensionChange = (
    dimension: "length" | "height" | "depth",
    value: number,
  ) => {
    if (isNaN(value) || value < 0) return;
    const newRoot = { ...data.root, [dimension]: value };
    setData({ ...data, root: newRoot });
  };

  return {
    data,
    setData,
    selection,
    rootCalculatedDims,
    rawSelectedNode,
    displaySelectedNode,
    isRootSelected,
    handleSelect,
    handleNodeChange,
    handleToggleFaceStyle,
    handleToggleDivision,
    handleToggleDrawer,
    handleRootDimensionChange,
  };
}
