import { type PanelStyle } from "../types/types";

export function mergePanelStyle(
  base?: PanelStyle,
  child?: PanelStyle,
): PanelStyle | undefined {
  if (!base && !child) {
    return undefined;
  }
  const index = child?.index ?? base?.index;
  const isFacingPanel = child?.isFacingPanel ?? base?.isFacingPanel;
  const color = child?.color ?? base?.color;
  const thickness = child?.thickness ?? base?.thickness;
  const cpName = child?.cpName ?? base?.cpName;
  const inset = child?.inset ?? base?.inset;
  const startTrim = child?.startTrim ?? base?.startTrim;
  const endTrim = child?.endTrim ?? base?.endTrim;
  const topTrim = child?.topTrim ?? base?.topTrim;
  const botTrim = child?.botTrim ?? base?.botTrim;
  const sidesReference = child?.sidesReference ?? base?.sidesReference;

  // If none of the properties exist, return undefined
  if (
    index === undefined &&
    isFacingPanel === undefined &&
    color === undefined &&
    thickness === undefined &&
    cpName === undefined &&
    inset === undefined &&
    startTrim === undefined &&
    endTrim === undefined &&
    topTrim === undefined &&
    botTrim === undefined &&
    sidesReference === undefined
  ) {
    return undefined;
  }

  // Build the new panel object with any properties that were found
  const newPanel: PanelStyle = {};
  if (index) {
    newPanel.index = index;
  }
  if (isFacingPanel) {
    newPanel.isFacingPanel = isFacingPanel;
  }
  if (color) {
    newPanel.color = color;
  }
  if (thickness !== undefined) {
    newPanel.thickness = thickness;
  }
  if (cpName) {
    newPanel.cpName = cpName;
  }
  if (inset !== undefined) {
    newPanel.inset = inset;
  }
  if (startTrim) {
    newPanel.startTrim = startTrim;
  }
  if (endTrim) {
    newPanel.endTrim = endTrim;
  }
  if (topTrim) {
    newPanel.topTrim = topTrim;
  }
  if (botTrim) {
    newPanel.botTrim = botTrim;
  }
  if (sidesReference) {
    newPanel.sidesReference = sidesReference;
  }
  return newPanel;
}
