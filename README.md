# Robot Visualizer

Real-time 3D warehouse fleet monitor. Renders up to 200 autonomous mobile robots (AMRs) moving, charging, and completing tasks inside a simulated warehouse — or streaming live data over Socket.IO.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| 3D renderer | React Three Fiber (R3F) + Three.js |
| 3D helpers | @react-three/drei |
| Post-processing | @react-three/postprocessing |
| Camera animation | @react-spring/three |
| State management | Zustand |
| Live data | Socket.IO client |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Build | Vite + TypeScript (strict) |

---

## Architecture

```
App
├── Suspense (fallback: LoadingScreen)
│   └── WarehouseScene (Canvas)
│       ├── WarehouseFloor  — floor plane, grid, zone overlays
│       ├── ShelfUnit       — 60 shelves via InstancedMesh
│       ├── RobotMesh       — up to 200 robots via InstancedMesh (body/dome/antenna/wheels)
│       ├── TrailLines      — movement trails via BufferGeometry line
│       ├── TargetIndicators — destination rings
│       ├── ChargingStations — 6 animated charging pads
│       ├── DustParticles   — 500 ambient dust motes via Points
│       ├── CameraController — preset (top / isometric / follow) and follow mode
│       ├── CameraFlyIn     — 2-second spring-driven fly-in on load
│       ├── OrbitControls   — interactive pan / zoom / rotate
│       ├── SceneEffects    — Bloom, SSAO, Vignette via EffectComposer
│       └── ScreenshotCapture — registers gl.domElement.toDataURL trigger
├── FleetStatusHUD  — top-left: live counts (active, charging, errors, avg battery)
├── ControlPanel    — top-right: visibility toggles, speed, camera presets, screenshot
├── TimelineBar     — bottom: tasks-per-second area chart (60-point rolling window)
└── RobotDetailPanel — right slide-in: per-robot stats, force-charge, reset-error
```

**State** lives entirely in a single Zustand store (`src/store/robotStore.ts`). Scene components read from the store imperatively inside `useFrame` to avoid React re-renders on every tick.

**Canvas pattern**: All Three.js logic runs inside `InnerScene`, a private component mounted inside `<Canvas>`. This keeps R3F hooks (`useThree`, `useFrame`) scoped to the WebGL context and isolates 3D code from the React tree.

---

## How the Simulation Works

`FleetSimulator` (`src/simulation/FleetSimulator.ts`) is a tick-based physics engine:

- **Tick rate**: 100 ms × `simulationSpeed` multiplier (0.5×–3×)
- **Robot FSM**: `idle` → `moving` → `charging` → `idle`. Errors freeze a robot until manually reset.
- **Battery**: drains at –0.01/tick while moving; charges at +0.5/tick at a station. Auto-routes below 20%.
- **Collision avoidance**: robots skip X or Z steps independently when a shelf no-go zone blocks the path.
- **Tasks**: randomly assigned destination coordinates; completion increments a counter used by the timeline chart.

When `VITE_SOCKET_URL` is reachable the app switches to live data from the Socket.IO server (`robot:update` events patch individual robots). The simulation stops when connected.

---

## Performance

| Technique | Where |
|---|---|
| InstancedMesh (body, dome, antenna, 4 wheels) | `RobotMesh.tsx` — one draw call per geometry type |
| Geometry memoization via `useMemo` | `ShelfUnit`, `WarehouseFloor`, `ChargingStations` |
| Imperative `useFrame` loop | `RobotMesh` — no React state writes per frame |
| Position lerping in GPU scratch objects | `RobotMesh` — `THREE.Object3D` dummy reused each frame |
| LOD at distance > 80 units | `RobotMesh` — dome / antenna / wheels hidden, body only |
| Per-frame frustum culling | `RobotMesh` — instances outside camera view set to scale 0 |
| `React.memo(() => true)` | `RobotMesh` — parent re-renders never re-render the component |
| Label distance cull (> 50 units) | `RobotLabels` — HTML overlay skipped when too far |
| FPS Stats overlay | Dev mode only (`import.meta.env.DEV`) |

Target: 60 fps stable with 50 active robots on a mid-range GPU.

---

## Post-Processing

`SceneEffects.tsx` wraps the scene in an `EffectComposer`:

- **Bloom** (`intensity: 0.4, luminanceThreshold: 0.6`) — emissive robot lights and charging beams glow
- **SSAO** (`radius: 0.5, intensity: 0.5`) — ambient occlusion adds depth between shelves and floor. Remove the `<SSAO>` line in `SceneEffects.tsx` if frame rate drops on integrated graphics.
- **Vignette** (`darkness: 0.4, offset: 0.3`) — cinematic edge darkening

---

## How to Run Locally

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Production build
npm run build
npm run preview
```

**Optional**: point the app at a live Socket.IO backend:

```bash
VITE_SOCKET_URL=http://your-server:3001 npm run dev
```

When `VITE_SOCKET_URL` is not set or unreachable, the built-in fleet simulator runs automatically.

---

## Screenshot

Click **Save screenshot** in the control panel (top-right) to download a PNG of the current viewport. The canvas is initialized with `preserveDrawingBuffer: true` so the capture is always the last rendered frame.
