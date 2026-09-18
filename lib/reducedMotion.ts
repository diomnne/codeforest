const QUERY = "(prefers-reduced-motion: reduce)";

export function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

export function getReducedMotionServerSnapshot(): boolean {
  return false;
}
