# KNOWN_ISSUES.md

Detected bugs, anti-patterns, and risks found via static analysis of the codebase. No runtime testing performed. Items are severity-ranked within each category.

---

## High Severity

### H-1: No Input Validation on Socket.IO Payloads

**File:** `src/hooks/useWebSocket.ts`

**Issue:** The `robot:update` event handler passes the raw Socket.IO payload directly to `updateRobot()` with no type guard or schema validation. A malformed or adversarial payload will silently corrupt the Zustand store, potentially causing the 3D scene to crash or render garbage.

**Risk:** Data integrity, runtime crash.

**Remediation:** Add a runtime type guard or Zod schema at the Socket.IO event boundary:
```ts
import { z } from 'zod'
const RobotSchema = z.object({ id: z.string(), x: z.number(), ... })

socket.on('robot:update', (data: unknown) => {
  const result = RobotSchema.safeParse(data)
  if (result.success) updateRobot(result.data)
})
```

---

### H-2: `useSimulation` Bypasses Store Action Layer

**File:** `src/hooks/useSimulation.ts`

**Issue:** `useSimulation` calls `useRobotStore.setState({ robots: ... })` directly, bypassing the defined `setRobots` action in `robotStore.ts`. This breaks the encapsulation of the store's action interface and will cause subtle bugs if `setRobots` ever gains side effects (e.g., derived state, middleware).

**Risk:** Encapsulation violation, future regression.

**Remediation:** Replace `useRobotStore.setState(...)` with `useRobotStore.getState().setRobots(...)`.

---

### H-3: No Socket.IO Reconnect Cap

**File:** `src/hooks/useWebSocket.ts`

**Issue:** Socket.IO client will attempt to reconnect indefinitely when the server is unreachable. There is no `reconnectionAttempts` limit configured. In a production environment, this produces unbounded background network traffic and may prevent the simulation fallback from fully taking over.

**Risk:** Resource waste, unexpected behavior in offline scenarios.

**Remediation:**
```ts
const socket = io(url, {
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
})
```

---

## Medium Severity

### M-1: Battery Never Recharges in Simulation

**File:** `src/simulation/mockDataGenerator.ts`

**Issue:** `simulateRobotMovement()` decrements `batteryLevel` by 0.05 per 500ms tick for moving robots but has no recharge logic. Robots with `status: 'charging'` do not gain battery. After ~16 minutes of simulation, all moving robots reach 0% and remain stuck.

**Risk:** Simulation becomes meaningless over time; confusing for demos.

**Remediation:** Add recharge logic in simulation: robots in `charging` zones increment battery; robots reaching 0% transition to `error` or `charging` status.

---

### M-2: Warehouse Layout is Hardcoded

**File:** `src/simulation/mockDataGenerator.ts` → `generateWarehouse()`

**Issue:** The warehouse is always 5×4 shelves with 3 fixed zones. There is no configuration surface (env var, JSON file, API) to change the layout at runtime.

**Risk:** Scalability, configurability.

**Remediation:** Accept a `WarehouseConfig` parameter to `generateWarehouse()` or load layout from a JSON file specified via `VITE_WAREHOUSE_CONFIG`.

---

### M-3: `useFrame` Runs Unconditionally in `RobotMesh`

**File:** `src/components/scene/RobotMesh.tsx`

**Issue:** Every `RobotMesh` registers a `useFrame` callback that calls `mesh.position.set(robot.x, robot.y, robot.z)` on every animation frame (~60fps), even when the robot is idle and its position has not changed.

**Risk:** Unnecessary CPU work; compounds with fleet size.

**Remediation:** Track previous position in a ref and skip `set()` when coordinates are unchanged:
```ts
useFrame(() => {
  if (
    meshRef.current.position.x !== robot.x ||
    meshRef.current.position.z !== robot.z
  ) {
    meshRef.current.position.set(robot.x, robot.y, robot.z)
  }
})
```

---

### M-4: No Memoization on `RobotList` Items

**File:** `src/components/ui/RobotList.tsx`

**Issue:** `RobotList` renders one element per robot. Because the `robots` array reference changes on every simulation tick (new array created in `simulateRobotMovement`), all list items re-render every 500ms regardless of whether their individual robot data changed.

**Risk:** UI jank at fleet sizes above ~50 robots.

**Remediation:** Extract a `RobotListItem` component and wrap with `React.memo`. Use a stable identity (robot `id`) as the key.

---

## Low Severity / Scalability Risks

### L-1: No Test Infrastructure

**Issue:** Zero test files, no test runner configured, no testing dependencies in `package.json`.

**Risk:** Any refactor or new feature can silently break existing behavior with no automated safety net.

**Remediation:** Add Vitest (natural fit with Vite). Start with unit tests for pure functions in `mockDataGenerator.ts` and the Zustand store actions.

---

### L-2: No Linting or Formatting Enforcement

**Issue:** No ESLint config, no Prettier config, no `.editorconfig`.

**Risk:** Code style diverges as the project grows or adds contributors. TypeScript `strict` mode catches type errors but not style or logic smells.

**Remediation:** Add `eslint` with `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `@typescript-eslint/eslint-plugin`. Add Prettier with `prettier-plugin-tailwindcss`.

---

### L-3: `src/types/index.ts` Will Not Scale

**Issue:** All types centralized in one 39-line file. Acceptable now but becomes a merge-conflict hotspot and cognitive burden past ~10 domain types.

**Risk:** Maintenance friction as domain grows.

**Remediation:** Split into `src/types/robot.ts`, `src/types/warehouse.ts`, `src/types/socket.ts` when the file exceeds ~80 lines.

---

### L-4: No Frustum Culling or LOD for Robot Meshes

**File:** `src/components/scene/WarehouseScene.tsx`, `RobotMesh.tsx`

**Issue:** All robots are rendered unconditionally every frame. Three.js performs basic frustum culling automatically, but with many robots the draw call count grows linearly.

**Risk:** Frame rate degradation at 100+ robots.

**Remediation:** For large fleets, use `InstancedMesh` (single draw call for all robots of same geometry/material) instead of one mesh per robot.

---

### L-5: No Batch Update Protocol

**Issue:** The Socket.IO event `robot:update` sends one robot per event. A fleet of 100 robots produces 100 individual store updates per tick, each triggering a Zustand subscriber notification.

**Risk:** Performance bottleneck at scale.

**Remediation:** Negotiate a `robots:batch` event with the backend that sends all updates in one payload, then call `setRobots()` once per tick.

---

### L-6: All Runtime Dependencies Pinned to `"latest"`

**File:** `package.json`

**Issue:** All `dependencies` and `devDependencies` use `"latest"` version specifiers. On a fresh `npm install`, the resolved versions may differ from what was originally tested.

**Risk:** Unexpected breaking changes on reinstall; non-reproducible builds.

**Remediation:** Pin to exact versions or semver ranges (e.g., `"^19.0.0"`). Lock file (`package-lock.json`) mitigates this in practice but `"latest"` is still poor practice.

---

### L-7: `dist/` Committed to Repository

**Issue:** The `dist/` build output directory is not in `.gitignore` and is committed to the repository.

**Risk:** Git history bloated by binary assets; merge conflicts on build artifacts; misleading repo state.

**Remediation:** Add `dist/` to `.gitignore`. Deploy build artifacts via CI/CD pipeline, not source control.

---

## Assumptions in This Analysis

- Source code was analyzed statically — no runtime behavior was observed
- Backend server behavior inferred from client-side event names only (`robot:update`)
- No git blame or commit history was examined — all issues are present-state findings
- Performance thresholds (e.g., "100+ robots") are estimates based on common Three.js benchmarks, not measured profiling
