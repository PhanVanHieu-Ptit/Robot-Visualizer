# Real-time 3D Warehouse Robot Fleet Visualizer

Browser-native digital twin simulating 50+ concurrent autonomous mobile robots (AMRs) inside a warehouse — rendered at 60 fps with Three.js instanced geometry, a tick-based FSM telemetry engine, and optional live Socket.IO data streaming.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r168-black?logo=threedotjs)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)](https://robot-visualizer.vercel.app)

---

## Live Demo

**[robot-visualizer.vercel.app](https://robot-visualizer.vercel.app)**

Add `?demo=true` to auto-play a scripted scenario:
- **t = 5 s** — 3 robots simultaneously route to charging stations
- **t = 10 s** — 1 robot enters error state; 2 others emergency-reroute
- **t = 20 s** — activity burst: all idle robots pick up tasks

---

## Screenshots

<!-- Replace with actual screenshots once deployed -->
| 3D Fleet View | Robot Detail Panel |
|---|---|
| ![Fleet overview](docs/screenshot-fleet.png) | ![Detail panel](docs/screenshot-detail.png) |

---

## Key Technical Challenges Solved

**1. Instanced rendering for 50+ robots at 60 fps**
Each robot is composed of 6 geometry types (body, dome, antenna, 4 wheels). All instances of the same geometry share one draw call via `THREE.InstancedMesh`, reducing GPU overhead from O(n·6) to O(6) draw calls regardless of robot count.

**2. Imperative `useFrame` loop — zero React re-renders per tick**
Robot positions are written directly to `InstancedMesh` matrices inside a `useFrame` callback, bypassing React's reconciler entirely. The Zustand store is read via `getState()` (not a hook subscription) so the 3D scene never triggers a component re-render during animation.

**3. Per-robot FSM telemetry engine**
`FleetSimulator` runs a deterministic 100 ms tick loop with a four-state FSM per robot (`idle → moving → charging → idle`, with `error` as a terminal state). Battery drain, low-battery rerouting, shelf collision avoidance, and task scheduling are all resolved in a single O(n) pass per tick.

**4. Digital twin with live data socket swap**
When `VITE_SOCKET_URL` is reachable the app transparently switches from the local simulator to live `robot:update` events over Socket.IO — same store, same renderer, zero code changes. Falls back to local simulation when offline.

**5. LOD, frustum culling, and ring-buffer trails**
At camera distance > 80 units, dome/antenna/wheels are hidden (body-only LOD). Off-screen instances are scaled to zero before the GPU draw. Movement trails use a 30-point ring buffer per robot, updated only when a robot moves > 0.1 units, keeping GC pressure flat.

---

## Architecture

```
App
├── Suspense (fallback: LoadingScreen)
│   └── WarehouseScene (R3F Canvas)
│       ├── WarehouseFloor    — floor plane, grid, zone overlays
│       ├── ShelfUnit         — 60 shelves via InstancedMesh
│       ├── RobotMesh         — up to 200 robots via InstancedMesh (6 geometries)
│       ├── TrailLines        — ring-buffer movement trails (BufferGeometry)
│       ├── TargetIndicators  — destination rings
│       ├── ChargingStations  — 6 animated charging pads
│       ├── DustParticles     — 500 ambient motes via Points
│       ├── CameraController  — preset (top / isometric / follow) + spring fly-in
│       ├── OrbitControls     — interactive pan / zoom / rotate
│       └── SceneEffects      — Bloom, SSAO, Vignette (EffectComposer)
├── FleetStatusHUD    — live counts (active, charging, errors, avg battery)
├── ControlPanel      — visibility toggles, speed, camera presets, screenshot
├── TimelineBar       — tasks-per-second area chart (60-point rolling window)
└── RobotDetailPanel  — per-robot stats, force-charge, reset-error

State: single Zustand store (robotStore.ts)
  └── Read imperatively inside useFrame — no hook subscriptions in hot path

Simulation: FleetSimulator (src/simulation/FleetSimulator.ts)
  └── Tick rate: 100 ms × simulationSpeed multiplier (0.5×–3×)
  └── Each tick: O(n) FSM update → push to Zustand → InstancedMesh matrix write
```

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| 3D renderer | React Three Fiber (R3F) + Three.js |
| 3D helpers | @react-three/drei |
| Post-processing | @react-three/postprocessing (Bloom, SSAO, Vignette) |
| Camera animation | @react-spring/three |
| State management | Zustand |
| Live data | Socket.IO client |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Build | Vite + TypeScript (strict) |
| Deploy | Vercel (GitHub Actions → push to main) |

---

## Performance

| Technique | Where |
|---|---|
| InstancedMesh (6 geometry types) | `RobotMesh.tsx` — one draw call per geometry |
| Geometry memoization via `useMemo` | `ShelfUnit`, `WarehouseFloor`, `ChargingStations` |
| Imperative `useFrame` + `getState()` | `RobotMesh` — no React re-renders per frame |
| `THREE.Object3D` dummy reused each frame | `RobotMesh` — matrix scratch object |
| LOD at distance > 80 units | `RobotMesh` — dome / antenna / wheels hidden |
| Per-frame frustum culling | `RobotMesh` — out-of-view instances scaled to 0 |
| `React.memo(() => true)` | `RobotMesh` — immune to parent re-renders |
| Ring-buffer trails (30 points) | `useTrails` — GC-flat, updated only on movement |
| Label distance cull (> 50 units) | HTML overlays skipped when too far |

Target: **60 fps stable with 50 active robots** on a mid-range GPU.

---

## Post-Processing

`SceneEffects.tsx` wraps the scene in an `EffectComposer`:
- **Bloom** (`intensity: 0.4, luminanceThreshold: 0.6`) — robot lights and charging beams glow
- **SSAO** (`radius: 0.5, intensity: 0.5`) — ambient occlusion adds depth between shelves
- **Vignette** (`darkness: 0.4, offset: 0.3`) — cinematic edge darkening

---

## How to Run Locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
```

**Optional** — connect to a live Socket.IO backend:
```bash
VITE_SOCKET_URL=http://your-server:3001 npm run dev
```

---

## Deploy to Vercel

1. Import the repo in [vercel.com/new](https://vercel.com/new) — framework preset: **Vite**
2. Add three GitHub Secrets for the CI workflow:
   - `VERCEL_TOKEN` — from Vercel account settings
   - `VERCEL_ORG_ID` — from `.vercel/project.json` after first `vercel link`
   - `VERCEL_PROJECT_ID` — same file

Push to `main` → GitHub Actions builds and deploys automatically.

---

## CV / Bio

**Real-time 3D Warehouse Robot Fleet Visualizer** — Built a browser-native digital twin simulating 50+ concurrent autonomous mobile robots with Three.js and React Three Fiber, achieving 60fps via InstancedMesh instanced rendering, imperative per-frame GPU updates, and a tick-based FSM telemetry engine with live Socket.IO data streaming.

Stack: Three.js · React Three Fiber · TypeScript · Zustand · Socket.IO · Vite · Vercel. Techniques: instanced draw calls, frustum culling, LOD, post-processing (Bloom/SSAO/Vignette), real-time robot state telemetry, digital twin simulation.
