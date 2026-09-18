import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { framingFor, type GardenModel } from "@/lib/layout";
import type { LayoutMode } from "@/lib/types";

type Props = {
  model: GardenModel;
  mode: LayoutMode;
    visibleFrom: string;
  reducedMotion: boolean;
};

const REFRAME_MS = 1200;

export default function CameraRig({
  model,
  mode,
  visibleFrom,
  reducedMotion,
}: Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const aspectRef = useRef(1);

  const desired = useRef({
    position: new Vector3(),
    target: new Vector3(),
  });
  const initialised = useRef(false);
    const reframing = useRef(false);
  const elapsed = useRef(0);
  useEffect(() => {
    if (!initialised.current) aspectRef.current = size.width / size.height;

    const framing = framingFor(mode, model, aspectRef.current, visibleFrom);
    desired.current.position.set(...framing.position);
    desired.current.target.set(...framing.target);
    elapsed.current = 0;

    const ctrl = controls.current;
    if (!initialised.current || reducedMotion) {
      camera.position.copy(desired.current.position);
      if (ctrl) {
        ctrl.target.copy(desired.current.target);
        ctrl.update();
      }
      initialised.current = true;
      reframing.current = false;
      return;
    }
    reframing.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, model, visibleFrom, camera, reducedMotion]);
  useEffect(() => {
    const ctrl = controls.current;
    if (!ctrl) return;
    const cancel = () => {
      reframing.current = false;
      ctrl.enableDamping = true;
    };
    ctrl.addEventListener("start", cancel);
    return () => ctrl.removeEventListener("start", cancel);
  }, []);

  useFrame((state, delta) => {
    aspectRef.current = state.size.width / state.size.height;

    if (reducedMotion) return;
    const ctrl = controls.current;
    if (!ctrl) return;
    if (!reframing.current) return;

    const target = desired.current;
    const k = 1 - Math.exp(-delta * 3.6);
    ctrl.enableDamping = false;
    camera.position.lerp(target.position, k);
    ctrl.target.lerp(target.target, k);
    ctrl.update();
    elapsed.current += delta * 1000;

    const settled =
      camera.position.distanceTo(target.position) < 0.05 &&
      ctrl.target.distanceTo(target.target) < 0.05;

    if (settled || elapsed.current >= REFRAME_MS) {
      camera.position.copy(target.position);
      ctrl.target.copy(target.target);
      ctrl.update();
      ctrl.enableDamping = true;
      reframing.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI / 2.15}
      minDistance={4}
      maxDistance={400}
    />
  );
}
