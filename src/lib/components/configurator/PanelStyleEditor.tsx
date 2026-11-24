import { type ChangeEvent, Fragment } from "react";
import type { ZoneNode, PanelStyle } from "../../types/types";
import { LockedInput } from "../ui/LockedInput";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { useCPs } from "../../hooks/useCPs";

export function PanelStyleEditor({
  panel,
  name,
  onChange,
  onDevFlemChange,
  // --- Receive lock state props ---
  isThicknessLocked,
  onToggleThicknessLock,
}: {
  panel: PanelStyle | undefined;
  name: keyof ZoneNode;
  onChange: (fieldName: keyof ZoneNode, value: PanelStyle | undefined) => void;
  onDevFlemChange: (value: boolean) => void;
  isPerpendicularDivision: boolean;
  // --- Define prop types ---
  isThicknessLocked: boolean;
  onToggleThicknessLock: () => void;
}) {
  const handlePanelChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name: propName, value, type } = e.target;
    const isNumberInput = type === "number";
    const isCheckbox = type === "checkbox";

    let finalValue: any;
    if (isCheckbox) {
      finalValue = (e.target as HTMLInputElement).checked;
    } else {
      finalValue = value;
    }

    const newState = { ...(panel || {}) };

    if (finalValue === "") {
      delete (newState as any)[propName];
    } else if (isNumberInput) {
      (newState as any)[propName] = parseFloat(finalValue);
    } else {
      (newState as any)[propName] = finalValue;
    }

    if (Object.keys(newState).length === 0) {
      onChange(name, undefined);
    } else {
      onChange(name, newState);
    }
  };

  const { cps, loading: cpsLoading } = useCPs();
  const showTrims = ["left", "right", "front", "back"].includes(name as string);
  const showInset = !["top", "bottom"].includes(name as string);
  const showPerpendicularDriver = !["top", "bottom"].includes(name as string);
  return (
    <div className="panel-style-section">
      <div className="property-grid">
        <label>cpName</label>
        <select
          name="cpName"
          value={panel?.cpName ?? ""}
          onChange={handlePanelChange}
          disabled={cpsLoading}
        >
          <option value="">{cpsLoading ? "Loading CPs…" : "(none)"}</option>
          {cps.map(cp => (
            <option key={cp.id} value={cp.name}>
              {cp.name}
              {cp.partDefinition ? ` — ${cp.partDefinition.name}` : " (no PD)"}
            </option>
          ))}
        </select>
        <label>thickness</label>
        <LockedInput
          name="thickness"
          value={panel?.thickness ?? 0}
          defaultValue={0} // Faces revert to 0 as requested
          isLocked={isThicknessLocked}
          onToggleLock={onToggleThicknessLock}
          onChange={
            handlePanelChange as (e: {
              target: { name: string; value: string; type: string };
            }) => void
          }
        />
        {showInset && (
          <>
            <label>inset</label>
            <input
              type="text"
              name="inset"
              value={panel?.inset ?? ""}
              onChange={handlePanelChange}
            />
          </>
        )}
        {showTrims && (
          <Fragment>
            <label>startTrim</label>
            <select
              name="startTrim"
              value={panel?.startTrim ?? ""}
              onChange={handlePanelChange}
            >
              <option value="">(default)</option>
              <option value="S">S</option>
              <option value="L">L</option>
              <option value="P">P</option>
            </select>
            <label>endTrim</label>
            <select
              name="endTrim"
              value={panel?.endTrim ?? ""}
              onChange={handlePanelChange}
            >
              <option value="">(default)</option>
              <option value="S">S</option>
              <option value="L">L</option>
              <option value="P">P</option>
            </select>
            <label>topTrim</label>
            <select
              name="topTrim"
              value={panel?.topTrim ?? ""}
              onChange={handlePanelChange}
            >
              <option value="">(default)</option>
              <option value="S">S</option>
              <option value="L">L</option>
              <option value="P">P</option>
            </select>
            <label>botTrim</label>
            <select
              name="botTrim"
              value={panel?.botTrim ?? ""}
              onChange={handlePanelChange}
            >
              <option value="">(default)</option>
              <option value="S">S</option>
              <option value="L">L</option>
              <option value="P">P</option>
            </select>
          </Fragment>
        )}
        {showPerpendicularDriver && (
          <Fragment>
            <hr className="property-separator" />
            <label>1st Division element</label>
            <div style={{ justifySelf: "start" }}>
              <ToggleSwitch
                id={`devflem-toggle-${name as string}`}
                checked={panel?.isFacingPanel ?? false}
                onChange={onDevFlemChange}
              />
            </div>
          </Fragment>
        )}
      </div>
    </div>
  );
}
