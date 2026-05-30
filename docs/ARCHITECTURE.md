# ARCHITECTURE.md

## System Overview

Single-page React application. No backend code in this repo. All state is ephemeral (in-memory Zustand store). Two data sources feed the store: a live Socket.IO connection or a local simulation loop.

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        App.tsx                          │
│         (layout shell + hook orchestration)             │
└────────────────────┬────────────────┬───────────────────┘
                     │                │
          ┌──────────▼──────┐  ┌──────▼──────────────┐
          │  3D Scene Layer │  │   UI Sidebar Layer   │
          │  WarehouseScene │  │   StatusBar          │
          │  ├─ RobotMesh[] │  │   RobotList          │
          │  └─ WarehouseFloor  │   RobotDetail        │
          └──────────┬──────┘  └──────────────────────┘
                     │                │
          ┌──────────▼────────────────▼───────────────┐
          │              Zustand Store                 │
          │         src/store/robotStore.ts            │
          │  robots[]  │  warehouse  │  selectedRobotId│
          └──────────┬──────────────┬─────────────────┘
                     │              │
          ┌──────────▼──┐  ┌────────▼──────────────────┐
          │  useWebSocket│  │     useSimulation         │
          │  Socket.IO   │  │  500ms interval           │
          │  :3001       │  │  mockDataGenerator.ts     │
          └─────────────┘  └───────────────────────────┘
```

---

## Component Tree

```
App
├── StatusBar           (header — connection status, fleet counts)
├── RobotList           (sidebar — scrollable fleet list, selection)
├── RobotDetail         (sidebar — detail panel for selected robot)
└── WarehouseScene      (Canvas — Three.js root)
    ├── WarehouseFloor  (Plane + GridHelper)
    └── RobotMesh[]     (one per robot — Box geometry + useFrame sync)
```

---

## State Model (Zustand)

**Store file:** `src/store/robotStore.ts`

```ts
interface RobotStore {
  robots: Robot[]
  warehouse: Warehouse
  selectedRobotId: string | null

  setRobots: (robots: Robot[]) => void
  updateRobot: (robot: Robot) => void
  setSelectedRobot: (id: string | null) => void
}
```

**Access pattern (required):**
```ts
// Correct — selector avoids unnecessary re-renders
const robots = useRobotStore((s) => s.robots)

// Incorrect — subscribes to entire store
const { robots } = useRobotStore()
```

---

## Data Flow

### Live Mode (Socket.IO connected)

```
Socket.IO server  →  robot:update event  →  useWebSocket
  →  store.updateRobot(robot)  →  Zustand store
  →  RobotMesh useFrame() reads store position  →  mesh.position.set()
```

### Simulation Mode (disconnected)

```
useSimulation (500ms setInterval)
  →  simulateRobotMovement(robots)  →  new Robot[]
  →  useRobotStore.setState({ robots })  →  Zustand store
  →  RobotMesh useFrame() reads store position  →  mesh.position.set()
```

**Mode switching:** `useWebSocket` exposes `connected: boolean`. `App.tsx` passes `!connected` to `useSimulation` as its `enabled` prop.

---

## 3D Rendering Pipeline

1. `WarehouseScene` creates a R3F `<Canvas>` with shadow maps and a fixed camera at `[30, 30, 30]`
2. `OrbitControls` (from drei) handles mouse-driven pan/orbit/zoom
3. Each `RobotMesh` registers a `useFrame` callback — reads `robot.x/y/z` from the store and calls `mesh.position.set()` every animation frame
4. Material color is derived from `status` via a `Record<RobotStatus, string>` map; emissive intensity toggles on selection

---

## File Map

| Path | Role |
|------|------|
| `src/main.tsx` | React root entry point |
| `src/App.tsx` | Hook wiring and layout grid |
| `src/store/robotStore.ts` | Zustand store — single source of truth |
| `src/hooks/useWebSocket.ts` | Socket.IO connection, `robot:update` listener |
| `src/hooks/useSimulation.ts` | Simulation loop — activates when disconnected |
| `src/simulation/mockDataGenerator.ts` | Pure functions: warehouse generation, robot movement |
| `src/types/index.ts` | All TypeScript interfaces and union types |
| `src/components/scene/WarehouseScene.tsx` | R3F Canvas root — lighting, camera, children |
| `src/components/scene/WarehouseFloor.tsx` | Floor plane + grid helper |
| `src/components/scene/RobotMesh.tsx` | Per-robot 3D cube with `useFrame` position sync |
| `src/components/ui/StatusBar.tsx` | Header — connection badge, fleet status counts |
| `src/components/ui/RobotList.tsx` | Sidebar list — all robots, click-to-select |
| `src/components/ui/RobotDetail.tsx` | Sidebar panel — selected robot details |

---

## Key Design Invariants

1. **Store is the single source of truth.** Neither the 3D scene nor UI components hold local robot state.
2. **3D position is driven by `useFrame`, not React re-renders.** Avoids React reconciliation overhead on every animation frame.
3. **Simulation and WebSocket are mutually exclusive.** Only one feeds the store at any time.
4. **`mockDataGenerator.ts` functions are pure.** No store imports, no side effects.
