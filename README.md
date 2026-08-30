# chloris

A GitHub user's past-year contribution graph, grown into a navigable 3D garden.

Each day becomes a plant. The API's `level` (0–4) — a per-user relative quartile,
not a raw count — decides which plant: bare soil, seedling, shrub, flowering bush,
or tall flowering tree.

There are three layouts, all grouped by month, and switching between them morphs
every plant to its new position:

- **GitHub** (default) — the familiar 7 × ~53 strip, weeks running left to right
- **4 × 3** — twelve mini calendars, four across
- **6 × 2** — twelve mini calendars, six across

You can orbit and zoom, hover any plant for its date and count, pick a calendar
year (or the rolling past year), and switch between day and night.

Because the 4 × 3 and 6 × 2 grids hold exactly twelve months, choosing one while
the rolling "past year" window is active — which spans thirteen calendar months —
also switches to the most recent calendar year, so the layout's name stays
truthful.

Gardens are shareable: the username lives in the path, and all placement jitter is
seeded off it, so a given user always grows the exact same garden.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — `/` redirects to `/torvalds` so the page is
never empty.

- `/[username]` — any GitHub user, e.g. `/gaearon`
- `/[username]?year=2024` — a specific calendar year
- `/[username]?mock=1` — seeded mock data in the same per-day shape, so the scene
  works with the API unreachable or rate-limited

No API token and no environment variables. Data comes from
[github-contributions-api.jogruber.de](https://github-contributions-api.jogruber.de)
server-side, with `revalidate: 3600` to match that API's own one-hour cache.

## Performance notes

**Instancing is the whole ballgame.** The plants render as **one `InstancedMesh`
per level** — 4 batches, since level 0 draws nothing — rather than one mesh per
day. Verified against the live page by patching `drawElementsInstanced` on the
WebGL2 context: **4 instanced draw calls** per frame, with instance counts
`[46, 53, 69, 87]` matching the four level batches exactly. Rendering ~365
individual meshes instead would mean ~255 draw calls for the same picture, which
tanks both frame rate and the Lighthouse score.

**Vertex budget: ~70,000 vertices for a typical garden** (~255 drawn plants;
level-0 days render nothing). Per plant that's 180 / 240 / 330 / 390 vertices for
levels 1–4. Each plant is a single merged `BufferGeometry` built once at module
scope from low-poly primitives — a 5-segment `CylinderGeometry` trunk plus
`IcosahedronGeometry` canopies at detail 0 — so the whole garden uses 4 geometries
total. Continuous variation comes from per-instance scale and rotation, never from
extra geometry.

Also worth noting:

- **All three layouts are computed once** at data-load time into parallel arrays
  indexed identically by day. Switching layouts lerps the per-instance matrices
  over ~1.2s and stops uploading once it settles — no geometry rebuild, no
  remount, no extra sets of instances.
- **Animation lives in a ref advanced inside the R3F frame loop**, not React
  state. A 1.2s morph at 60fps would otherwise re-render the React tree ~72 times
  for no reason.
- **The camera never fights the user.** A layout change eases the camera to new
  framing, but that reframe is cancelled the moment the user touches the
  controls, and is capped at 1.2s regardless. A resize updates the framing used
  by the *next* reframe rather than starting one — previously the browser's
  initial layout settle would start a reframe that overwrote `camera.position`
  every frame, which is what made dragging feel stubborn just after a load.
- **Camera framing is solved by projection, not a closed-form guess.** For a
  tilted plane the near edge sits much closer than the centre, so it projects
  far wider than `width / distance` implies; fitting by that formula clipped the
  panel layouts by ~30%. `framingFor` instead projects the layout's bounding
  corners (including plant height) and iterates on the overflow.
- `dpr={[1, 1.5]}` caps the render resolution so high-DPI phones don't render at 3x.
- The three.js chunk (~236 KB gzipped of ~400 KB total) is lazy-loaded via
  `dynamic(..., { ssr: false })` and never blocks the initial HTML.

## Accessibility and the reduced-motion path

Under `prefers-reduced-motion`, users get a flat 2D contribution graph **rendered
on the server**, so it's in the initial HTML before any JS runs. Which view is
visible is decided in CSS, not JavaScript, so there's no client-side flash and no
dependency on hydration. The WebGL context is never created for those users at
all — verified: 0 `<canvas>` elements on the page. The static view also carries a
screen-reader table of every day's date and count.

## Architecture notes

R3F can't server-render — there's no WebGL context on the server — so the client
boundary matters:

- `app/[username]/page.tsx` is a **server component**; it does the fetch and the
  `notFound()` handling.
- `GardenExperience.tsx` is the client shell that owns UI state and performs the
  `dynamic(() => import('./Garden'), { ssr: false })`. This has to live in a
  client component: `ssr: false` is not allowed in a server component in this
  version of Next.
- `Garden.tsx` carries the single `'use client'` directive for the entire canvas
  tree. Nothing below it repeats the directive.
- Contribution data is passed down as a plain serialisable prop. The client never
  refetches.

The one genuinely subtle piece: a raycast against an `InstancedMesh` returns an
`instanceId` scoped to *that batch*, so a `level → dayIndex[]` lookup is built at
the same time as the instance matrices. Without it, hover reports the wrong day.
This is verified by a test that sweeps the grid layout and checks that every
screen row maps to exactly one weekday (43/43 sampled rows pass) — if the mapping
were wrong, hovered dates would scatter across weekdays.

## What I'd add with more time

- **Wind.** A vertex-shader sway on the canopies, amplitude scaled by level. The
  single biggest gain in making it feel alive, and nearly free on the GPU.
- **Month labels, and click to focus one.** Each panel already carries a `label`
  and `center` that nothing in the UI reads yet — the 4 × 3 and 6 × 2 grids
  really want their months named.
- **Real ground shaping.** Panels are flat quads on a flat plane; gentle terrain
  displacement and contact shadows would sell the space far better than more
  polygons per plant.
- **Streak and milestone markers.** The data supports it and it's the kind of
  thing that makes a shared garden worth looking at twice.
- **Tests.** The layout maths and level→plant mapping are pure functions and
  should have unit tests; right now they're verified by browser-driven checks.
- **A deliberate empty/quiet-year design.** Currently handled correctly but
  plainly.

## Stack

Next.js 16 (App Router) · TypeScript · three.js · @react-three/fiber ·
@react-three/drei · Tailwind v4. Targets Vercel Hobby.
