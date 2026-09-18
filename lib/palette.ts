import type { TimeOfDay } from "./types";

export type Palette = {
    plant: Record<1 | 2 | 3 | 4, string>;
  ground: string;
  panel: string;
  background: string;
  fog: string;
  key: string;
  ambient: string;
  keyIntensity: number;
  ambientIntensity: number;
};

export const PALETTES: Record<TimeOfDay, Palette> = {
  day: {
    plant: {
      1: "#9ccf6a",
      2: "#5fa93c",
      3: "#3f8a34",
      4: "#2f6d2c",
    },
    ground: "#346145",
    panel: "#4c6b3a",
    background: "#81bec7",
    fog: "#9dc4de",
    key: "#fff6e0",
    ambient: "#93b6cc",
    keyIntensity: 2.1,
    ambientIntensity: 1.15,
  },
  night: {
    plant: {
      1: "#2c6b28",
      2: "#3d8a30",
      3: "#5cb03f",
      4: "#90e366",
    },
    ground: "#294d3f",
    panel: "#2c4f36",
    background: "#0b1526",
    fog: "#14243a",
    key: "#b9d2ff",
    ambient: "#6f92c8",
    keyIntensity: 1.35,
    ambientIntensity: 0.95,
  },
};
