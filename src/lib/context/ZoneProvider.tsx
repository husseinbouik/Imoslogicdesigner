import type { ReactNode } from "react";
import { useState } from "react";
import {
  ZoneContext,
  type ZoneContextType,
  type FormData,
  type divisionData,
} from "./ZoneContext";
import { type ZoneNode } from "../types/types";
import { initialData } from "../utils/data/data";

interface ZoneProviderProps {
  children: ReactNode;
}

export function ZoneProvider({ children }: ZoneProviderProps) {
  const [root, setRoot] = useState<ZoneNode | null>(initialData.root);
  const [formData, setFormData] = useState<FormData>(initialData.formData);
  const [divisionData, setDivisionData] = useState<divisionData>(
    initialData.divisionData
  );

  const value: ZoneContextType = {
    root,
    setRoot,
    formData,
    setFormData,
    divisionData,
    setDivisionData,
  };

  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
}
