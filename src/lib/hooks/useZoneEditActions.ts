import type { ChangeEvent } from "react";
import type {
  ZoneNode,
  PanelStyle,
  Partition,
  SideFaceKey,
  Face,
  Division,
} from "../types/types";
import { processLindiv } from "imos-linear-division";
import { FACES_BY_USER_INDEX } from "../utils/faces";
import { getPanel, isSideFace, faceToSideKeyMap } from "../utils/faces";

/**
 * useZoneEditActions
 *
 * Contains all structural mutation handlers that modify the ZoneNode tree.
 * These are domain/business logic concerns (division, panel, partition).
 *
 * Separated from useConfiguratorLogic (which owns UI-only state like lock toggles).
 */
export function useZoneEditActions(
  selectedNode: ZoneNode | null,
  displayNode: ZoneNode | null,
  onNodeChange: (updatedNode: ZoneNode) => void,
) {
  const handleDivisionChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!selectedNode) return;
    const { name, value } = e.target;
    const updatedNode = { ...selectedNode };
    const currentDivision = updatedNode.division || {};
    const newDivision: Division = { ...currentDivision };

    if (name === "direction") {
      const newDirection = value as "h" | "v";
      newDivision.direction = newDirection;

      if (newDirection === "h") {
        delete newDivision.divisionType;
      } else {
        newDivision.divisionType = currentDivision.divisionType || "W";
      }
    } else if (name === "divisionType") {
      const newDivisionType = value as "W" | "D" | "P";
      newDivision.divisionType = newDivisionType;
      newDivision.direction = "v";

      if (newDivisionType === "P") {
        const anyFaceHasFacingPanel = FACES_BY_USER_INDEX.some(
          fi => getPanel(updatedNode, fi.key)?.isFacingPanel,
        );
        if (!anyFaceHasFacingPanel) {
          if (!updatedNode.sides) updatedNode.sides = {};
          const frontPanel = updatedNode.sides["0"] || {};
          updatedNode.sides["0"] = { ...frontPanel, isFacingPanel: true };
        }
      } else {
        for (const fi of FACES_BY_USER_INDEX) {
          const panel = getPanel(updatedNode, fi.key);
          if (panel?.isFacingPanel) {
            //eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { isFacingPanel, ...rest } = panel;
            const newPanel = Object.keys(rest).length > 0 ? rest : undefined;

            if (isSideFace(fi.key)) {
              const sideKey = faceToSideKeyMap.get(fi.key);
              if (sideKey && updatedNode.sides) {
                if (newPanel) {
                  updatedNode.sides[sideKey] = newPanel;
                } else {
                  delete updatedNode.sides[sideKey];
                  if (Object.keys(updatedNode.sides).length === 0) {
                    delete updatedNode.sides;
                  }
                }
              }
            } else {
              if (newPanel) {
                updatedNode[fi.key as "top" | "bottom"] = newPanel;
              } else {
                delete updatedNode[fi.key as "top" | "bottom"];
              }
            }
          }
        }
      }
    } else {
      (newDivision as any)[name] = value;
    }

    updatedNode.division = newDivision;
    onNodeChange(updatedNode);
  };

  const handleLinearUpdate = (value: string) => {
    if (!selectedNode) return;
    const linearValue = value.trim();
    const updatedNode: ZoneNode = { ...selectedNode };
    updatedNode.division = {
      ...(updatedNode.division || {}),
      linear: linearValue,
    };
    if (linearValue && !updatedNode.partition) {
      updatedNode.partition = { type: "virtual", thickness: 0 };
    }

    let desiredChildrenCount = 0;
    if (linearValue) {
      if (displayNode) {
        const division = updatedNode.division || {};
        let totalLengthForParsing = 0;
        const activeFacingFace = FACES_BY_USER_INDEX.find(
          f => getPanel(displayNode, f.key)?.isFacingPanel,
        )?.key;

        if (division.divisionType === "P") {
          switch (activeFacingFace) {
            case "front":
            case "back":
              totalLengthForParsing = displayNode.length || 0;
              break;
            case "right":
            case "left":
              totalLengthForParsing = displayNode.depth || 0;
              break;
            case "top":
            case "bottom":
              totalLengthForParsing = displayNode.height || 0;
              break;
            default:
              totalLengthForParsing = displayNode.length || 0;
          }
        } else if (division.direction === "h") {
          totalLengthForParsing = displayNode.height || 0;
        } else {
          totalLengthForParsing =
            division.divisionType === "D"
              ? displayNode.depth || 0
              : displayNode.length || 0;
        }

        const thickness =
          updatedNode.partition?.thickness ??
          displayNode.partition?.thickness ??
          0;
        const result = processLindiv(
          linearValue,
          totalLengthForParsing,
          thickness,
        );
        desiredChildrenCount =
          Array.isArray(result) && result.length > 0 ? result.length : 0;
      } else {
        desiredChildrenCount = linearValue.split(":").length;
      }
    }

    const currentChildren = updatedNode.children || [];
    if (desiredChildrenCount > currentChildren.length) {
      const newChildren = [...currentChildren];
      for (let i = currentChildren.length; i < desiredChildrenCount; i++) {
        newChildren.push({
          index: `${updatedNode.index}.${i}`,
          zoneName: "Article Designer",
        });
      }
      updatedNode.children = newChildren;
    } else if (desiredChildrenCount < currentChildren.length) {
      updatedNode.children = currentChildren.slice(0, desiredChildrenCount);
    }

    onNodeChange(updatedNode);
  };

  const handlePartitionChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!selectedNode) return;
    const { name, value } = e.target;
    const isNumberInput = e.target.type === "number";
    const currentPartition = selectedNode.partition || {
      type: "virtual",
      thickness: 0,
    };
    const updatedPartition: Partition = {
      ...currentPartition,
      [name]: isNumberInput ? parseFloat(value) || 0 : value,
    };
    if (name === "type") {
      if (value === "partition") {
        updatedPartition.thickness = updatedPartition.thickness || 18;
        if (!updatedPartition.cpName) updatedPartition.cpName = "frame";
      } else if (value === "virtual") {
        updatedPartition.thickness = 0;
      }
    }
    onNodeChange({ ...selectedNode, partition: updatedPartition });
  };

  const handlePanelChange = (
    fieldName: keyof ZoneNode,
    value: PanelStyle | undefined,
  ) => {
    if (!selectedNode) return;
    const face = fieldName as Face;
    const updatedNode: ZoneNode = { ...selectedNode };

    if (isSideFace(face)) {
      const sideKey = faceToSideKeyMap.get(face);
      if (sideKey) {
        const newSides = { ...(updatedNode.sides ?? {}) };
        if (value) {
          newSides[sideKey] = value;
          updatedNode.sides = newSides;
        } else {
          delete newSides[sideKey];
          updatedNode.sides =
            Object.keys(newSides).length > 0 ? newSides : undefined;
          if (!updatedNode.sides) delete updatedNode.sides;
        }
      }
    } else {
      if (value) {
        updatedNode[face as "top" | "bottom"] = value;
      } else {
        delete updatedNode[face as "top" | "bottom"];
      }
    }
    onNodeChange(updatedNode);
  };

  const handleFacingPanelChange = (faceKey: Face, isEnabled: boolean) => {
    if (!selectedNode) return;
    const updatedNode = { ...selectedNode };

    for (const fi of FACES_BY_USER_INDEX) {
      let panelChanged = false;
      const currentPanel = getPanel(updatedNode, fi.key)
        ? { ...getPanel(updatedNode, fi.key) }
        : {};

      if (fi.key === faceKey) {
        if (isEnabled) {
          currentPanel!.isFacingPanel = true;
        } else {
          delete currentPanel!.isFacingPanel;
        }
        panelChanged = true;
      } else if (isEnabled && currentPanel?.isFacingPanel) {
        delete currentPanel.isFacingPanel;
        panelChanged = true;
      }

      if (panelChanged) {
        const finalPanel =
          Object.keys(currentPanel).length > 0 ? currentPanel : undefined;
        if (isSideFace(fi.key)) {
          const sideKey = faceToSideKeyMap.get(fi.key)!;
          if (!updatedNode.sides) updatedNode.sides = {};

          if (finalPanel) {
            updatedNode.sides[sideKey as SideFaceKey] =
              finalPanel as PanelStyle;
          } else {
            delete updatedNode.sides[sideKey as SideFaceKey];
            if (Object.keys(updatedNode.sides).length === 0) {
              delete updatedNode.sides;
            }
          }
        } else {
          if (finalPanel) {
            updatedNode[fi.key as "top" | "bottom"] = finalPanel as PanelStyle;
          } else {
            delete updatedNode[fi.key as "top" | "bottom"];
          }
        }
      }
    }
    onNodeChange(updatedNode);
  };

  return {
    handleDivisionChange,
    handleLinearUpdate,
    handlePartitionChange,
    handlePanelChange,
    handleFacingPanelChange,
  };
}
