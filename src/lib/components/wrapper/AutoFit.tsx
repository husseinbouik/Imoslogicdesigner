import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AutoFitProps {
  children: ReactNode;
  targetLength: number;
  targetHeight: number;
  targetDepth: number;
}

const MM_TO_METERS = 0.001;

/**
 * A wrapper component that continuously fits its children to the target
 * dimensions on every frame and centers them at the origin.
 */
export function AutoFit({
  children,
  targetLength,
  targetHeight,
  targetDepth,
}: AutoFitProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || group.children.length === 0) {
      return;
    }

    // Reset any previous transformations
    const originalScale = group.scale.clone();
    const originalPosition = group.position.clone();
    group.scale.set(1, 1, 1);
    group.position.set(0, 0, 0);

    const box = new THREE.Box3().setFromObject(group);

    if (box.isEmpty()) {
      group.scale.copy(originalScale);
      group.position.copy(originalPosition);
      return;
    }

    const originalSize = new THREE.Vector3();
    box.getSize(originalSize);

    // Calculate the required scale factor for each axis
    const scaleX =
      originalSize.x > 0 ? (targetLength * MM_TO_METERS) / originalSize.x : 1;
    const scaleY =
      originalSize.y > 0 ? (targetHeight * MM_TO_METERS) / originalSize.y : 1;
    const scaleZ =
      originalSize.z > 0 ? (targetDepth * MM_TO_METERS) / originalSize.z : 1;

    // Get the center of the bounding box (world-space)
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Convert the world-space center into the parent's local space.
    // setFromObject() always returns world coordinates. When this group
    // lives inside a parent with a non-zero world position (e.g. a child
    // zone inside DividedZone), 'center' already contains the parent's
    // world offset. worldToLocal() cancels that out so the math below
    // stays purely local and the GLB stays aligned with ZoneHighlighter.
    if (group.parent) {
      group.parent.worldToLocal(center);
    }

    // Apply scale first
    group.scale.set(scaleX, scaleY, scaleZ);

    // Then offset the position to center the scaled content at the origin.
    // 'center' is now in local space, so negating and scaling it is correct.
    group.position.set(
      -center.x * scaleX,
      -center.y * scaleY,
      -center.z * scaleZ,
    );
  });

  return <group ref={groupRef}>{children}</group>;
}
