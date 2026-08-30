import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import { InstancedMesh, Object3D, Vector3 } from "three";
import type { GardenModel } from "@/lib/layout";
import { PLANT_GEOMETRIES } from "@/lib/plants";
import type { LayoutMode } from "@/lib/types";
import type { AnimationState } from "./Garden";

const LEVELS = [1, 2, 3, 4] as const;
type PlantLevel = (typeof LEVELS)[number];

export type HoverPayload = { dayIndex: number; x: number; y: number } | null;

type Props = {
  model: GardenModel;
  /** Mutable animation state, advanced in the frame loop (never React state). */
  anim: RefObject<AnimationState>;
  /** Earliest date to show; earlier days shrink away. */
  visibleFrom: string;
  reducedMotion: boolean;
  colors: Record<PlantLevel, string>;
  onHover: (payload: HoverPayload) => void;
};

/**
 * One InstancedMesh per level (4 batches), not one mesh per day — ~365 separate
 * meshes would mean ~365 draw calls and tank both frame rate and Lighthouse.
 */
export default function Plants({
  model,
  anim,
  visibleFrom,
  reducedMotion,
  colors,
  onHover,
}: Props) {
  return (
    <group>
      {LEVELS.map((level) => (
        <LevelBatch
          key={level}
          level={level}
          model={model}
          anim={anim}
          visibleFrom={visibleFrom}
          reducedMotion={reducedMotion}
          color={colors[level]}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

function LevelBatch({
  level,
  model,
  anim,
  visibleFrom,
  reducedMotion,
  color,
  onHover,
}: {
  level: PlantLevel;
  model: GardenModel;
  anim: RefObject<AnimationState>;
  visibleFrom: string;
  reducedMotion: boolean;
  color: string;
  onHover: (payload: HoverPayload) => void;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  /**
   * A raycast against an InstancedMesh yields an instanceId scoped to *that*
   * batch. Without this mapping, hover would report the wrong day entirely.
   */
  const dayIndices = model.byLevel[level];
  const count = dayIndices.length;

  // Written matrices lag the target values; we only push to the GPU while the
  // transition or grow-in is still moving.
  const lastWritten = useRef<{
    progress: number;
    grow: number;
    from: LayoutMode | null;
    to: LayoutMode | null;
  }>({
    progress: -1,
    grow: -1,
    from: null,
    to: null,
  });

  // A new model (different user or range) must always be re-uploaded, even if
  // the batch size and morph state happen to be identical to the last one.
  const writtenFor = useRef<GardenModel | null>(null);

  /**
   * Per-instance visibility, 0..1, eased toward `wanted` each frame. A day
   * outside the selected range shrinks to nothing in place rather than being
   * removed from the batch — which is what keeps the instance count, and so the
   * mesh itself, stable across range changes.
   */
  const shownRef = useRef<Float32Array>(new Float32Array(0));

  const writeMatrices = useMemo(() => {
    const pos = new Vector3();
    const to = new Vector3();

    return (
      mesh: InstancedMesh,
      fromMode: LayoutMode,
      toMode: LayoutMode,
      t: number,
      g: number,
    ) => {
      for (let i = 0; i < count; i++) {
        const day = model.days[dayIndices[i]];
        const a = day.positions[fromMode];
        const b = day.positions[toMode];

        pos.set(a[0], a[1], a[2]);
        to.set(b[0], b[1], b[2]);
        pos.lerp(to, t);

        dummy.position.copy(pos);
        dummy.rotation.set(0, day.rotation, 0);
        const s = day.scale * g * shownRef.current[i];
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };
  }, [count, dayIndices, model.days, dummy]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Allocated here rather than during render: this buffer is frame-loop
    // state, and writing a ref while rendering is not allowed.
    if (shownRef.current.length !== count) {
      shownRef.current = new Float32Array(count).fill(1);
    }
    const shown = shownRef.current;

    const { from, to, progress, grow } = anim.current;
    const prev = lastWritten.current;

    // Ease each instance toward its wanted visibility, so a range change grows
    // days in and shrinks them out rather than swapping the forest wholesale.
    let visibilityMoving = false;
    const step = reducedMotion ? 1 : delta / 0.55;

    for (let i = 0; i < count; i++) {
      const day = model.days[dayIndices[i]];
      const wanted = day.date >= visibleFrom ? 1 : 0;
      const at = shown[i];
      if (at === wanted) continue;

      const next =
        wanted > at ? Math.min(wanted, at + step) : Math.max(wanted, at - step);
      shown[i] = next;
      visibilityMoving = true;
    }

    // Stop touching instanceMatrix once everything has settled — the upload is
    // the expensive part, and a static forest needs none.
    if (
      !visibilityMoving &&
      writtenFor.current === model &&
      prev.from === from &&
      prev.to === to &&
      Math.abs(prev.progress - progress) < 0.0005 &&
      Math.abs(prev.grow - grow) < 0.0005
    ) {
      return;
    }

    writeMatrices(mesh, from, to, progress, grow);
    writtenFor.current = model;
    lastWritten.current = { progress, grow, from, to };
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      // `key` forces a fresh mesh when the batch size changes — a different
      // user, or a different amount of history. R3F only rebuilds on `args`
      // *identity*, so without this the old instance buffer would be reused at
      // the wrong size and every plant would collapse to the origin. Changing
      // the date range no longer changes `count`, so it no longer remounts.
      key={count}
      // args order is [geometry, material, count]
      args={[PLANT_GEOMETRIES[level], undefined, count]}
      frustumCulled={false}
      castShadow={false}
      receiveShadow={false}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.instanceId === undefined) return;
        // A hidden day is scaled to nothing but still raycastable at its
        // origin; don't report it.
        if ((shownRef.current[e.instanceId] ?? 1) < 0.5) return;
        onHover({
          dayIndex: dayIndices[e.instanceId],
          x: e.clientX,
          y: e.clientY,
        });
      }}
      onPointerOut={() => onHover(null)}
    >
      <meshLambertMaterial color={color} />
    </instancedMesh>
  );
}

export { LEVELS };
export type { PlantLevel };
