import type { TimeOfDay } from "./types";

export type Palette = {
  /** Foliage colour per plant level. */
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

/**
 * Palettes are plain data. The day/night toggle drives React state and the
 * colour arrives at the material as a prop — no scene-graph traversal, no
 * material mutation.
 *
 * Night shifts the foliage cooler and darker as well as dimming the lights:
 * daytime greens lit by moonlight alone read as muddy rather than nocturnal.
 */
export const PALETTES: Record<TimeOfDay, Palette> = {
  day: {
    plant: {
      1: "#9ccf6a",
      2: "#5fa93c",
      3: "#3f8a34",
      4: "#2f6d2c",
    },
    ground: "#3f5c34",
    panel: "#4c6b3a",
    background: "#87b7d8",
    fog: "#9dc4de",
    key: "#fff6e0",
    ambient: "#93b6cc",
    keyIntensity: 2.1,
    ambientIntensity: 1.15,
  },
  night: {
    // Lifted well above "realistically dark": the plants still have to read as
    // distinct shapes against the ground, and true moonlight values turn the
    // whole forest into silhouettes.
    //
    // These stay properly green rather than drifting to teal — the cool cast
    // comes from the blue-tinted lighting, not from desaturating the foliage.
    plant: {
      1: "#8fd96a",
      2: "#5cb03f",
      3: "#3d8a30",
      4: "#2c6b28",
    },
    ground: "#22402c",
    panel: "#2c4f36",
    background: "#0b1526",
    fog: "#14243a",
    key: "#b9d2ff",
    ambient: "#6f92c8",
    keyIntensity: 1.35,
    ambientIntensity: 0.95,
  },
};
