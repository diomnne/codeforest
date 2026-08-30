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
  /** Earliest visible date; the camera re-centres when the range changes. */
  visibleFrom: string;
  reducedMotion: boolean;
};

/** Never hold the camera longer than this, even if the ease hasn't converged. */
const REFRAME_MS = 1200;

/**
 * Reframes the camera as part of the layout transition. Each layout has a
 * different footprint — a long thin strip versus a chunky panel grid — so a
 * camera framed for one loses the other. Distance is derived from the viewport
 * aspect ratio, so a wide layout still fits on a phone in portrait.
 */
export default function CameraRig({
  model,
  mode,
  visibleFrom,
  reducedMotion,
}: Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();

  // Aspect is read when a reframe starts, but must not itself trigger one, so
  // it is kept out of the effect's dependencies.
  const aspectRef = useRef(1);

  const desired = useRef({
    position: new Vector3(),
    target: new Vector3(),
  });
  const initialised = useRef(false);
  /** True while an animated reframe is in flight. */
  const reframing = useRef(false);
  const elapsed = useRef(0);

  // Only re-frame when the layout or the data actually changes. Keying this on
  // `aspect` too meant every resize — including the browser's initial layout
  // settle — kicked off a fresh reframe that stole the camera from the user.
  useEffect(() => {
    // On the very first pass no frame has run yet, so take the aspect directly.
    if (!initialised.current) aspectRef.current = size.width / size.height;

    const framing = framingFor(mode, model, aspectRef.current, visibleFrom);
    desired.current.position.set(...framing.position);
    desired.current.target.set(...framing.target);
    elapsed.current = 0;

    const ctrl = controls.current;

    // First frame, or reduced motion: jump straight there, no animation.
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

    // Otherwise the useFrame loop below eases toward the new framing, in step
    // with the instance-matrix morph.
    reframing.current = true;
    // `size` is deliberately excluded: a resize should feed the *next* reframe
    // (via aspectRef in the frame loop), not start one. Including it meant the
    // browser's initial layout settle stole the camera from the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, model, visibleFrom, camera, reducedMotion]);

  // Any deliberate camera input hands control straight back to the user, rather
  // than making them fight the easing until it converges.
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
    // Kept current from inside the loop, so a resize is picked up by the *next*
    // reframe without itself triggering one.
    aspectRef.current = state.size.width / state.size.height;

    if (reducedMotion) return;
    const ctrl = controls.current;
    if (!ctrl) return;

    // Only drive the camera while a reframe is in flight; once it settles the
    // user gets free orbit control back and we stop fighting their input.
    if (!reframing.current) return;

    const target = desired.current;
    // Frame-rate independent easing, tuned to land with the ~1.2s morph.
    const k = 1 - Math.exp(-delta * 3.6);

    // Ease toward the full desired position, not just its length: each layout
    // wants a genuinely different viewing angle, so preserving the current
    // orbit angle would leave the wide strip running off-screen diagonally.
    //
    // Damping is disabled while a reframe is in flight: OrbitControls' damping
    // smooths the camera toward its own internal spherical state on every
    // update(), which fights this lerp and leaves the camera short of the
    // framing distance.
    ctrl.enableDamping = false;
    camera.position.lerp(target.position, k);
    ctrl.target.lerp(target.target, k);
    ctrl.update();

    // Hard time cap. Convergence alone is not enough to end the reframe: at the
    // large distances portrait framing produces, an exponential ease can sit
    // above the positional threshold for seconds, and every one of those frames
    // overwrites camera.position — which is exactly what made dragging feel
    // stubborn right after a load or a layout change.
    elapsed.current += delta * 1000;

    const settled =
      camera.position.distanceTo(target.position) < 0.05 &&
      ctrl.target.distanceTo(target.target) < 0.05;

    if (settled || elapsed.current >= REFRAME_MS) {
      camera.position.copy(target.position);
      ctrl.target.copy(target.target);
      ctrl.update();
      // Hand damping back for the user's own orbiting.
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
