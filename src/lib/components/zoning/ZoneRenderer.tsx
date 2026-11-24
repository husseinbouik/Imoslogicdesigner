import { useMemo } from "react";
import { type ZoningProps, type PanelStyle } from "../../types/types";
import { DividedZone } from "./DividedZone";
import { EndZone } from "./EndZone";
import { getPanel } from "../../utils/faces";

const MM_TO_METERS = 0.001;

// Helper function to get the numerical offset from a panel's inset property.
const getSignedOffset = (panel?: PanelStyle): number => {
  if (!panel?.inset) return 0;
  const value = parseFloat(panel.inset);
  return !isNaN(value) ? value : 0;
};

export function ZoneRenderer(props: ZoningProps) {
  const { node, length, height, depth, divisionData = {}, formData } = props;

  const { finalLength, finalHeight, finalDepth, positionOffset } =
    useMemo(() => {
      const leftOffset = getSignedOffset(getPanel(node, "left"));
      const rightOffset = getSignedOffset(getPanel(node, "right"));
      const frontOffset = getSignedOffset(getPanel(node, "front"));
      const backOffset = getSignedOffset(getPanel(node, "back"));

      const topOffset = 0;
      const bottomOffset = 0;

      const finalLength = length - (leftOffset + rightOffset);
      const finalHeight = height - (topOffset + bottomOffset);
      const finalDepth = depth - (frontOffset + backOffset);

      const xOffset = (leftOffset - rightOffset) * 0.5;
      const yOffset = (bottomOffset - topOffset) * 0.5;
      const zOffset = (backOffset - frontOffset) * 0.5;

      const positionOffset: [number, number, number] = [
        xOffset * MM_TO_METERS,
        yOffset * MM_TO_METERS,
        zOffset * MM_TO_METERS,
      ];

      return {
        finalLength,
        finalHeight,
        finalDepth,
        positionOffset,
      };
    }, [node, length, height, depth]);

  const childProps = {
    ...props,
    length: finalLength,
    height: finalHeight,
    depth: finalDepth,
    baseLength: length,
    baseHeight: height,
    baseDepth: depth,
    positionOffset,
  };

  const renderContent = () => {
    const formdivisionData =
      node.division?.key && formData ? formData[node.division.key] : undefined;
    const override = formdivisionData
      ? { linear: formdivisionData }
      : divisionData[node.index];

    const activeDivision = override || node.division;

    if (activeDivision && node.children?.length) {
      return <DividedZone {...childProps} />;
    }

    return <EndZone {...childProps} />;
  };

  return <group position={positionOffset}>{renderContent()}</group>;
}
