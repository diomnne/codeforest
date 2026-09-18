"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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


const MORPH_MS = 1200;

type Props = {
  username: string;
    contributions: Contribution[];
    visibleFrom: string;
  timeOfDay: TimeOfDay;
    onRegisterCapture?: (capture: (override?: TimeOfDay) => string) => void;
};

const MODE: LayoutMode = "github";

export default function Garden({
  username,
  contributions,
  visibleFrom,
  timeOfDay,
  onRegisterCapture,
}: Props) {
  const model = useMemo(
    () => buildGardenModel(contributions, username),
    [contributions, username],
  );

  const reducedMotion = usePrefersReducedMotion();
  const [hover, setHover] = useState<HoverPayload>(null);
  const [ready, setReady] = useState(false);
  const palette = PALETTES[timeOfDay];

  const hoveredDay = hover ? model.days[hover.dayIndex] : null;
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative h-full w-full">
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 45, near: 0.1, far: 2000, position: [40, 40, 40] }}
        onPointerMissed={() => setHover(null)}
        gl={{ preserveDrawingBuffer: true }}
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
        {onRegisterCapture && (
          <CaptureHelper timeOfDay={timeOfDay} onRegister={onRegisterCapture} />
        )}
      </Canvas>
      {!ready && (
        <div className="absolute inset-0 z-10">
          <LoadingScreen />
        </div>
      )}

      {hoveredDay && hover && (
        <Tooltip day={hoveredDay} x={hover.x} y={hover.y} />
      )}
    </div>
    </div>
  );
}

function CaptureHelper({
  timeOfDay,
  onRegister,
}: {
  timeOfDay: TimeOfDay;
  onRegister: (fn: (override?: TimeOfDay) => string) => void;
}) {
  const { gl, scene, camera } = useThree();
  const timeOfDayRef = useRef(timeOfDay);
  timeOfDayRef.current = timeOfDay;

  useEffect(() => {
    onRegister((overrideTheme?: TimeOfDay) => {
      if (!overrideTheme || overrideTheme === timeOfDayRef.current) {
        return gl.domElement.toDataURL("image/png");
      }

      const pal = PALETTES[overrideTheme];
      const restoreFns: Array<() => void> = [];
      scene.traverse((obj) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const o = obj as any;
        if (o.isInstancedMesh && o.userData.plantLevel != null) {
          const level = o.userData.plantLevel as 1 | 2 | 3 | 4;
          const mat = o.material;
          if (mat?.color) {
            const saved = mat.color.getHex();
            mat.color.set(pal.plant[level]);
            restoreFns.push(() => mat.color.setHex(saved));
          }
        }
        if (o.isMesh && o.userData.role === "ground") {
          const mat = o.material;
          if (mat?.color) {
            const saved = mat.color.getHex();
            mat.color.set(pal.ground);
            restoreFns.push(() => mat.color.setHex(saved));
          }
        }
        if (o.isMesh && o.userData.role === "panel") {
          const mat = o.material;
          if (mat?.color) {
            const saved = mat.color.getHex();
            mat.color.set(pal.panel);
            restoreFns.push(() => mat.color.setHex(saved));
          }
        }
        if (o.isDirectionalLight) {
          const savedColor = o.color.getHex();
          const savedIntensity = o.intensity;
          o.color.set(pal.key);
          o.intensity = pal.keyIntensity;
          restoreFns.push(() => {
            o.color.setHex(savedColor);
            o.intensity = savedIntensity;
          });
        }
        if (o.isAmbientLight) {
          const savedColor = o.color.getHex();
          const savedIntensity = o.intensity;
          o.color.set(pal.ambient);
          o.intensity = pal.ambientIntensity;
          restoreFns.push(() => {
            o.color.setHex(savedColor);
            o.intensity = savedIntensity;
          });
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bg = scene.background as any;
      if (bg?.isColor) {
        const savedBg = bg.getHex();
        bg.set(pal.background);
        restoreFns.push(() => bg.setHex(savedBg));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fog = scene.fog as any;
      if (fog?.color) {
        const savedFog = fog.color.getHex();
        fog.color.set(pal.fog);
        restoreFns.push(() => fog.color.setHex(savedFog));
      }
      gl.render(scene, camera);
      const url = gl.domElement.toDataURL("image/png");
      restoreFns.forEach((fn) => fn());
      gl.render(scene, camera);

      return url;
    });
  }, [gl, scene, camera, onRegister]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

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

function usePaletteTween(target: Palette, reducedMotion: boolean): Palette {
  const [current, setCurrent] = useState(target);
  const from = useRef(target);
  const elapsed = useRef(0);
  const active = useRef(false);
  const lastTarget = useRef(target);
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

function SceneFog({ color }: { color: string }) {
  return <fog attach="fog" args={[color, 60, 260]} />;
}

export type AnimationState = {
    from: LayoutMode;
    to: LayoutMode;
    progress: number;
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
  const tween = useRef({ requested: mode, elapsed: 0, active: false });

  useFrame((_, delta) => {
    const s = state.current;
    const tw = tween.current;
    if (s.grow < 1) {
      s.grow = reducedMotion ? 1 : Math.min(1, s.grow + delta / 0.9);
    }
    if (tw.requested !== mode) {
      s.from = s.progress >= 1 ? s.to : resolveCurrent(s);
      s.to = mode;
      s.progress = 0;
      tw.requested = mode;
      tw.elapsed = 0;
      tw.active = true;
    }

    if (reducedMotion) {
      s.from = mode;
      s.to = mode;
      s.progress = 1;
      tw.active = false;
      return;
    }

    if (!tw.active) return;

    tw.elapsed += delta * 1000;
    const t = Math.min(1, tw.elapsed / MORPH_MS);
    s.progress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    if (t >= 1) {
      s.progress = 1;
      s.from = s.to;
      tw.active = false;
    }
  });

  return state;
}

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
