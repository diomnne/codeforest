"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { buildGardenModel, type GardenModel } from "@/lib/layout";
import {
  getReducedMotionServerSnapshot,
  getReducedMotionSnapshot,
  subscribeReducedMotion,
} from "@/lib/reducedMotion";
import { PALETTES, type Palette } from "@/lib/palette";
import type { Contribution, LayoutMode, TimeOfDay } from "@/lib/types";
import CameraRig from "./CameraRig";
import Ground from "./Ground";
import LoadingScreen from "./LoadingScreen";
import Plants, { type HoverPayload } from "./Plants";
import Tooltip from "./Tooltip";

/**
 * The single 'use client' boundary for the whole canvas tree. Everything below
 * this file is client-only by inheritance — no scattered directives.
 */

const MORPH_MS = 1200;

type Props = {
  username: string;
  /** Always the full window. Narrowing is done with `visibleFrom`, not here. */
  contributions: Contribution[];
  /** Earliest date to show, as `YYYY-MM-DD`. Days before it fade out. */
  visibleFrom: string;
  timeOfDay: TimeOfDay;
};

/** Only one layout remains, but the morph machinery is keyed by mode. */
const MODE: LayoutMode = "github";

export default function Garden({
  username,
  contributions,
  visibleFrom,
  timeOfDay,
}: Props) {
  // Built from the full window and kept stable across range changes. Rebuilding
  // it per range changed each batch's instance count, which remounted the
  // InstancedMeshes — that is why switching ranges popped instead of animating.
  const model = useMemo(
    () => buildGardenModel(contributions, username),
    [contributions, username],
  );

  const reducedMotion = usePrefersReducedMotion();
  const [hover, setHover] = useState<HoverPayload>(null);
  const [ready, setReady] = useState(false);
  const palette = PALETTES[timeOfDay];

  const hoveredDay = hover ? model.days[hover.dayIndex] : null;

  return (
    <div className="relative h-full w-full">
      <Canvas
        // Cap dpr so high-DPI phones don't render at 3x.
        dpr={[1, 1.5]}
        camera={{ fov: 45, near: 0.1, far: 2000, position: [40, 40, 40] }}
        onPointerMissed={() => setHover(null)}
      >
        <Scene
          model={model}
          mode={MODE}
          palette={palette}
          visibleFrom={visibleFrom}
          reducedMotion={reducedMotion}
          onHover={setHover}
          onReady={() => setReady(true)}
        />
      </Canvas>

      {/* The dynamic import's fallback ends when the chunk arrives, but the
          scene still has geometry to build and a first frame to draw. Hold the
          loading screen over the canvas until that frame is actually on
          screen, so the forest never appears half-built. */}
      {!ready && (
        <div className="absolute inset-0 z-10">
          <LoadingScreen />
        </div>
      )}

      {hoveredDay && hover && (
        <Tooltip day={hoveredDay} x={hover.x} y={hover.y} />
      )}
    </div>
  );
}

/** Lives inside the Canvas so it can drive animation from the frame loop. */
function Scene({
  model,
  mode,
  palette,
  visibleFrom,
  reducedMotion,
  onHover,
  onReady,
}: {
  model: GardenModel;
  mode: LayoutMode;
  palette: Palette;
  visibleFrom: string;
  reducedMotion: boolean;
  onHover: (payload: HoverPayload) => void;
  onReady: () => void;
}) {
  const anim = useAnimationState(mode, reducedMotion);
  useFirstFrame(onReady);
  // Eased in the frame loop rather than swapped: a hard cut between day and
  // night is jarring, and every colour in the scene changes at once.
  const live = usePaletteTween(palette, reducedMotion);

  return (
    <>
      <color attach="background" args={[live.background]} />
      <SceneFog color={live.fog} />

      <ambientLight
        intensity={live.ambientIntensity}
        color={live.ambient}
      />
      <directionalLight
        position={[30, 60, 20]}
        intensity={live.keyIntensity}
        color={live.key}
      />

      <Ground model={model} palette={live} mode={mode} anim={anim} />
      <Plants
        model={model}
        anim={anim}
        visibleFrom={visibleFrom}
        reducedMotion={reducedMotion}
        colors={live.plant}
        onHover={onHover}
      />
      <CameraRig
        model={model}
        mode={mode}
        visibleFrom={visibleFrom}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

/**
 * Fires once the scene has actually drawn. Waits a couple of frames rather than
 * one: the first is where instance matrices are written and geometry uploaded,
 * so revealing on it can still catch a partially built forest.
 */
function useFirstFrame(onReady: () => void) {
  const frames = useRef(0);
  const done = useRef(false);

  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= 3) {
      done.current = true;
      onReady();
    }
  });
}

const PALETTE_TWEEN_MS = 700;

/**
 * Eases the whole palette toward `target` over ~0.7s.
 *
 * The tween lives in React state rather than a ref because these values are
 * material and light props, not instance matrices — R3F has to re-render to
 * apply them. That is a handful of cheap prop updates per frame for well under
 * a second, not a per-instance rewrite.
 */
function usePaletteTween(target: Palette, reducedMotion: boolean): Palette {
  const [current, setCurrent] = useState(target);
  const from = useRef(target);
  const elapsed = useRef(0);
  const active = useRef(false);
  const lastTarget = useRef(target);
  // The frame loop needs the value it last committed, not the one captured when
  // this render's closure was created. Written only from inside the loop.
  const currentRef = useRef(target);

  useFrame((_, delta) => {
    if (lastTarget.current !== target) {
      from.current = currentRef.current;
      lastTarget.current = target;
      elapsed.current = 0;
      active.current = true;
    }

    if (reducedMotion) {
      if (active.current) {
        currentRef.current = target;
        setCurrent(target);
        active.current = false;
      }
      return;
    }

    if (!active.current) return;

    elapsed.current += delta * 1000;
    const t = Math.min(1, elapsed.current / PALETTE_TWEEN_MS);
    // easeInOutSine — no overshoot, which matters for colour.
    const eased = -(Math.cos(Math.PI * t) - 1) / 2;

    const next = t >= 1 ? target : mixPalettes(from.current, target, eased);
    currentRef.current = next;
    setCurrent(next);

    if (t >= 1) active.current = false;
  });

  return current;
}

function mixPalettes(a: Palette, b: Palette, t: number): Palette {
  return {
    plant: {
      1: mixHex(a.plant[1], b.plant[1], t),
      2: mixHex(a.plant[2], b.plant[2], t),
      3: mixHex(a.plant[3], b.plant[3], t),
      4: mixHex(a.plant[4], b.plant[4], t),
    },
    ground: mixHex(a.ground, b.ground, t),
    panel: mixHex(a.panel, b.panel, t),
    background: mixHex(a.background, b.background, t),
    fog: mixHex(a.fog, b.fog, t),
    key: mixHex(a.key, b.key, t),
    ambient: mixHex(a.ambient, b.ambient, t),
    keyIntensity: a.keyIntensity + (b.keyIntensity - a.keyIntensity) * t,
    ambientIntensity:
      a.ambientIntensity + (b.ambientIntensity - a.ambientIntensity) * t,
  };
}

/**
 * Mixes in sRGB space. Not physically correct, but these are hand-picked
 * palette values rather than measured light, and sRGB keeps the midpoint
 * looking like the colour a designer would have chosen.
 */
function mixHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);

  const to2 = (n: number) =>
    Math.round(n).toString(16).padStart(2, "0");

  return `#${to2(ar + (br - ar) * t)}${to2(ag + (bg - ag) * t)}${to2(
    ab + (bb - ab) * t,
  )}`;
}

/**
 * Fog bounds are fixed in world units rather than scaled to the camera
 * distance. Keying them to the camera made the horizon move whenever the
 * framing changed — pulling the camera closer dragged the haze in with it and
 * made the sky feel like it had closed in.
 */
function SceneFog({ color }: { color: string }) {
  return <fog attach="fog" args={[color, 60, 260]} />;
}

/**
 * Animation progress lives in a mutable ref advanced inside the R3F frame loop,
 * not in React state: the morph runs for ~1.2s at 60fps, and re-rendering the
 * whole tree on every one of those frames would be pure waste. Only the frame
 * loop reads it, and only to rewrite instance matrices.
 */
export type AnimationState = {
  /** Layout being morphed away from. */
  from: LayoutMode;
  /** Layout being morphed into. */
  to: LayoutMode;
  /** 0..1 eased progress from `from` to `to`. */
  progress: number;
  /** 0..1 grow-in factor for the first-load animation. */
  grow: number;
};

function useAnimationState(
  mode: LayoutMode,
  reducedMotion: boolean,
): React.RefObject<AnimationState> {
  const state = useRef<AnimationState>({
    from: mode,
    to: mode,
    progress: 1,
    grow: reducedMotion ? 1 : 0,
  });
  // Read and written only inside the frame loop, never during render, so there
  // is no ref-during-render hazard.
  const tween = useRef({ requested: mode, elapsed: 0, active: false });

  useFrame((_, delta) => {
    const s = state.current;
    const tw = tween.current;

    // Grow-in on first load; skipped entirely under reduced motion.
    if (s.grow < 1) {
      s.grow = reducedMotion ? 1 : Math.min(1, s.grow + delta / 0.9);
    }

    // Pick up a layout change here rather than during render.
    if (tw.requested !== mode) {
      // Start from wherever the current transition had reached, so switching
      // mid-morph doesn't snap.
      s.from = s.progress >= 1 ? s.to : resolveCurrent(s);
      s.to = mode;
      s.progress = 0;
      tw.requested = mode;
      tw.elapsed = 0;
      tw.active = true;
    }

    if (reducedMotion) {
      // Jump straight to the new layout, no animation.
      s.from = mode;
      s.to = mode;
      s.progress = 1;
      tw.active = false;
      return;
    }

    if (!tw.active) return;

    tw.elapsed += delta * 1000;
    const t = Math.min(1, tw.elapsed / MORPH_MS);
    // easeInOutCubic
    s.progress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    if (t >= 1) {
      s.progress = 1;
      s.from = s.to;
      tw.active = false;
    }
  });

  return state;
}

/**
 * Interrupting a morph mid-flight would need a third position set to lerp from.
 * Rather than carry one, snap to whichever endpoint is nearer — visually the
 * transition is fast enough that this reads as a direction change, not a jump.
 */
function resolveCurrent(s: AnimationState): LayoutMode {
  return s.progress > 0.5 ? s.to : s.from;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}
