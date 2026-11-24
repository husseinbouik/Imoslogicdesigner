import { useEffect } from "react";
import type { ZoneNode, Face } from "../../types/types";
import "./Configurator.css";
import type { Selection } from "../../types/types";
import { getPanel } from "../../utils/faces";
import { useCPs } from "../../hooks/useCPs";

interface ConfiguratorProps {
  selection: Selection | null;
  selectedNode: ZoneNode | null;
  onNodeChange: (updatedNode: ZoneNode) => void;
  isRoot: boolean;
  displayNode: ZoneNode | null;
}

import { PanelStyleEditor } from "./PanelStyleEditor";
import { CommonDivisionSettings } from "./CommonDivisionSettings";
import { DrawerSettings } from "./DrawerSettings";
import { useConfiguratorLogic } from "../../hooks/useConfiguratorLogic";

export function Configurator({
  selection,
  selectedNode,
  displayNode,
  onNodeChange,
  isRoot,
}: ConfiguratorProps) {
  const {
    lockStates,
    handleLockToggle,
    handleNodeChange,
    handleDivisionChange,
    handleLinearUpdate,
    handlePartitionChange,
    handlePanelChange,
    handleDevFlemChange,
  } = useConfiguratorLogic(selectedNode, displayNode, onNodeChange);

  useEffect(() => {
    if (
      selection?.part === "division" &&
      selectedNode?.division &&
      !selectedNode.division.direction
    ) {
      onNodeChange({
        ...selectedNode,
        division: {
          ...selectedNode.division,
          direction: "h",
        },
      });
    }
  }, [selection, selectedNode, onNodeChange]);

  const { cps, loading: cpsLoading } = useCPs();

  if (!selectedNode || !selection) {
    return null;
  }

  const selectedPart = selection.part;
  const headerText = `Article Index: ${selectedNode.index}`;
  const isFace = ["left", "right", "top", "bottom", "front", "back"].includes(
    selectedPart ?? "",
  );

  const isVertical = selectedNode.division?.direction === "v";
  const panelLockKey = isFace ? `panel-${selectedPart}` : "";

  return (
    <div className="configurator-container">
      <div className="configurator-header">{headerText}</div>

      {!selectedPart && (
        <div className="property-grid">
          <label>Zone Name</label>
          <input
            type="text"
            name="zoneName"
            value={selectedNode.zoneName ?? ""}
            onChange={handleNodeChange}
          />
          {!isRoot && (
            <>
              <label>cpName</label>
              <select
                name="cpName"
                value={selectedNode.cpName ?? ""}
                onChange={handleNodeChange}
                disabled={cpsLoading}
              >
                <option value="">
                  {cpsLoading ? "Loading CPs…" : "(none)"}
                </option>
                {cps.map(cp => (
                  <option key={cp.id} value={cp.name}>
                    {cp.name}
                    {cp.partDefinition
                      ? ` — ${cp.partDefinition.name}`
                      : " (no PD)"}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {isFace && (
        <PanelStyleEditor
          panel={getPanel(selectedNode, selectedPart as Face)}
          name={selectedPart as keyof ZoneNode}
          onChange={handlePanelChange}
          onDevFlemChange={isEnabled =>
            handleDevFlemChange(selectedPart as Face, isEnabled)
          }
          isPerpendicularDivision={selectedNode.division?.divisionType === "P"}
          isThicknessLocked={lockStates[panelLockKey] ?? true}
          onToggleThicknessLock={() => handleLockToggle(panelLockKey)}
        />
      )}

      {selectedPart === "division" && (
        <div className="property-grid">
          <label>Direction</label>
          <select
            name="direction"
            value={selectedNode.division?.direction ?? "h"}
            onChange={handleDivisionChange}
          >
            <option value="h">Horizontal</option>
            <option value="v">Vertical</option>
          </select>

          {isVertical && (
            <>
              <label>Division Type</label>
              <select
                name="divisionType"
                value={selectedNode.division?.divisionType ?? "W"}
                onChange={handleDivisionChange}
              >
                <option value="W">Width</option>
                <option value="D">Depth</option>
                <option value="P">Perpendicular</option>
              </select>
            </>
          )}

          <CommonDivisionSettings
            node={selectedNode}
            onDivisionChange={handleDivisionChange}
            onLinearUpdate={handleLinearUpdate}
            onPartitionChange={handlePartitionChange}
            lockStates={lockStates}
            handleLockToggle={handleLockToggle}
          />
        </div>
      )}

      {selectedPart === "drawer" && (
        <DrawerSettings
          node={selectedNode}
          onDrawerChange={drawer => onNodeChange({ ...selectedNode, drawer })}
        />
      )}
    </div>
  );
}
