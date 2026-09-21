# Code Forest

## Overview

A 3D visualization of a GitHub user's past-year contribution graph, grown into a navigable forest.

- Each day is represented by a plant, where the plant's growth stage (from bare soil to a tree) reflects the user's relative contribution quartile for that day.
- The forest can be orbited and zoomed in 3D space, toggled between Day and Night themes, and filtered by timeframe (Past Year, 6 Months, 3 Months, This Month).
- A Story Modal renders a shareable 2D image overlaying the forest with the user's lifetime GitHub statistics.

Forests are shareable via URL routing. Procedural plant placement is seeded off the username, so a given user always grows the same forest.

## Performance Notes: Bundle & Model Size

Rendering a dense 3D scene in the browser can easily tank performance. Keeping the model budget sane and the bundle size low required focused optimization:

- **Instancing:** Instead of ~365 individual meshes for a year of contributions, plants render as one `InstancedMesh` per growth level — exactly **4 instanced draw calls** per frame.
- **Vertex Budget:** The forest averages ~70,000 vertices. Each plant is a single merged `BufferGeometry` built once at module scope from extreme low-poly primitives (a 5-segment `CylinderGeometry` trunk and `IcosahedronGeometry` canopies at detail 0). Visual variety comes from randomized per-instance scale and rotation, not heavy external `.gltf` files.
- **Bundle Sizing:** Three.js and its dependencies (~236 KB gzipped) are lazy-loaded via Next.js `dynamic(..., { ssr: false })`, so they never block the initial HTML document load or time-to-interactive for the surrounding UI.

## FE-10 Audit: Load & Frame Rate

- **Load (Lighthouse, mobile, production build):** Performance score of 63, with LCP and TBT the two metrics dragging it down. The likely cause is architectural: the entire page is gated behind `dynamic(..., { ssr: false })`, so nothing meaningful paints until Three.js downloads, parses, and the year's geometry/instance data is built — and that build currently runs as one synchronous block on mount, which is also what blocks the main thread long enough to hurt TBT. With more time: server-render the surrounding UI (stat cards, header, theme toggle) so LCP measures against real content rather than waiting on the canvas, and break geometry/instance setup into chunks via `requestIdleCallback` instead of one long task.
- **Frame rate / interaction responsiveness (Chrome Performance panel, 4x–6x CPU throttling):** INP ranged 51-250ms across repeated runs, mostly landing under the 200ms "good" threshold, with occasional spikes into "needs improvement." Plain orbiting stayed smooth and consistent on an actual phone (no heat, no visible stutter). The spikes track specific interactions rather than orbit itself — rendering work overlapping the event on the timeline points to a synchronous instance-matrix rebuild when the timeline filter or layout changes, rather than a general performance ceiling.

## What Could Be Added With More Time

- **Smoother Timeline/Layout Transitions:** Move instance-matrix rebuilds off the main thread (e.g. `requestIdleCallback`, or spreading the update across a few frames) to close the INP gap seen when switching timeframes.
- **Faster Initial Paint:** Server-render the page chrome outside the canvas boundary so first paint isn't gated behind the Three.js bundle, improving LCP without touching the 3D scene itself.
- **Wind Animations:** A lightweight vertex-shader sway on plant canopies, nearly free on the GPU, to make the forest feel alive.
- **Timeline Camera Focus:** Flying the camera to frame the active range when the timeline selector changes, rather than leaving framing static across timeframes.
- **Terrain Displacement:** Gentle terrain shaping and contact shadows to sell the 3D space better than flat quads on a flat plane.
- **Streak and Milestone Markers:** Visual indicators for long contribution streaks or exceptionally busy days.
- **Unit Testing:** Coverage for the pure functions handling timeline filtering and the mapping between contribution levels and plant instances.
