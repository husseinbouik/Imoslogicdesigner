import {
  type ChangeEvent,
  type KeyboardEvent,
  useState,
  useEffect,
} from "react";
import type { ZoneNode } from "../../types/types";
import { PartitionSettings } from "./PartitionSettings";

export function CommonDivisionSettings({
  node,
  onDivisionChange,
  onLinearUpdate,
  onPartitionChange,
  // --- Receive lock state props and pass them through ---
  lockStates,
  handleLockToggle,
}: {
  node: ZoneNode;
  onDivisionChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onLinearUpdate: (value: string) => void;
  onPartitionChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  // --- Define prop types ---
  lockStates: Record<string, boolean>;
  handleLockToggle: (key: string) => void;
}) {
  const [localLinear, setLocalLinear] = useState(node.division?.linear ?? "");
  useEffect(() => {
    setLocalLinear(node.division?.linear ?? "");
  }, [node.division?.linear, node.index]);

  const commitLinearUpdate = () => {
    if (localLinear !== (node.division?.linear ?? "")) {
      onLinearUpdate(localLinear);
    }
  };

  const handleLinearKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitLinearUpdate();
      (e.target as HTMLInputElement).blur();
    }
  };

  const partitionLockKey = `partition-${node.index}`;

  return (
    <>
      <label>Linear</label>
      <input
        type="text"
        name="linear"
        value={localLinear}
        onChange={e => setLocalLinear(e.target.value)}
        onKeyDown={handleLinearKeyDown}
        onBlur={commitLinearUpdate}
        placeholder="e.g., 1:1, 2:3"
      />
      <label>Start</label>
      <select
        name="start"
        value={node.division?.start ?? "end"}
        onChange={onDivisionChange}
      >
        <option value="start">start</option>
        <option value="center">center</option>
        <option value="end">end</option>
      </select>
      <label>End</label>
      <select
        name="end"
        value={node.division?.end ?? "end"}
        onChange={onDivisionChange}
      >
        <option value="start">start</option>
        <option value="center">center</option>
        <option value="end">end</option>
      </select>
      <PartitionSettings
        node={node}
        onPartitionChange={onPartitionChange}
        isThicknessLocked={lockStates[partitionLockKey] ?? true}
        onToggleThicknessLock={() => handleLockToggle(partitionLockKey)}
      />
    </>
  );
}
