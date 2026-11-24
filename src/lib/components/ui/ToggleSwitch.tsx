import { type ChangeEvent } from "react";
import "./ToggleSwitch.css";

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleSwitch({
  id,
  checked,
  onChange,
  disabled = false,
}: ToggleSwitchProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="toggle-switch-container">
      <input
        type="checkbox"
        id={id}
        className="toggle-switch-checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <label htmlFor={id} className="toggle-switch-label" />
    </div>
  );
}
