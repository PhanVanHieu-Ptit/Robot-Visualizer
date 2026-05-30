# PROJECT_CONTEXT.md

## Purpose

Real-time 3D visualization of a warehouse robot fleet. Renders robot positions, statuses, battery levels, and task assignments on an interactive 3D warehouse floor. Intended for warehouse operators monitoring autonomous mobile robots (AMRs).

## Domain

Warehouse automation / AMR fleet management. No robotics SDK or URDF involved — robots are abstracted as positioned entities with status state.

## Maturity

**MVP / Prototype.** No tests, no CI/CD, no linting. Not hardened for production data volumes or adversarial inputs.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.0.0 |
| Build | Vite + @vitejs/plugin-react | latest |
| Language | TypeScript (strict mode) | ~5.8.3 |
| 3D Rendering | Three.js + React Three Fiber | latest |
| 3D Helpers | @react-three/drei (OrbitControls) | latest |
| State | Zustand | latest |
| Real-time | Socket.IO client | latest |
| Styling | Tailwind CSS v4 (Vite plugin) | latest |
| Icons | lucide-react | latest |

> **Note:** All runtime dependencies use `"latest"` version pins — a stability risk in production.

---

## External Dependencies

### Socket.IO Backend (`VITE_SOCKET_URL`)

- Default: `http://localhost:3001`
- Configured via `.env` / `.env.example`
- The frontend subscribes to a single event: `robot:update`
- Expected payload shape: the `Robot` interface in `src/types/index.ts`
- **No auth, no TLS, no schema validation** — assumed trusted local backend

### Fallback Behavior

When the Socket.IO connection is unavailable, `useSimulation` activates a 500ms interval loop that generates random robot movement via `mockDataGenerator.ts`. This allows frontend development without a running backend.

---

## Robot Data Model

```
Robot {
  id: string
  x, y, z: number          // World-space position (bounds: ~[-24, 24])
  status: 'idle' | 'moving' | 'charging' | 'error'
  speed: number
  batteryLevel: number      // 0–100
  taskId?: string
}
```

## Warehouse Data Model

```
Warehouse {
  width, depth, height: number
  shelves: Shelf[]          // 20 shelves in 5×4 grid (hardcoded)
  zones: Zone[]             // 3 zones: charging, entry, staging (hardcoded)
}
```

---

## Constraints & Assumptions

- Backend server is local/trusted — no authentication or TLS implemented
- Warehouse layout is static — generated once at startup, not configurable at runtime
- Robot count defaults to 10 in simulation — no fleet size configuration exposed
- Position coordinates map 1:1 to Three.js world units (no coordinate transform layer)
- No URDF, joint kinematics, or path planning — robots are point entities
- `dist/` is committed to the repository (atypical; see KNOWN_ISSUES.md)

---

## Entry Points

| File | Role |
|------|------|
| `index.html` | HTML shell, mounts `<div id="root">` |
| `src/main.tsx` | React 19 root, renders `<App />` |
| `src/App.tsx` | Orchestrates hooks and top-level layout |
