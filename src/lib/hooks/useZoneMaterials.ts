import { useMemo } from "react";
import { type ZoneNode, type PanelStyle } from "../types/types";
import { FACE_KEYS_BY_THREE_ORDER, getPanel } from "../utils/faces";

export function useZoneMaterials(
  mergedStyle: ZoneNode,
  formData?: Record<string, string>
) {
  return useMemo(() => {
    return FACE_KEYS_BY_THREE_ORDER.map(face => {
      const panelStyle = getPanel(mergedStyle, face) as PanelStyle | undefined;
      const hasCpName = !!panelStyle?.cpName;

      return {
        color: "#fbb8b8",
        emissive: "black",
        emissiveIntensity: 0,
        wireframe: true,
        transparent: hasCpName,
        opacity: hasCpName ? 0 : 1,
      };
    });
  }, [mergedStyle, formData]);
}
