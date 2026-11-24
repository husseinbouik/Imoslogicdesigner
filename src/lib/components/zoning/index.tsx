import { useMemo, useContext } from "react";
import { ZoneContext } from "../../context/ZoneContext";
import { mergeDeep } from "../../utils/object";
import {
  type ZoneNode,
  type ZonePublicProps,
  type ZoningProps,
  type DivisionData,
} from "../../types/types";
import { ZoneRenderer } from "./ZoneRenderer";

export default function Zoning(props: ZonePublicProps) {
  const context = useContext(ZoneContext);

  if (!context) {
    throw new Error("Zoning component must be used within a ZoneProvider");
  }

  const finalProps: ZoningProps = useMemo(() => {
    const contextRoot = context.root ?? ({ index: "root" } as ZoneNode);
    const mergedNode = mergeDeep(contextRoot, props.node);

    const length = props.length ?? mergedNode.length;
    const height = props.height ?? mergedNode.height;
    const depth = props.depth ?? mergedNode.depth;

    if (length === undefined || height === undefined || depth === undefined) {
      throw new Error(
        `Zone dimensions for "${props.node.index}" are not defined. They must be provided either via props or in the root node object in the context.`,
      );
    }

    // Process division data to ensure it matches the required type
    const processedDivisionData: Record<string, DivisionData> = {};
    const rawDivisionData = { ...context.divisionData, ...props.divisionData };

    Object.entries(rawDivisionData).forEach(([key, value]) => {
      if (value.linear) {
        processedDivisionData[key] = {
          linear: value.linear,
          direction: value.direction,
          divisionType: value.divisionType,
        };
      }
    });

    return {
      ...props,
      node: mergedNode,
      length,
      height,
      depth,
      partition: props.partition ?? mergedNode.partition,
      formData: { ...context.formData, ...props.formData },
      divisionData: processedDivisionData,
      cpNameData: props.cpNameData,
      selectedPart: props.selectedPart,
      areWireframesVisible: props.areWireframesVisible,
      rootNode: props.rootNode ?? mergedNode,
    };
  }, [props, context]);

  return <ZoneRenderer {...finalProps} />;
}
