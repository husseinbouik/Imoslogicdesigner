import {
  type Face,
  type ZoneNode,
  type PanelStyle,
  type SideFaceKey,
} from "../types/types";

// The local FaceKey type should be imported from types.ts as Face.
type FaceKey = Face;

export interface FaceInfo {
  key: FaceKey;
  index: number;
  name: string;
}

// User-defined order and indexing: "Front "0", right"1", back"2", left "3", top "4", bottom"5""
const faceInfoArray: readonly FaceInfo[] = [
  { key: "front", index: 0, name: "Door" },
  { key: "right", index: 1, name: "Right Side" },
  { key: "back", index: 2, name: "Back" },
  { key: "left", index: 3, name: "Left Side" },
  { key: "top", index: 4, name: "Top" },
  { key: "bottom", index: 5, name: "Bottom" },
];

// A Map for efficient lookups by the face key (e.g., "front")
export const FACE_INFO_MAP: ReadonlyMap<FaceKey, FaceInfo> = new Map(
  faceInfoArray.map(face => [face.key, face])
);

// An array of faces sorted by the user-defined custom index.
export const FACES_BY_USER_INDEX: readonly FaceInfo[] = [
  ...FACE_INFO_MAP.values(),
].sort((a, b) => a.index - b.index);

// An array of face keys in the order they should appear in the Layers UI.
export const FACE_KEYS_FOR_UI_RENDER: readonly FaceKey[] = [
  "top",
  "bottom",
  "left",
  "right",
  "front",
  "back",
];

// An array of face keys ordered correctly for Three.js BoxGeometry materials array.
// The order is: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
export const FACE_KEYS_BY_THREE_ORDER: readonly FaceKey[] = [
  "right",
  "left",
  "top",
  "bottom",
  "front",
  "back",
];

// --- NEW HELPER FUNCTIONS ---

export function isSideFace(face: Face): boolean {
  return ["front", "back", "left", "right"].includes(face);
}

export const faceToSideKeyMap = new Map<Face, SideFaceKey>([
  ["front", "0"],
  ["right", "1"],
  ["back", "2"],
  ["left", "3"],
]);

/**
 * A centralized function to safely get panel style from a ZoneNode,
 * handling the new "sides" object structure.
 */
export function getPanel(
  node: ZoneNode | Partial<ZoneNode>,
  face: Face
): PanelStyle | undefined {
  if (isSideFace(face)) {
    const sideKey = faceToSideKeyMap.get(face);
    return sideKey ? node.sides?.[sideKey] : undefined;
  }
  // For 'top' and 'bottom'
  return node[face as "top" | "bottom"];
}
