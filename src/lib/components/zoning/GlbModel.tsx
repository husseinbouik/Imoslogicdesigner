import { useGLTF } from "@react-three/drei";
import type { CustomComponentProps } from "../../types/types";

interface GlbModelProps extends CustomComponentProps {
  glbUrl: string;
}

/**
 * Renders a GLB file loaded from a URL, auto-fit by the parent AutoFit wrapper.
 * The 'glbUrl' is the public /uploads/glb/... path served by the backend.
 */
export function GlbModel({ glbUrl }: GlbModelProps) {
  const { scene } = useGLTF(glbUrl);
  return <primitive object={scene.clone()} />;
}

// Pre-load cleanup helper (call when component is no longer needed)
GlbModel.preload = (url: string) => useGLTF.preload(url);
