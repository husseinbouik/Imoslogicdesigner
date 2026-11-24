import { createContext, useContext } from "react";
import { type ZoneNode, type Division } from "../types/types";

type DivisionOverride = Omit<Division, "key">;
export type divisionData = Record<string, DivisionOverride>;
export type FormData = Record<string, string>;

export interface ZoneContextType {
  root: ZoneNode | null;
  setRoot: React.Dispatch<React.SetStateAction<ZoneNode | null>>;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  divisionData: divisionData;
  setDivisionData: React.Dispatch<React.SetStateAction<divisionData>>;
}

export const ZoneContext = createContext<ZoneContextType | null>(null);

export const useZoneContext = () => {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error("useZoneContext must be used within a ZoneProvider");
  }
  return context;
};
