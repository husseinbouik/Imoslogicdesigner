import { Fragment, useState, useEffect } from "react";
import type { ZoneNode } from "../../types/types";
import { MODEL_OPTIONS } from "../../constants/modelOptions";
export function DrawerSettings({
  node,
  onDrawerChange,
}: {
  node: ZoneNode;
  onDrawerChange: (drawer: any) => void;
}) {
  const drawer = node.drawer || {};
  const [localLinear, setLocalLinear] = useState(drawer.linear || "1");

  useEffect(() => {
    setLocalLinear(drawer.linear || "1");
  }, [drawer.linear]);

  const handleLinearBlur = () => {
    if (localLinear !== drawer.linear) {
      onDrawerChange({ ...drawer, linear: localLinear });
    }
  };

  const currentParts = (drawer.linear || "1").split(":").length;
  const configs = drawer.configs || {};

  const handleConfigChange = (index: string, key: string, value: string) => {
    const newConfigs = { ...configs };
    if (!newConfigs[index]) newConfigs[index] = {};
    (newConfigs[index] as any)[key] = value;
    onDrawerChange({ ...drawer, configs: newConfigs });
  };

  return (
    <div className="property-grid">
      <label>Linear Division</label>
      <input
        type="text"
        value={localLinear}
        onChange={e => setLocalLinear(e.target.value)}
        onBlur={handleLinearBlur}
        placeholder="e.g. 1:1"
      />
      <label>Default CPID</label>
      <select
        value={drawer.defaultCpName || ""}
        onChange={e =>
          onDrawerChange({ ...drawer, defaultCpName: e.target.value })
        }
      >
        {MODEL_OPTIONS.map((option: { value: string; label: string }) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <hr className="property-separator" />
      <label style={{ gridColumn: "1 / -1", fontWeight: "bold" }}>
        Drawer Parts
      </label>

      {Array.from({ length: currentParts }).map((_, i) => (
        <Fragment key={i}>
          <label>Drawer {i} CPID</label>
          <select
            value={configs[i.toString()]?.cpName || ""}
            onChange={e =>
              handleConfigChange(i.toString(), "cpName", e.target.value)
            }
          >
            {MODEL_OPTIONS.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Fragment>
      ))}
    </div>
  );
}
