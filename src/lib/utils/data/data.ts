import { type ZoneNode } from "../../types/types";

const root: ZoneNode = {
  index: "0",
  zoneName: "Article Designer",
  length: 500,
  height: 500,
  depth: 500,

  // top: { index: "4", cpName: "top", thickness: 20, sidesReference: "end" },
  // bottom: {
  //   index: "5",
  //   cpName: "bottom",
  //   thickness: 20,
  //   sidesReference: "end",
  // },
  // sides: {
  //   "0": {
  //     index: "0",
  //     cpName: "front",
  //     thickness: 20,
  //     sidesReference: "center",
  //     inset: "0",
  //   },
  //   "1": {
  //     index: "1",
  //     cpName: "right",
  //     thickness: 20,
  //     sidesReference: "end",
  //     startTrim: "S",
  //     endTrim: "S",
  //     topTrim: "S",
  //     botTrim: "S",
  //     inset: "0",
  //   },
  //   "2": {
  //     index: "2",
  //     cpName: "back",
  //     thickness: 20,
  //     sidesReference: "end",
  //     startTrim: "S",
  //     endTrim: "S",
  //     topTrim: "S",
  //     botTrim: "S",
  //     inset: "0",
  //   },
  //   "3": {
  //     index: "3",
  //     cpName: "left",
  //     thickness: 20,
  //     sidesReference: "end",
  //     startTrim: "S",
  //     endTrim: "S",
  //     topTrim: "S",
  //     botTrim: "S",
  //     inset: "0",
  //   },
  // },
};

const formData = {
  // shelf_division_override: "2:3",
  // back_panel_color: "#36454F",
};

const divisionData = {};

export const initialData = {
  root,
  formData,
  divisionData,
};

export type ConfigData = typeof initialData;
