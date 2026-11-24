import { useMemo } from "react";
import { type ZoneNode, type ZoningProps, type Face } from "../../types/types";
import { mergePanelStyle } from "../../utils/style";
import { useZoneMaterials } from "../../hooks/useZoneMaterials";
import { AutoFit } from "../wrapper/AutoFit";
import { AutoFitHeight } from "../wrapper/AutoFitHeight";
import { ZoneHighlighter } from "./ZoneHighlighter";
import { FACE_KEYS_BY_THREE_ORDER, getPanel } from "../../utils/faces";

const MM_TO_METERS = 0.001;

export function EndZone({
  node,
  length,
  height,
  depth,
  parentStyle,
  formData,
  cpNameData,
  onSelect,
  selectedZone,
  selectedPart,
  areWireframesVisible = true,
}: ZoningProps) {
  const isSelected = node.index === selectedZone;

  const selectedFace =
    isSelected &&
    selectedPart &&
    ["left", "right", "top", "bottom", "front", "back"].includes(selectedPart)
      ? (selectedPart as Face)
      : undefined;

  const mergedStyle: ZoneNode = useMemo(() => {
    const baseStyle: Partial<ZoneNode> = parentStyle || {};
    return {
      ...baseStyle,
      ...node,
      top: mergePanelStyle(baseStyle.top, node.top),
      bottom: mergePanelStyle(baseStyle.bottom, node.bottom),
      sides: {
        "0": mergePanelStyle(
          getPanel(baseStyle, "front"),
          getPanel(node, "front")
        ),
        "1": mergePanelStyle(
          getPanel(baseStyle, "right"),
          getPanel(node, "right")
        ),
        "2": mergePanelStyle(
          getPanel(baseStyle, "back"),
          getPanel(node, "back")
        ),
        "3": mergePanelStyle(
          getPanel(baseStyle, "left"),
          getPanel(node, "left")
        ),
      },
    };
  }, [node, parentStyle]);

  const materials = useZoneMaterials(mergedStyle, formData);

  // --- Logic for custom components (unchanged) ---
  if (node.cpName && cpNameData?.[node.cpName]) {
    const CustomComponent = cpNameData[node.cpName];
    const isDoor = node.cpName === "door";

    const componentToRender = isDoor ? (
      <AutoFitHeight targetHeight={height}>
        <CustomComponent node={node} length={length} depth={depth} />
      </AutoFitHeight>
    ) : (
      <AutoFit targetLength={length} targetHeight={height} targetDepth={depth}>
        <CustomComponent
          node={node}
          length={length}
          height={height}
          depth={depth}
        />
      </AutoFit>
    );

    return (
      <group>
        {componentToRender}
        {!isDoor && (
          <mesh
            onClick={e => {
              e.stopPropagation();
              onSelect?.({ index: node.index });
            }}
            visible={false}
          >
            <boxGeometry
              args={[
                length * MM_TO_METERS,
                height * MM_TO_METERS,
                depth * MM_TO_METERS,
              ]}
            />
          </mesh>
        )}
        {isSelected && (
          <ZoneHighlighter length={length} height={height} depth={depth} />
        )}
      </group>
    );
  }

  const l = length * MM_TO_METERS;
  const h = height * MM_TO_METERS;
  const d = depth * MM_TO_METERS;
  const hl = l / 2; // half length
  const hh = h / 2; // half height
  const hd = d / 2; // half depth

  const clickFaces: {
    part: Face;
    position: [number, number, number];
    rotation: [number, number, number];
    args: [number, number];
  }[] = [
    { part: "front", position: [0, 0, hd], rotation: [0, 0, 0], args: [l, h] },
    {
      part: "back",
      position: [0, 0, -hd],
      rotation: [0, Math.PI, 0],
      args: [l, h],
    },
    {
      part: "top",
      position: [0, hh, 0],
      rotation: [-Math.PI / 2, 0, 0],
      args: [l, d],
    },
    {
      part: "bottom",
      position: [0, -hh, 0],
      rotation: [Math.PI / 2, 0, 0],
      args: [l, d],
    },
    {
      part: "left",
      position: [-hl, 0, 0],
      rotation: [0, -Math.PI / 2, 0],
      args: [d, h],
    },
    {
      part: "right",
      position: [hl, 0, 0],
      rotation: [0, Math.PI / 2, 0],
      args: [d, h],
    },
  ];

  const topThickness = mergedStyle.top?.cpName
    ? mergedStyle.top.thickness ?? 1
    : 0;
  const bottomThickness = mergedStyle.bottom?.cpName
    ? mergedStyle.bottom.thickness ?? 1
    : 0;
  const leftThickness = getPanel(mergedStyle, "left")?.cpName
    ? getPanel(mergedStyle, "left")!.thickness ?? 1
    : 0;
  const rightThickness = getPanel(mergedStyle, "right")?.cpName
    ? getPanel(mergedStyle, "right")!.thickness ?? 1
    : 0;
  const frontThickness = getPanel(mergedStyle, "front")?.cpName
    ? getPanel(mergedStyle, "front")!.thickness ?? 1
    : 0;
  const backThickness = getPanel(mergedStyle, "back")?.cpName
    ? getPanel(mergedStyle, "back")!.thickness ?? 1
    : 0;

  return (
    <group>
      <mesh
        onClick={() => onSelect?.({ index: node.index })}
        visible={areWireframesVisible}
      >
        <boxGeometry args={[l, h, d]} />
        {materials.map((props, i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} {...props} />
        ))}
      </mesh>

      {clickFaces.map(({ part, position, rotation, args }) => (
        <mesh
          key={part}
          position={position}
          rotation={rotation}
          onClick={e => {
            e.stopPropagation();
            onSelect?.({ index: node.index, part });
          }}
        >
          <planeGeometry args={args} />
          <meshBasicMaterial visible={false} side={2} />
        </mesh>
      ))}

      {isSelected && !selectedFace && (
        <ZoneHighlighter length={length} height={height} depth={depth} />
      )}

      {FACE_KEYS_BY_THREE_ORDER.map(faceKey => {
        const panelStyle = getPanel(mergedStyle, faceKey);

        if (panelStyle?.cpName && cpNameData?.[panelStyle.cpName]) {
          const CustomComponent = cpNameData[panelStyle.cpName];
          const l = length * MM_TO_METERS;
          const h = height * MM_TO_METERS;
          const d = depth * MM_TO_METERS;

          let position: [number, number, number] = [0, 0, 0];
          const componentThickness = panelStyle.thickness ?? 1;
          const cThicknessMeters = componentThickness * MM_TO_METERS;
          let targetDimensions = { length, height, depth: componentThickness };

          switch (faceKey) {
            case "top": {
              const topTrimFront = getPanel(mergedStyle, "front")?.topTrim;
              const frontIsMaster =
                topTrimFront === "L" || topTrimFront === "P";
              const topTrimBack = getPanel(mergedStyle, "back")?.topTrim;
              const backIsMaster = topTrimBack === "L" || topTrimBack === "P";
              const frontOffsetZ = frontIsMaster ? frontThickness : 0;
              const backOffsetZ = backIsMaster ? backThickness : 0;
              const newDepth = depth - frontOffsetZ - backOffsetZ;
              const zOffset = (backOffsetZ - frontOffsetZ) * MM_TO_METERS * 0.5;
              const topTrimLeft = getPanel(mergedStyle, "left")?.topTrim;
              const leftIsMaster = topTrimLeft === "L" || topTrimLeft === "P";
              const topTrimRight = getPanel(mergedStyle, "right")?.topTrim;
              const rightIsMaster =
                topTrimRight === "L" || topTrimRight === "P";
              const leftOffsetX = leftIsMaster ? leftThickness : 0;
              const rightOffsetX = rightIsMaster ? rightThickness : 0;
              const newLength = length - leftOffsetX - rightOffsetX;
              const xOffset = (leftOffsetX - rightOffsetX) * MM_TO_METERS * 0.5;
              position = [xOffset, h / 2 - cThicknessMeters / 2, zOffset];
              targetDimensions = {
                length: newLength,
                height: componentThickness,
                depth: newDepth,
              };
              break;
            }
            case "bottom": {
              const botTrimFront = getPanel(mergedStyle, "front")?.botTrim;
              const frontIsMaster =
                botTrimFront === "L" || botTrimFront === "P";
              const botTrimBack = getPanel(mergedStyle, "back")?.botTrim;
              const backIsMaster = botTrimBack === "L" || botTrimBack === "P";
              const frontOffsetZ = frontIsMaster ? frontThickness : 0;
              const backOffsetZ = backIsMaster ? backThickness : 0;
              const newDepth = depth - frontOffsetZ - backOffsetZ;
              const zOffset = (backOffsetZ - frontOffsetZ) * MM_TO_METERS * 0.5;
              const botTrimLeft = getPanel(mergedStyle, "left")?.botTrim;
              const leftIsMaster = botTrimLeft === "L" || botTrimLeft === "P";
              const botTrimRight = getPanel(mergedStyle, "right")?.botTrim;
              const rightIsMaster =
                botTrimRight === "L" || botTrimRight === "P";
              const leftOffsetX = leftIsMaster ? leftThickness : 0;
              const rightOffsetX = rightIsMaster ? rightThickness : 0;
              const newLength = length - leftOffsetX - rightOffsetX;
              const xOffset = (leftOffsetX - rightOffsetX) * MM_TO_METERS * 0.5;
              position = [xOffset, -h / 2 + cThicknessMeters / 2, zOffset];
              targetDimensions = {
                length: newLength,
                height: componentThickness,
                depth: newDepth,
              };
              break;
            }
            case "right": {
              const isMasterAtTop =
                panelStyle.topTrim === "L" || panelStyle.topTrim === "P";
              const isMasterAtBottom =
                panelStyle.botTrim === "L" || panelStyle.botTrim === "P";
              const topOffsetY = isMasterAtTop ? 0 : topThickness;
              const bottomOffsetY = isMasterAtBottom ? 0 : bottomThickness;
              const newHeight = height - topOffsetY - bottomOffsetY;
              const yOffset = (bottomOffsetY - topOffsetY) * MM_TO_METERS * 0.5;
              const isShortAtFront = panelStyle.startTrim === "S";
              const isShortAtBack = panelStyle.endTrim === "S";
              const frontOffsetZ = isShortAtFront ? frontThickness : 0;
              const backOffsetZ = isShortAtBack ? backThickness : 0;
              const newDepth = depth - frontOffsetZ - backOffsetZ;
              const zOffset = (backOffsetZ - frontOffsetZ) * MM_TO_METERS * 0.5;
              position = [l / 2 - cThicknessMeters / 2, yOffset, zOffset];
              targetDimensions = {
                length: componentThickness,
                height: newHeight,
                depth: newDepth,
              };
              break;
            }
            case "left": {
              const isMasterAtTop =
                panelStyle.topTrim === "L" || panelStyle.topTrim === "P";
              const isMasterAtBottom =
                panelStyle.botTrim === "L" || panelStyle.botTrim === "P";
              const topOffsetY = isMasterAtTop ? 0 : topThickness;
              const bottomOffsetY = isMasterAtBottom ? 0 : bottomThickness;
              const newHeight = height - topOffsetY - bottomOffsetY;
              const yOffset = (bottomOffsetY - topOffsetY) * MM_TO_METERS * 0.5;
              const isShortAtBack = panelStyle.startTrim === "S";
              const isShortAtFront = panelStyle.endTrim === "S";
              const backOffsetZ = isShortAtBack ? backThickness : 0;
              const frontOffsetZ = isShortAtFront ? frontThickness : 0;
              const newDepth = depth - frontOffsetZ - backOffsetZ;
              const zOffset = (backOffsetZ - frontOffsetZ) * MM_TO_METERS * 0.5;
              position = [-l / 2 + cThicknessMeters / 2, yOffset, zOffset];
              targetDimensions = {
                length: componentThickness,
                height: newHeight,
                depth: newDepth,
              };
              break;
            }
            case "front": {
              const isMasterAtTop =
                panelStyle.topTrim === "L" || panelStyle.topTrim === "P";
              const isMasterAtBottom =
                panelStyle.botTrim === "L" || panelStyle.botTrim === "P";
              const topOffsetY = isMasterAtTop ? 0 : topThickness;
              const bottomOffsetY = isMasterAtBottom ? 0 : bottomThickness;
              const newHeight = height - topOffsetY - bottomOffsetY;
              const yOffset = (bottomOffsetY - topOffsetY) * MM_TO_METERS * 0.5;
              const isShortAtLeft = panelStyle.startTrim === "S";
              const isShortAtRight = panelStyle.endTrim === "S";
              const leftOffsetX = isShortAtLeft ? leftThickness : 0;
              const rightOffsetX = isShortAtRight ? rightThickness : 0;
              const newLength = length - leftOffsetX - rightOffsetX;
              const xOffset = (leftOffsetX - rightOffsetX) * MM_TO_METERS * 0.5;
              position = [xOffset, yOffset, d / 2 - cThicknessMeters / 2];
              targetDimensions = {
                length: newLength,
                height: newHeight,
                depth: componentThickness,
              };
              break;
            }
            case "back": {
              const isMasterAtTop =
                panelStyle.topTrim === "L" || panelStyle.topTrim === "P";
              const isMasterAtBottom =
                panelStyle.botTrim === "L" || panelStyle.botTrim === "P";
              const topOffsetY = isMasterAtTop ? 0 : topThickness;
              const bottomOffsetY = isMasterAtBottom ? 0 : bottomThickness;
              const newHeight = height - topOffsetY - bottomOffsetY;
              const yOffset = (bottomOffsetY - topOffsetY) * MM_TO_METERS * 0.5;
              const isShortAtRight = panelStyle.startTrim === "S";
              const isShortAtLeft = panelStyle.endTrim === "S";
              const rightOffsetX = isShortAtRight ? rightThickness : 0;
              const leftOffsetX = isShortAtLeft ? leftThickness : 0;
              const newLength = length - leftOffsetX - rightOffsetX;
              const xOffset = (leftOffsetX - rightOffsetX) * MM_TO_METERS * 0.5;
              position = [xOffset, yOffset, -d / 2 + cThicknessMeters / 2];
              targetDimensions = {
                length: newLength,
                height: newHeight,
                depth: componentThickness,
              };
              break;
            }
          }
          if (
            targetDimensions.length <= 0 ||
            targetDimensions.height <= 0 ||
            targetDimensions.depth <= 0
          ) {
            return null;
          }
          return (
            <group key={faceKey} position={position}>
              <AutoFit
                targetLength={targetDimensions.length}
                targetHeight={targetDimensions.height}
                targetDepth={targetDimensions.depth}
              >
                <CustomComponent node={node} panelStyle={panelStyle} />
              </AutoFit>
              {selectedFace === faceKey && (
                <ZoneHighlighter
                  length={targetDimensions.length}
                  height={targetDimensions.height}
                  depth={targetDimensions.depth}
                />
              )}
            </group>
          );
        } else if (selectedFace === faceKey) {
          return (
            <ZoneHighlighter
              key={`${faceKey}-highlight`}
              length={length}
              height={height}
              depth={depth}
              face={faceKey}
            />
          );
        }
        return null;
      })}
    </group>
  );
}
