import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type { Group, Material } from "three";
import { CELL, type GardenModel } from "@/lib/layout";
import type { Palette } from "@/lib/palette";
import type { LayoutMode } from "@/lib/types";
import type { AnimationState } from "./Garden";

type Props = {
  model: GardenModel;
  palette: Palette;
  mode: LayoutMode;
  anim: RefObject<AnimationState>;
};

/**
 * The ground plane plus one soil panel per month in the 4x3 / 6x2 layouts.
 *
 * Panels belong to a specific layout, so each set fades out as the morph moves
 * away from it — driven from the frame loop rather than React state, in step
 * with the instance morph.
 */
export default function Ground({ model, palette, mode, anim }: Props) {
  // Fixed, not derived from the data. The camera framing is fixed too, so a
  // ground plane sized to a one-month layout would show its own edge as a hard
  // diagonal horizon. Comfortably larger than the fog's far bound, so the plane
  // has faded into the sky long before it ends.
  const groundSize = 1200;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshLambertMaterial color={palette.ground} />
      </mesh>

      {([2, 3, 4] as const).map((panelMode) => (
        <PanelSet
          key={panelMode}
          model={model}
          panelMode={panelMode}
          mode={mode}
          color={palette.panel}
          anim={anim}
        />
      ))}
    </group>
  );
}

/**
 * One layout's month panels. Visible only while the morph is at or near that
 * layout, so panels from the outgoing layout fade as the incoming ones arrive.
 */
function PanelSet({
  model,
  panelMode,
  mode,
  color,
  anim,
}: {
  model: GardenModel;
  panelMode: 2 | 3 | 4;
  mode: LayoutMode;
  color: string;
  anim: RefObject<AnimationState>;
}) {
  const groupRef = useRef<Group>(null);
  const lastOpacity = useRef(-1);
  const panels = model.panels[panelMode];

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    // `progress` runs 0 -> 1 as the morph settles into the *current* mode, so
    // these panels are only solid when they are the ones being moved into.
    const target = mode === panelMode ? anim.current.progress : 0;
    const opacity = Math.max(0, Math.min(1, target));

    if (Math.abs(opacity - lastOpacity.current) < 0.002) return;
    lastOpacity.current = opacity;

    group.visible = opacity > 0.01;
    if (!group.visible) return;

    for (const child of group.children) {
      const material = (child as { material?: Material }).material;
      if (material && "opacity" in material) {
        (material as Material & { opacity: number }).opacity = opacity * 0.85;
      }
    }
  });

  if (panels.length === 0) return null;

  return (
    <group ref={groupRef}>
      {panels.map((panel) => (
        <mesh
          key={panel.key}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[panel.center[0], 0.001, panel.center[2]]}
        >
          <planeGeometry
            args={[panel.width + CELL * 0.5, panel.depth + CELL * 0.5]}
          />
          {/* Each panel gets its own material instance so per-mesh opacity
              writes in the frame loop don't collide. */}
          <meshBasicMaterial color={color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}
