import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AutoFitHeightProps {
  children: ReactNode;
  targetHeight: number;
}

const MM_TO_METERS = 0.001;

/**
 * A wrapper component that continuously fits its children to a target
 * height on every frame by scaling ONLY the Y-axis.
 */
export function AutoFitHeight({ children, targetHeight }: AutoFitHeightProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || group.children.length === 0) {
      return;
    }

    // To get the true original size, we must briefly reset the scale to 1.
    const originalScaleY = group.scale.y;
    group.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(group);

    // Immediately restore the scale to prevent flickering if you were to see it.
    // We only restore the axis we intend to control.
    group.scale.set(1, originalScaleY, 1);

    if (box.isEmpty()) {
      return;
    }

    const originalSize = new THREE.Vector3();
    box.getSize(originalSize);

    // Calculate the required scale factor ONLY for the Y-axis (height)
    const scaleY =
      originalSize.y > 0 ? (targetHeight * MM_TO_METERS) / originalSize.y : 1;

    // Apply the scale factor ONLY to the Y-axis. X and Z are left unscaled (1).
    group.scale.set(1, scaleY, 1);
  });

  return <group ref={groupRef}>{children}</group>;
}
