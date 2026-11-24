import { useState, useEffect } from "react";
import { initialData, type ConfigData } from "../utils/data/data";

export function useConfigData() {
  const [data, setData] = useState<ConfigData>(initialData);

  useEffect(() => {
    // Update state when the module is hot reloaded
    if (import.meta.hot) {
      import.meta.hot.accept("../utils/data/data", newModule => {
        if (newModule) {
          setData(newModule.initialData);
        }
      });
    }
  }, []);

  return [data, setData] as const;
}
