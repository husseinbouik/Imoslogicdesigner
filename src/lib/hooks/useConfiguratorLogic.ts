import { useState, type ChangeEvent } from "react";
import type { ZoneNode } from "../types/types";
import { useZoneEditActions } from "./useZoneEditActions";

/**
 * useConfiguratorLogic
 *
 * Owns UI-only state for the configurator panel:
 * - Lock states for thickness inputs
 * - Simple field-level node edits (zoneName, cpName etc.)
 *
 * Structural mutations (division, panels, partition) are delegated
 * to useZoneEditActions.
 */
export function useConfiguratorLogic(
  selectedNode: ZoneNode | null,
  displayNode: ZoneNode | null,
  onNodeChange: (updatedNode: ZoneNode) => void,
) {
  const [lockStates, setLockStates] = useState<Record<string, boolean>>({});

  const handleLockToggle = (key: string) => {
    setLockStates(prev => ({
      ...prev,
      [key]: !(prev[key] ?? true),
    }));
  };

  /** Handles simple top-level field changes (e.g. zoneName, cpName). */
  const handleNodeChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!selectedNode) return;
    const { name, value, type } = e.target;
    onNodeChange({
      ...selectedNode,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const editActions = useZoneEditActions(
    selectedNode,
    displayNode,
    onNodeChange,
  );

  return {
    lockStates,
    handleLockToggle,
    handleNodeChange,
    // Structural zone edit actions
    handleDivisionChange: editActions.handleDivisionChange,
    handleLinearUpdate: editActions.handleLinearUpdate,
    handlePartitionChange: editActions.handlePartitionChange,
    handlePanelChange: editActions.handlePanelChange,
    /** @deprecated Use handleFacingPanelChange */
    handleDevFlemChange: editActions.handleFacingPanelChange,
    handleFacingPanelChange: editActions.handleFacingPanelChange,
  };
}
