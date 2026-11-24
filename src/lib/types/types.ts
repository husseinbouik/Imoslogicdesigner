import type { ComponentType } from "react";
import type { LindivVariables } from "../hooks/useLinearDivision";

export type SideFaceKey = "0" | "1" | "2" | "3";

export interface Division {
  linear?: string;
  direction?: "v" | "h";
  divisionType?: "D" | "W" | "P" | "H";
  key?: string;
  start?: "start" | "center" | "end";
  end?: "start" | "center" | "end";
}

export interface Partition {
  type: "virtual" | "partition";
  thickness: number;
  cpName?: string;
}

export interface DivisionData {
  linear: string;
  direction?: "v" | "h";
  divisionType?: "D" | "W" | "P" | "H";
  start?: "start" | "center" | "end";
  end?: "start" | "center" | "end";
}

export interface ColorStyle {
  defaultColor: string;
  key?: string;
}

export interface PanelStyle {
  index?: string;
  /** Marks this face as the primary perpendicular-division driver (only one face can have this set). */
  isFacingPanel?: boolean;
  color?: ColorStyle;
  thickness?: number;
  cpName?: string;
  inset?: string;
  startTrim?: "S" | "L" | "P";
  endTrim?: "S" | "L" | "P";
  topTrim?: "S" | "L" | "P";
  botTrim?: "S" | "L" | "P";
  sidesReference?: "start" | "center" | "end";
}

export interface DrawerConfig {
  cpName?: string;
}

export interface Drawer {
  linear?: string;
  configs?: Record<string, DrawerConfig>;
  defaultCpName?: string;
}

export interface ZoneNode {
  index: string;
  zoneName?: string;
  division?: Division;
  drawer?: Drawer;
  children?: ZoneNode[];
  length?: number;
  height?: number;
  depth?: number;
  partition?: Partition;
  color?: ColorStyle;
  top?: PanelStyle;
  bottom?: PanelStyle;
  sides?: { [key in SideFaceKey]?: PanelStyle };
  cpName?: string;

  /** Hidden properties to store panel/division state when toggled off. */
  _top?: PanelStyle;
  _bottom?: PanelStyle;
  _sides?: { [key in SideFaceKey]?: PanelStyle };
  _division?: Division;
  _drawer?: Drawer;
  _partition?: Partition;
  _children?: ZoneNode[];
}

export interface ZoneOverrideNode extends Omit<Partial<ZoneNode>, "children"> {
  index: string;
  children?: ZoneOverrideNode[];
}

export interface CustomComponentProps {
  node: ZoneNode;
  panelStyle?: PanelStyle;
  length?: number;
  height?: number;
  depth?: number;
}
export type Face = "front" | "back" | "top" | "bottom" | "left" | "right";

export type Selection = {
  index: string;
  part?:
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "front"
    | "back"
    | "division"
    | "drawer";
};

export type cpNameDataData = ComponentType<CustomComponentProps>;

export interface ZoningProps {
  node: ZoneNode;
  length: number;
  height: number;
  depth: number;
  baseLength?: number;
  baseHeight?: number;
  baseDepth?: number;
  positionOffset?: [number, number, number];
  partition?: Partition;
  divisionData?: Record<string, DivisionData>;
  formData?: Record<string, string>;
  parentStyle?: ZoneNode;
  variables?: LindivVariables;
  cpNameData?: Record<string, cpNameDataData>;
  selectedZone?: string | null;
  onSelect?: (selection: Selection) => void;
  selectedPart?: Selection["part"];
  areWireframesVisible?: boolean;
  rootNode: ZoneNode;
}

export type ZonePublicProps = {
  node: ZoneOverrideNode;
  length?: number;
  height?: number;
  depth?: number;
} & Omit<ZoningProps, "node" | "length" | "height" | "depth">;
export interface ZoneHighlighterProps {
  length: number;
  height: number;
  depth: number;
  face?: Face;
}
