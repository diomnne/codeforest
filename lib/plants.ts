import {
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  Matrix4,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * One merged BufferGeometry per level, composed of low-poly primitives.
 *
 * Segment counts are deliberately tiny — this is a rotating demo, not a render.
 * Continuous variation comes from per-instance scale and rotation, not from
 * more geometry.
 *
 * Vertex counts (post-merge, non-indexed) are logged by `plantVertexCount`.
 */

type Part = { geometry: BufferGeometry; transform: Matrix4 };

function place(
  geometry: BufferGeometry,
  x: number,
  y: number,
  z: number,
  scale = 1,
): Part {
  const transform = new Matrix4().makeTranslation(x, y, z);
  if (scale !== 1) transform.multiply(new Matrix4().makeScale(scale, scale, scale));
  return { geometry, transform };
}

function merge(parts: Part[]): BufferGeometry {
  // CylinderGeometry and ConeGeometry are indexed; IcosahedronGeometry is not.
  // mergeGeometries requires the index attribute to exist on all inputs or on
  // none, so normalise everything to non-indexed first — otherwise it returns
  // null and the plant never builds.
  const applied = parts.map(({ geometry, transform }) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    // Keep only position; merging is attribute-sensitive and normals are
    // recomputed below anyway.
    for (const name of Object.keys(g.attributes)) {
      if (name !== "position") g.deleteAttribute(name);
    }
    return g.applyMatrix4(transform);
  });

  const merged = mergeGeometries(applied, false);
  applied.forEach((g) => g.dispose());
  if (!merged) throw new Error("mergeGeometries returned null");
  merged.computeVertexNormals();
  return merged;
}

/** Level 1 — seedling: a thin stem with two small leaves. */
function buildSeedling(): BufferGeometry {
  const stem = new CylinderGeometry(0.035, 0.05, 0.42, 5, 1);
  const leafL = new IcosahedronGeometry(0.13, 0);
  const leafR = new IcosahedronGeometry(0.11, 0);

  const g = merge([
    place(stem, 0, 0.21, 0),
    place(leafL, 0.1, 0.4, 0.02),
    place(leafR, -0.09, 0.32, -0.03),
  ]);
  stem.dispose();
  leafL.dispose();
  leafR.dispose();
  return g;
}

/** Level 2 — small shrub: a squat clump of foliage. */
function buildShrub(): BufferGeometry {
  const stem = new CylinderGeometry(0.05, 0.07, 0.3, 5, 1);
  const a = new IcosahedronGeometry(0.26, 0);
  const b = new IcosahedronGeometry(0.2, 0);
  const c = new IcosahedronGeometry(0.17, 0);

  const g = merge([
    place(stem, 0, 0.15, 0),
    place(a, 0, 0.44, 0),
    place(b, 0.19, 0.34, 0.08),
    place(c, -0.16, 0.38, -0.1),
  ]);
  [stem, a, b, c].forEach((x) => x.dispose());
  return g;
}

/** Level 3 — medium flowering bush: fuller canopy plus blossom cones. */
function buildBush(): BufferGeometry {
  const trunk = new CylinderGeometry(0.07, 0.1, 0.5, 5, 1);
  const a = new IcosahedronGeometry(0.36, 0);
  const b = new IcosahedronGeometry(0.27, 0);
  const c = new IcosahedronGeometry(0.23, 0);
  const bloom = new ConeGeometry(0.075, 0.16, 5, 1);

  const g = merge([
    place(trunk, 0, 0.25, 0),
    place(a, 0, 0.72, 0),
    place(b, 0.28, 0.6, 0.12),
    place(c, -0.24, 0.64, -0.14),
    place(bloom, 0.06, 1.03, 0.04),
    place(bloom, -0.22, 0.88, 0.18),
    place(bloom, 0.2, 0.85, -0.2),
  ]);
  [trunk, a, b, c, bloom].forEach((x) => x.dispose());
  return g;
}

/** Level 4 — tall flowering tree: the landmark plant of a busy month. */
function buildTree(): BufferGeometry {
  const trunk = new CylinderGeometry(0.075, 0.13, 1.15, 5, 1);
  const a = new IcosahedronGeometry(0.46, 0);
  const b = new IcosahedronGeometry(0.34, 0);
  const c = new IcosahedronGeometry(0.29, 0);
  const d = new IcosahedronGeometry(0.24, 0);
  const bloom = new ConeGeometry(0.085, 0.19, 5, 1);

  const g = merge([
    place(trunk, 0, 0.575, 0),
    place(a, 0, 1.36, 0),
    place(b, 0.34, 1.14, 0.16),
    place(c, -0.3, 1.2, -0.18),
    place(d, 0.1, 1.66, -0.12),
    place(bloom, 0.1, 1.78, 0.1),
    place(bloom, -0.3, 1.44, 0.26),
    place(bloom, 0.36, 1.36, -0.22),
  ]);
  [trunk, a, b, c, d, bloom].forEach((x) => x.dispose());
  return g;
}

/** Index 0 is intentionally absent: level 0 renders nothing but bare soil. */
export const PLANT_GEOMETRIES: Record<1 | 2 | 3 | 4, BufferGeometry> = {
  1: buildSeedling(),
  2: buildShrub(),
  3: buildBush(),
  4: buildTree(),
};

export function plantVertexCount(level: 1 | 2 | 3 | 4): number {
  return PLANT_GEOMETRIES[level].getAttribute("position").count;
}

/** Nominal height per level, used to seat tooltips above the plant. */
export const PLANT_HEIGHT: Record<1 | 2 | 3 | 4, number> = {
  1: 0.55,
  2: 0.72,
  3: 1.15,
  4: 1.95,
};
