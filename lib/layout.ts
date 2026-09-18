import { rngFromSeed } from "./random";
import type { Contribution, LayoutMode } from "./types";

export type Vec3 = [number, number, number];

export type GardenDay = {
  index: number;
  date: string;
  count: number;
  level: number;
    positions: Record<LayoutMode, Vec3>;
    scale: number;
  rotation: number;
};

export type MonthPanel = {
    key: string;
  label: string;
    center: Vec3;
  width: number;
  depth: number;
};

export type LayoutExtent = { width: number; depth: number };

export type GardenModel = {
  days: GardenDay[];
    panels: Record<LayoutMode, MonthPanel[]>;
    byLevel: number[][];
  extents: Record<LayoutMode, LayoutExtent>;
};

export const CELL = 0.82;
const TALLEST_PLANT = 2.2;

export function buildGardenModel(
  contributions: Contribution[],
  seed: string,
): GardenModel {
  const rng = rngFromSeed(seed);
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

const PITCH = 0.42;

const FRAMED_WEEKS = 20;

export function framingFor(
  mode: LayoutMode,
  model: GardenModel,
  aspect: number,
    visibleFrom = "",
  fovDeg = 45,
): { position: Vec3; target: Vec3; distance: number } {
  const fov = (fovDeg * Math.PI) / 180;
  const safeAspect = Math.max(aspect, 0.35);
  const { depth } = model.extents[mode];
  const width = FRAMED_WEEKS * CELL;
  const halfW = width / 2;
  const halfD = depth / 2;
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
  const len = Math.hypot(camY, camZ);
  const fy = -camY / len;
  const fz = -camZ / len;
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
