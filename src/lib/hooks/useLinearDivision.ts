import { useMemo } from "react";
import { processLindiv } from "imos-linear-division";

export type LindivVariables = Record<string, number>;

export function useLinearDivision(
  linearDivisionString: string,
  totalLength: number,
  zoneDividers = 0,
  variables?: LindivVariables
): number[] {
  const zones = useMemo(() => {
    const result = processLindiv(
      linearDivisionString,
      totalLength,
      zoneDividers,
      variables
    );

    if (Array.isArray(result)) {
      return result;
    }

    console.error("Invalid linear division string. Errors:", result);
    return [];
  }, [linearDivisionString, totalLength, zoneDividers, variables]);

  return zones;
}
