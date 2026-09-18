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
    anim: RefObject<AnimationState>;
    visibleFrom: string;
  reducedMotion: boolean;
  colors: Record<PlantLevel, string>;
  onHover: (payload: HoverPayload) => void;
};

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

    const dayIndices = model.byLevel[level];
  const count = dayIndices.length;
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
  const writtenFor = useRef<GardenModel | null>(null);

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
    if (shownRef.current.length !== count) {
      shownRef.current = new Float32Array(count).fill(1);
    }
    const shown = shownRef.current;

    const { from, to, progress, grow } = anim.current;
    const prev = lastWritten.current;
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
      key={count}
      args={[PLANT_GEOMETRIES[level], undefined, count]}
      userData={{ plantLevel: level }}
      frustumCulled={false}
      castShadow={false}
      receiveShadow={false}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.pointerType === "touch" || e.pointerType === "pen") return;
        if (e.instanceId === undefined) return;
        if ((shownRef.current[e.instanceId] ?? 1) < 0.5) return;
        onHover({
          dayIndex: dayIndices[e.instanceId],
          x: e.clientX,
          y: e.clientY,
        });
      }}
      onPointerOut={(e) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") return;
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
        if (e.instanceId === undefined) return;
        if ((shownRef.current[e.instanceId] ?? 1) < 0.5) return;
        onHover({
          dayIndex: dayIndices[e.instanceId],
          x: e.clientX,
          y: e.clientY,
        });
      }}
    >
      <meshLambertMaterial color={color} />
    </instancedMesh>
  );
}

export { LEVELS };
export type { PlantLevel };
