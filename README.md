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

## What Could Be Added With More Time

- **Wind Animations:** A lightweight vertex-shader sway on plant canopies, nearly free on the GPU, to make the forest feel alive.
- **Timeline Camera Focus:** Flying the camera to frame the active range when the timeline selector changes, rather than leaving framing static across timeframes.
- **Terrain Displacement:** Gentle terrain shaping and contact shadows to sell the 3D space better than flat quads on a flat plane.
- **Streak and Milestone Markers:** Visual indicators for long contribution streaks or exceptionally busy days.
- **Unit Testing:** Coverage for the pure functions handling timeline filtering and the mapping between contribution levels and plant instances.