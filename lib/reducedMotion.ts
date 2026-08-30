const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Subscribe/snapshot pair for `useSyncExternalStore` — the supported way to
 * read a browser media query during render without a setState-in-effect
 * cascade.
 *
 * `getServerSnapshot` returns false so the server and the first client render
 * agree. That's safe because the *visual* reduced-motion swap (canvas vs. the
 * server-rendered static view) is done in CSS, which needs no JS at all; this
 * hook only decides whether to mount the WebGL context.
 */
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
