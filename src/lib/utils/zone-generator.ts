import type { ZoneNode } from "../types/types";

/**
 * Generates child nodes based on linear division string.
 * @param parentIndex The index of the parent node.
 * @param linearDivisionString The string defining the division (e.g., "1:2:1").
 * @returns An array of new ZoneNode children.
 */
export function generateChildrenFromLinearDivision(
  parentIndex: string,
  linearDivisionString: string
): ZoneNode[] {
  const desiredChildrenCount = linearDivisionString.split(":").length;
  const newChildren: ZoneNode[] = [];
  for (let i = 0; i < desiredChildrenCount; i++) {
    newChildren.push({
      index: `${parentIndex}.${i}`,
      zoneName: "Article Designer",
    });
  }
  return newChildren;
}
