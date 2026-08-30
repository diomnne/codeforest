import { Label, Panel } from "./ui";

/**
 * Shown while the three.js chunk downloads and the first frame is prepared.
 * Uses the theme tokens so it matches whichever sky is about to appear rather
 * than flashing a fixed colour.
 */
export default function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="brut-theme flex h-full w-full flex-col items-center justify-center gap-8 bg-(--ui-surface-solid)"
    >
      <Panel className="flex h-16 w-16 items-center justify-center">
        <Sprout />
      </Panel>
      <Label>Growing your forest…</Label>
    </div>
  );
}

/** A seedling that draws itself in — same vocabulary as the scene. */
function Sprout() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-8 w-8 text-(--ui-fg)"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d="M24 42V22">
        <animate
          attributeName="stroke-dasharray"
          values="0 20; 20 20"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M24 26c0-6-4-10-10-10 0 6 4 10 10 10Z">
        <animate
          attributeName="opacity"
          values="0.15; 1; 0.15"
          dur="1.4s"
          begin="0.15s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M24 22c0-6 4-10 10-10 0 6-4 10-10 10Z">
        <animate
          attributeName="opacity"
          values="0.15; 1; 0.15"
          dur="1.4s"
          begin="0.5s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
