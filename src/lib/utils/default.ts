import {
  type PanelStyle,
  type Division,
  type Partition,
  type Face,
} from "../types/types";

/**
 * Defines the default style for the TOP face.
 */
const defaultTopPanelStyle: PanelStyle = {
  // REMOVED: index: FACE_INFO_MAP.get("top")!.index.toString(),
  cpName: "top",
  thickness: 18,
  sidesReference: "end",
};

/**
 * Defines the default style for the BOTTOM face.
 */
const defaultBottomPanelStyle: PanelStyle = {
  // REMOVED: index: FACE_INFO_MAP.get("bottom")!.index.toString(),
  cpName: "bottom",
  thickness: 18,
  sidesReference: "end",
};

/**
 * Defines the default style for the LEFT face.
 */
const defaultLeftPanelStyle: PanelStyle = {
  // REMOVED: index: FACE_INFO_MAP.get("left")!.index.toString(),
  cpName: "left",
  thickness: 18,
  sidesReference: "end",
  startTrim: "S",
  endTrim: "S",
  topTrim: "S",
  botTrim: "S",
  inset: "0",
};

/**
 * Defines the default style for the RIGHT face.
 */
const defaultRightPanelStyle: PanelStyle = {
  // REMOVED: index: FACE_INFO_MAP.get("right")!.index.toString(),
  cpName: "right",
  thickness: 18,
  sidesReference: "end",
  startTrim: "S",
  endTrim: "S",
  topTrim: "S",
  botTrim: "S",
  inset: "0",
};

/**
 * Defines the default style for the FRONT face, which is a door.
 */
const defaultFrontPanelStyle: PanelStyle = {
  // REMOVED: index: FACE_INFO_MAP.get("front")!.index.toString(),
  cpName: "front",
  thickness: 18,
  sidesReference: "center",
  inset: "0",
};

/**
 * Defines the default style for the BACK face.
 */
const defaultBackPanelStyle: PanelStyle = {
  // REMOVED: index: FACE_INFO_MAP.get("back")!.index.toString(),
  cpName: "back",
  thickness: 18,
  sidesReference: "end",
  startTrim: "S",
  endTrim: "S",
  topTrim: "S",
  botTrim: "S",
  inset: "0",
};

/**
 * A record mapping each face to its default PanelStyle.
 * This is used when the 'apply default' icon is clicked in the Layers interface.
 */
export const defaultPanelStyles: Record<Face, PanelStyle> = {
  top: defaultTopPanelStyle,
  bottom: defaultBottomPanelStyle,
  left: defaultLeftPanelStyle,
  right: defaultRightPanelStyle,
  front: defaultFrontPanelStyle,
  back: defaultBackPanelStyle,
};

/**
 * Defines the default settings for a newly activated Division.
 * It unambiguously defaults to a 'Horizontal' division.
 */
export const defaultDivision: Division = {
  direction: "h",
  linear: "1:1",
  start: "end",
  end: "end",
};

/**
 * Defines the default settings for a Partition.
 */
export const defaultPartition: Partition = {
  type: "virtual",
  thickness: 0,
  cpName: "frame",
};
