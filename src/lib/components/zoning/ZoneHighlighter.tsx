import { Line } from "@react-three/drei";

const MM_TO_METERS = 0.001;
const HIGHLIGHT_COLOR = "#df002b";
const HIGHLIGHT_WIDTH = 2;

interface ZoneHighlighterProps {
  length: number;
  height: number;
  depth: number;
  face?: "left" | "right" | "top" | "bottom" | "front" | "back";
}

export function ZoneHighlighter({
  length,
  height,
  depth,
  face,
}: ZoneHighlighterProps) {
  const l = length * MM_TO_METERS;
  const h = height * MM_TO_METERS;
  const d = depth * MM_TO_METERS;

  // Calculate half dimensions for easier vertex placement
  const hl = l / 2;
  const hh = h / 2;
  const hd = d / 2;

  // Define the 8 vertices of the bounding box
  const p: [number, number, number][] = [
    [-hl, -hh, hd], // 0: front bottom left
    [hl, -hh, hd], // 1: front bottom right
    [hl, -hh, -hd], // 2: back bottom right
    [-hl, -hh, -hd], // 3: back bottom left
    [-hl, hh, hd], // 4: front top left
    [hl, hh, hd], // 5: front top right
    [hl, hh, -hd], // 6: back top right
    [-hl, hh, -hd], // 7: back top left
  ];

  if (face) {
    let facePoints: [number, number, number][] = [];
    // Closing the loop by repeating the first point at the end
    switch (face) {
      case "front":
        facePoints = [p[0], p[1], p[5], p[4], p[0]];
        break;
      case "back":
        facePoints = [p[3], p[2], p[6], p[7], p[3]];
        break;
      case "top":
        facePoints = [p[4], p[5], p[6], p[7], p[4]];
        break;
      case "bottom":
        facePoints = [p[0], p[1], p[2], p[3], p[0]];
        break;
      case "left":
        facePoints = [p[0], p[3], p[7], p[4], p[0]];
        break;
      case "right":
        facePoints = [p[1], p[2], p[6], p[5], p[1]];
        break;
      default:
        return null; // Should not happen with current types
    }
    return (
      <Line
        points={facePoints}
        color={HIGHLIGHT_COLOR}
        lineWidth={HIGHLIGHT_WIDTH}
        depthTest={false} // Renders on top of everything
        toneMapped={false} // Ensures the color is not affected by scene lighting
      />
    );
  }

  // Define the 12 edges of the box by connecting the vertices
  const edges: [[number, number, number], [number, number, number]][] = [
    // Bottom face
    [p[0], p[1]],
    [p[1], p[2]],
    [p[2], p[3]],
    [p[3], p[0]],
    // Top face
    [p[4], p[5]],
    [p[5], p[6]],
    [p[6], p[7]],
    [p[7], p[4]],
    // Connecting vertical pillars
    [p[0], p[4]],
    [p[1], p[5]],
    [p[2], p[6]],
    [p[3], p[7]],
  ];

  return (
    <group>
      {edges.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={HIGHLIGHT_COLOR}
          lineWidth={HIGHLIGHT_WIDTH}
          depthTest={false} // Renders on top of everything
          toneMapped={false} // Ensures the color is not affected by scene lighting
        />
      ))}
    </group>
  );
}
