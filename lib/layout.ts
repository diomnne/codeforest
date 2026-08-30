import { rngFromSeed } from "./random";
import type { Contribution, LayoutMode } from "./types";

export type Vec3 = [number, number, number];

export type GardenDay = {
  index: number;
  date: string;
  count: number;
  level: number;
  /**
   * Position per layout, keyed by mode. All layouts are computed in one pass
   * and stored as parallel arrays indexed identically by day, so switching
   * layouts lerps per-instance matrices without rebuilding geometry.
   */
  positions: Record<LayoutMode, Vec3>;
  /** Per-instance variation, stable across layouts. */
  scale: number;
  rotation: number;
};

export type MonthPanel = {
  /** e.g. "2025-03" */
  key: string;
  label: string;
  /** Centre of the panel on the ground plane. */
  center: Vec3;
  width: number;
  depth: number;
};

export type LayoutExtent = { width: number; depth: number };

export type GardenModel = {
  days: GardenDay[];
  /** Month panels per layout; the github strip has none. */
  panels: Record<LayoutMode, MonthPanel[]>;
  /** dayIndex lists per level, used to build one InstancedMesh per level. */
  byLevel: number[][];
  extents: Record<LayoutMode, LayoutExtent>;
};

/** Spacing between adjacent day cells, in world units. */
export const CELL = 0.82;
/** Roughly the height of a level-4 tree, used as vertical padding when framing. */
const TALLEST_PLANT = 2.2;

/**
 * The forest is a lattice: one plant per cell, one cell per day, arranged as
 * the familiar 7 x ~53 strip with weeks running left to right.
 */
export function buildGardenModel(
  contributions: Contribution[],
  seed: string,
): GardenModel {
  const rng = rngFromSeed(seed);

  // Sort defensively rather than trusting the API's ordering.
  const sorted = [...contributions].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );

  const days: GardenDay[] = [];
  const byLevel: number[][] = [[], [], [], [], []];

  sorted.forEach((c, i) => {
    days.push({
      index: i,
      date: c.date,
      count: c.count,
      level: c.level,
      positions: {
        github: [0, 0, 0],
        2: [0, 0, 0],
        3: [0, 0, 0],
        4: [0, 0, 0],
      },
      // Level decides the geometry; scale varies continuously within a level
      // so a stand of the same plant still reads as individual growth.
      scale: 0.82 + rng() * 0.42,
      rotation: rng() * Math.PI * 2,
    });
    byLevel[c.level].push(i);
  });

  const github = buildGithubStrip(sorted, days);
  const panels = {} as Record<LayoutMode, MonthPanel[]>;
  const extents = {} as Record<LayoutMode, LayoutExtent>;

  panels.github = [];
  extents.github = github.extent;

  // The strip is the only layout the UI offers. The other modes stay in the
  // type so the morph machinery keeps its shape, and alias to the strip's
  // positions so a stray mode can never render every plant at the origin.
  for (const columns of [2, 3, 4] as const) {
    panels[columns] = [];
    extents[columns] = github.extent;
  }
  for (const day of days) {
    day.positions[2] = day.positions.github;
    day.positions[3] = day.positions.github;
    day.positions[4] = day.positions.github;
  }

  return { days, panels, byLevel, extents };
}

/** The familiar 7 rows x ~53 columns arrangement, weeks running left to right. */
function buildGithubStrip(
  contributions: Contribution[],
  days: GardenDay[],
): { extent: LayoutExtent } {
  const first = new Date(`${contributions[0].date}T00:00:00Z`);
  const firstDow = first.getUTCDay();

  const cols = Math.ceil((contributions.length + firstDow) / 7);
  const width = cols * CELL;
  const depth = 7 * CELL;

  contributions.forEach((_, i) => {
    const col = Math.floor((i + firstDow) / 7);
    const row = (i + firstDow) % 7;
    days[i].positions.github = [
      col * CELL - width / 2,
      0,
      row * CELL - depth / 2,
    ];
  });

  return { extent: { width, depth } };
}


const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year.slice(2)}`;
}

/** Eye angle above the ground plane, in radians. Low and immersive. */
const PITCH = 0.42;

/**
 * Weeks of strip the camera frames. Fixed rather than derived from the data, so
 * every date range opens at the same zoom — switching from 6 months to a year
 * should reveal more forest, not push the camera back and shrink everything.
 * Sized to roughly six months, which reads well at both extremes.
 */
const FRAMED_WEEKS = 20;

/**
 * Camera framing, recomputed from the viewport aspect ratio so the strip still
 * fits on a phone in portrait.
 */
export function framingFor(
  mode: LayoutMode,
  model: GardenModel,
  aspect: number,
  /** Earliest visible date; the camera centres on days at or after it. */
  visibleFrom = "",
  fovDeg = 45,
): { position: Vec3; target: Vec3; distance: number } {
  const fov = (fovDeg * Math.PI) / 180;
  const safeAspect = Math.max(aspect, 0.35);
  const { depth } = model.extents[mode];

  // Frame a fixed span, independent of how much data is on screen. Clamping
  // this to the layout's own width is what made the ranges feel inconsistent:
  // a one-month forest would pull the camera right in and a year would push it
  // out, so the trees changed size every time the range changed.
  const width = FRAMED_WEEKS * CELL;

  // Closed-form fitting is unreliable for a tilted plane: the near edge sits
  // much closer to the camera than the centre, so it projects far wider than
  // `width / distance` suggests. Instead, project the layout's bounding corners
  // at a trial distance and scale by however much they overflow the frustum.
  const halfW = width / 2;
  const halfD = depth / 2;

  // Plant height doesn't scale with distance, so the relationship isn't exactly
  // linear — a few iterations converge on the true fit.
  let distance = Math.max(width, depth, CELL * 6);
  for (let i = 0; i < 4; i++) {
    distance *= projectOverflow(
      distance,
      PITCH,
      fov,
      safeAspect,
      halfW,
      halfD,
    );
  }

  distance = Math.max(distance * 1.06, CELL * 6);

  // Centre on the visible slice, not the whole strip. The model always holds
  // the full window so instance counts stay stable, which means a trailing
  // 3-month range sits far to the right of world origin — without this the
  // camera would keep looking at the middle of a year that is mostly hidden.
  const centreX = visibleCentreX(model, mode, visibleFrom);

  return {
    position: [
      centreX,
      Math.sin(PITCH) * distance,
      Math.cos(PITCH) * distance,
    ],
    target: [centreX, 0.6, 0],
    distance,
  };
}

/** Mid-point, along X, of the days at or after `visibleFrom`. */
function visibleCentreX(
  model: GardenModel,
  mode: LayoutMode,
  visibleFrom: string,
): number {
  let min = Infinity;
  let max = -Infinity;

  for (const day of model.days) {
    if (visibleFrom && day.date < visibleFrom) continue;
    const x = day.positions[mode][0];
    if (x < min) min = x;
    if (x > max) max = x;
  }

  if (min === Infinity) return 0;
  return (min + max) / 2;
}

/**
 * Largest |NDC| the layout's bounding box reaches at `distance`. 1 means it
 * exactly fills the frustum, >1 means it is clipped by that factor.
 */
function projectOverflow(
  distance: number,
  pitch: number,
  fov: number,
  aspect: number,
  halfW: number,
  halfD: number,
): number {
  const camY = Math.sin(pitch) * distance;
  const camZ = Math.cos(pitch) * distance;

  // Camera basis for a lookAt(origin) with world up +Y. Forward points from the
  // camera to the origin; right is +X; up is forward x right.
  const len = Math.hypot(camY, camZ);
  const fy = -camY / len;
  const fz = -camZ / len;
  // up = right (1,0,0) cross forward (0,fy,fz) => (0*fz - 0*fy, 0*0 - 1*fz, 1*fy - 0*0)
  const uy = -fz;
  const uz = fy;

  const t = Math.tan(fov / 2);
  let worst = 0;

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (const hy of [0, TALLEST_PLANT]) {
        const dx = sx * halfW;
        const dy = hy - camY;
        const dz = sz * halfD - camZ;

        const zc = dy * fy + dz * fz; // depth along the view axis
        if (zc <= 0.001) continue;
        const xc = dx;
        const yc = dy * uy + dz * uz;

        worst = Math.max(
          worst,
          Math.abs(xc / (zc * t * aspect)),
          Math.abs(yc / (zc * t)),
        );
      }
    }
  }

  return worst || 1;
}
