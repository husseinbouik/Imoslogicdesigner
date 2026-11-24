export const isObject = (item: unknown): item is Record<string, unknown> => {
  return !!item && typeof item === "object" && !Array.isArray(item);
};

export function mergeDeep<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const typedKey = key as keyof T;
        const sourceValue = source[typedKey];
        const targetValue = target[typedKey];

        if (isObject(targetValue) && isObject(sourceValue)) {
          output[typedKey] = mergeDeep(
            targetValue as Record<string, any>,
            sourceValue as Partial<Record<string, any>>
          ) as T[keyof T];
        } else if (sourceValue !== undefined) {
          output[typedKey] = sourceValue as T[keyof T];
        }
      }
    }
  }
  return output;
}
