import { type ChangeEvent } from "react";
import { FaLock, FaUnlock } from "react-icons/fa";
import "./LockedInput.css";

interface LockedInputProps {
  name: string;
  value: number;
  defaultValue: number;
  isLocked: boolean; // Receives lock state from parent
  onToggleLock: () => void; // Tells parent to toggle the lock
  onChange: (e: {
    target: { name: string; value: string; type: string };
  }) => void;
  isParentDisabled?: boolean;
}

export function LockedInput({
  name,
  value,
  defaultValue,
  isLocked,
  onToggleLock,
  onChange,
  isParentDisabled = false,
}: LockedInputProps) {
  const handleLockToggle = () => {
    // If we are currently unlocked and are about to lock...
    if (!isLocked) {
      // ...then first check if a revert is needed.
      if (value !== defaultValue) {
        onChange({
          target: { name, value: String(defaultValue), type: "number" },
        });
      }
    }
    // In either case, tell the parent to flip the lock state.
    onToggleLock();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };

  return (
    <div className="input-with-button">
      <input
        type="number"
        name={name}
        value={value}
        onChange={handleInputChange}
        disabled={isParentDisabled || isLocked}
      />
      <button
        className="lock-btn"
        onClick={handleLockToggle}
        title={isLocked ? "Unlock to edit" : "Lock and revert to default"}
        disabled={isParentDisabled}
      >
        {isLocked ? <FaLock /> : <FaUnlock />}
      </button>
    </div>
  );
}
