import { Fragment, useMemo } from "react";
import { type ZoneNode, type ZoningProps } from "../../types/types";
import { ZoneRenderer } from "./ZoneRenderer";
import { EndZone } from "./EndZone";
import { AutoFit } from "../wrapper/AutoFit";
import { mergePanelStyle } from "../../utils/style";
import { getPanel } from "../../utils/faces";
import { computeZoneLayout } from "../../utils/zone-layout";

const MM_TO_METERS = 0.001;

export function DividedZone(props: ZoningProps) {
  const {
    node,
    parentStyle,
    length,
    height,
    depth,
    divisionData = {},
    formData,
    variables,
    cpNameData,
    selectedZone,
    selectedPart,
    areWireframesVisible,
    onSelect,
  } = props;

  const mergedNode: ZoneNode = useMemo(() => {
    const baseStyle: Partial<ZoneNode> = parentStyle || {};
    const merged = { ...node };

    merged.top = mergePanelStyle(baseStyle.top, node.top);
    merged.bottom = mergePanelStyle(baseStyle.bottom, node.bottom);
    merged.sides = {
      "0": mergePanelStyle(
        getPanel(baseStyle, "front"),
        getPanel(node, "front"),
      ),
      "1": mergePanelStyle(
        getPanel(baseStyle, "right"),
        getPanel(node, "right"),
      ),
      "2": mergePanelStyle(getPanel(baseStyle, "back"), getPanel(node, "back")),
      "3": mergePanelStyle(getPanel(baseStyle, "left"), getPanel(node, "left")),
    };

    merged.color = node.color ?? baseStyle.color;
    merged.partition = node.partition ?? baseStyle.partition;
    return merged;
  }, [node, parentStyle]);

  const linearFromFormData =
    node.division?.key && formData ? formData[node.division.key] : undefined;
  const activeDivision = (
    linearFromFormData
      ? { ...node.division, linear: linearFromFormData }
      : node.division
  )!;

  // ------------------------------------------------------------------
  // Delegate ALL calculation to computeZoneLayout — single source of truth
  // ------------------------------------------------------------------
  const layout = useMemo(
    () =>
      computeZoneLayout({
        mergedNode,
        activeDivision,
        length,
        height,
        depth,
        variables,
      }),
    [mergedNode, activeDivision, length, height, depth, variables],
  );

  if (!layout) return null;

  const {
    divisionAxis,
    zones: zonesFromLayout,
    shouldReverseOrder,
    innerLength,
    innerHeight,
    innerDepth,
    groupShiftX,
    groupShiftY,
    groupShiftZ,
    partitionThickness,
  } = layout;

  const zones = shouldReverseOrder
    ? [...zonesFromLayout].reverse()
    : [...zonesFromLayout];

  const childrenToRender =
    node.children && shouldReverseOrder
      ? [...node.children].reverse()
      : node.children;

  const groupPosition: [number, number, number] = [
    groupShiftX * MM_TO_METERS,
    groupShiftY * MM_TO_METERS,
    groupShiftZ * MM_TO_METERS,
  ];

  const dividerCpName =
    mergedNode.partition?.type === "partition"
      ? mergedNode.partition.cpName
      : undefined;

  const totalContentSizeMM = zones.reduce(
    (sum, l) => sum + l,
    (zones.length - 1) * partitionThickness,
  );
  const centerOffsetMeters = (totalContentSizeMM / 2) * MM_TO_METERS;
  let accumulatedPositionMeters = 0;

  const parentStyleForChildren: Partial<ZoneNode> = {
    ...(parentStyle || {}),
    color: mergedNode.color,
    partition: mergedNode.partition,
  };

  return (
    <group>
      <EndZone
        {...props}
        node={mergedNode}
        key={`${node.index}-frame`}
        onSelect={() => onSelect?.({ index: node.index })}
        areWireframesVisible={areWireframesVisible}
      />

      <group position={groupPosition}>
        {zones.map((zoneSizeMM, index) => {
          const childNode = childrenToRender?.[index];
          if (!childNode) return null;

          const zoneSizeMeters = zoneSizeMM * MM_TO_METERS;
          const dividerWidthMeters = partitionThickness * MM_TO_METERS;
          const positionOffset =
            accumulatedPositionMeters + zoneSizeMeters / 2 - centerOffsetMeters;
          accumulatedPositionMeters += zoneSizeMeters + dividerWidthMeters;

          const isFirstZone = index === 0;
          const isLastZone = index === zones.length - 1;

          const finalParentStyleForThisChild: Partial<ZoneNode> = {
            ...parentStyleForChildren,
            sides: { ...parentStyleForChildren.sides },
          };

          let childPosition: [number, number, number] = [0, 0, 0];
          let finalChildLength = 0,
            finalChildHeight = 0,
            finalChildDepth = 0;

          if (divisionAxis === "x") {
            childPosition = [positionOffset, 0, 0];
            finalChildLength = zoneSizeMM;
            finalChildHeight = innerHeight;
            finalChildDepth = innerDepth;
            if (!isFirstZone && finalParentStyleForThisChild.sides)
              finalParentStyleForThisChild.sides["3"] = undefined;
            if (!isLastZone && finalParentStyleForThisChild.sides)
              finalParentStyleForThisChild.sides["1"] = undefined;
          } else if (divisionAxis === "y") {
            childPosition = [0, positionOffset, 0];
            finalChildLength = innerLength;
            finalChildHeight = zoneSizeMM;
            finalChildDepth = innerDepth;
            if (!isFirstZone) finalParentStyleForThisChild.bottom = undefined;
            if (!isLastZone) finalParentStyleForThisChild.top = undefined;
          } else {
            // divisionAxis === 'z'
            childPosition = [0, 0, positionOffset];
            finalChildLength = innerLength;
            finalChildHeight = innerHeight;
            finalChildDepth = zoneSizeMM;
            if (!isFirstZone && finalParentStyleForThisChild.sides)
              finalParentStyleForThisChild.sides["2"] = undefined;
            if (!isLastZone && finalParentStyleForThisChild.sides)
              finalParentStyleForThisChild.sides["0"] = undefined;
          }

          let dividerComponent = null;
          if (!isLastZone && dividerCpName && cpNameData?.[dividerCpName]) {
            const CustomDividerComponent = cpNameData[dividerCpName];
            const dividerPositionOffset =
              positionOffset + zoneSizeMeters / 2 + dividerWidthMeters / 2;

            let dividerPosition: [number, number, number] = [0, 0, 0];
            let dividerLength = 0,
              dividerHeight = 0,
              dividerDepth = 0;

            if (divisionAxis === "x") {
              dividerPosition = [dividerPositionOffset, 0, 0];
              dividerLength = partitionThickness;
              dividerHeight = innerHeight;
              dividerDepth = innerDepth;
            } else if (divisionAxis === "y") {
              dividerPosition = [0, dividerPositionOffset, 0];
              dividerLength = innerLength;
              dividerHeight = partitionThickness;
              dividerDepth = innerDepth;
            } else {
              dividerPosition = [0, 0, dividerPositionOffset];
              dividerLength = innerLength;
              dividerHeight = innerHeight;
              dividerDepth = partitionThickness;
            }

            dividerComponent = (
              <group position={dividerPosition}>
                <AutoFit
                  targetLength={dividerLength}
                  targetHeight={dividerHeight}
                  targetDepth={dividerDepth}
                >
                  <CustomDividerComponent
                    node={node}
                    length={dividerLength}
                    height={dividerHeight}
                    depth={dividerDepth}
                  />
                </AutoFit>
              </group>
            );
          }

          return (
            <Fragment key={childNode.index}>
              <group position={childPosition}>
                <ZoneRenderer
                  node={childNode}
                  length={finalChildLength}
                  height={finalChildHeight}
                  depth={finalChildDepth}
                  partition={childNode.partition}
                  divisionData={divisionData}
                  formData={formData}
                  parentStyle={finalParentStyleForThisChild as ZoneNode}
                  variables={variables}
                  cpNameData={cpNameData}
                  selectedZone={selectedZone}
                  selectedPart={selectedPart}
                  onSelect={onSelect}
                  areWireframesVisible={areWireframesVisible}
                  rootNode={props.rootNode}
                />
              </group>
              {dividerComponent}
            </Fragment>
          );
        })}
      </group>
    </group>
  );
}
