import type { ChangeEvent } from "react";
import type { ZoneNode, Partition } from "../../types/types";
import { LockedInput } from "../ui/LockedInput";
import { MODEL_OPTIONS } from "../../constants/modelOptions";

export function PartitionSettings({
  node,
  onPartitionChange,
  // --- Receive lock state props ---
  isThicknessLocked,
  onToggleThicknessLock,
}: {
  node: ZoneNode;
  onPartitionChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  // --- Define prop types ---
  isThicknessLocked: boolean;
  onToggleThicknessLock: () => void;
}) {
  const isLinearActive =
    !!node.division?.linear && node.division.linear.trim() !== "";
  const partition =
    node.partition || ({ type: "virtual", thickness: 0 } as Partition);

  // Determine contextual default value for partition
  const defaultThickness = partition.type === "partition" ? 18 : 0;

  return (
    <>
      <hr className="property-separator" />
      <label>Partition Type</label>
      <select
        name="type"
        value={partition.type}
        onChange={onPartitionChange}
        disabled={!isLinearActive}
      >
        <option value="virtual">Virtual</option>
        <option value="partition">Partition</option>
      </select>
      <label>Thickness</label>
      <LockedInput
        name="thickness"
        value={partition.thickness}
        defaultValue={defaultThickness}
        isLocked={isThicknessLocked}
        onToggleLock={onToggleThicknessLock}
        onChange={
          onPartitionChange as (e: {
            target: { name: string; value: string; type: string };
          }) => void
        }
        isParentDisabled={!isLinearActive}
      />

      <label>cpName</label>
      <select
        name="cpName"
        value={partition.cpName ?? ""}
        onChange={onPartitionChange}
        disabled={!isLinearActive || partition.type === "virtual"}
      >
        {MODEL_OPTIONS.map((option: { value: string; label: string }) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}
